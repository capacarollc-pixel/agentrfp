import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get org info
  const { data: profile } = await supabase
    .from("users")
    .select("org_id, organizations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { seats } = await req.json();
  const seatCount = Math.max(1, Math.min(seats || 1, 100));

  // Check if org already has a Stripe customer
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("org_id", profile.org_id)
    .single();

  let customerId = sub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { org_id: profile.org_id },
    });
    customerId = customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "AgentRFP Pro",
            description: `${seatCount} seat${seatCount > 1 ? "s" : ""} — AI-powered RFP response platform`,
          },
          unit_amount: 4900, // $49.00
          recurring: { interval: "month" },
        },
        quantity: seatCount,
      },
    ],
    subscription_data: {
      metadata: { org_id: profile.org_id },
    },
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
