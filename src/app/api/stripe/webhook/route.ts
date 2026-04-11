import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Helper to extract period dates from subscription (Stripe v22 uses nested objects)
function getPeriodDates(sub: Stripe.Subscription) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = sub as any;
  const start = s.current_period_start ?? s.billing_cycle_anchor;
  const end = s.current_period_end ?? s.ended_at;
  return {
    start: start ? new Date(typeof start === "number" ? start * 1000 : start).toISOString() : null,
    end: end ? new Date(typeof end === "number" ? end * 1000 : end).toISOString() : null,
  };
}

// Use service role client for webhook — no user session available
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.subscription
        ? (
            await stripe.subscriptions.retrieve(session.subscription as string)
          ).metadata.org_id
        : null;

      if (orgId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const period = getPeriodDates(subscription);
        await supabase.from("subscriptions").upsert(
          {
            org_id: orgId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            seats: subscription.items.data[0]?.quantity || 1,
            current_period_start: period.start,
            current_period_end: period.end,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "org_id" }
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata.org_id;

      if (orgId) {
        const period = getPeriodDates(subscription);
        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            seats: subscription.items.data[0]?.quantity || 1,
            current_period_start: period.start,
            current_period_end: period.end,
            updated_at: new Date().toISOString(),
          })
          .eq("org_id", orgId);
      }
      break;
    }

    case "invoice.payment_failed": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const invoiceSubId = invoice.subscription as string | undefined;
      if (invoiceSubId) {
        const subscription = await stripe.subscriptions.retrieve(invoiceSubId);
        const orgId = subscription.metadata.org_id;
        if (orgId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("org_id", orgId);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
