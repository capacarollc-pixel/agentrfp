import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getOrgUsage } from "@/lib/usage";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from("users").select("org_id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const usage = await getOrgUsage(profile.org_id);
    return NextResponse.json(usage);
  } catch (err) {
    console.error("Usage error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
