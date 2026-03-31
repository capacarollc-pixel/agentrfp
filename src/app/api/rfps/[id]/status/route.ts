import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rfpId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: rfp } = await admin
      .from("rfps")
      .select("status")
      .eq("id", rfpId)
      .eq("org_id", profile.org_id)
      .single();

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Get question count for progress
    const { count } = await admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("rfp_id", rfpId);

    const { count: answeredCount } = await admin
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("rfp_id", rfpId)
      .neq("status", "pending");

    let progress = "";
    if (rfp.status === "parsing") {
      progress = `Parsed ${count || 0} questions so far...`;
    } else if (rfp.status === "in_progress") {
      progress = `Generated ${answeredCount || 0}/${count || 0} answers...`;
    }

    return NextResponse.json({
      status: rfp.status,
      questionCount: count || 0,
      answeredCount: answeredCount || 0,
      progress,
    });
  } catch (err) {
    console.error("Status error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
