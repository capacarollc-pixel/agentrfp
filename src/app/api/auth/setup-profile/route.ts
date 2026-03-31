import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = getAdminClient();

    // Check if profile already exists
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: "Profile already exists" });
    }

    // Extract metadata from auth user
    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    const orgName = user.user_metadata?.org_name || `${fullName}'s Org`;

    // Create org
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError) {
      console.error("Failed to create org:", orgError);
      return NextResponse.json({ error: "Failed to create organization: " + orgError.message }, { status: 500 });
    }

    // Create user profile
    const { error: userError } = await admin.from("users").insert({
      id: user.id,
      org_id: org.id,
      email: user.email!,
      full_name: fullName,
      role: "admin",
    });

    if (userError) {
      console.error("Failed to create user:", userError);
      await admin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to create profile: " + userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Setup profile error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
