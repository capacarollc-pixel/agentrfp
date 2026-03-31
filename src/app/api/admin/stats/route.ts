import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "capacarollc@gmail.com").split(",");

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
    const { data: profile } = await admin.from("users").select("email").eq("id", user.id).single();
    if (!profile || !PLATFORM_ADMIN_EMAILS.includes(profile.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [users, orgs, rfps, docs, library] = await Promise.all([
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("organizations").select("id", { count: "exact", head: true }),
      admin.from("rfps").select("id", { count: "exact", head: true }),
      admin.from("documents").select("id", { count: "exact", head: true }),
      admin.from("answer_library").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      totalUsers: users.count || 0,
      totalOrgs: orgs.count || 0,
      totalRfps: rfps.count || 0,
      totalDocs: docs.count || 0,
      totalLibraryAnswers: library.count || 0,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
