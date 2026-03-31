import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyIntegrations } from "@/lib/notify";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
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
      .select("org_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { questionIds, assignTo, section } = await request.json();

    if (!questionIds || !assignTo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the assignee's name
    const { data: assignee } = await admin
      .from("users")
      .select("full_name, email")
      .eq("id", assignTo)
      .single();

    if (!assignee) {
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }

    // Bulk assign all questions in this section
    for (const qId of questionIds) {
      await admin
        .from("questions")
        .update({ assigned_to: assignTo })
        .eq("id", qId)
        .eq("org_id", profile.org_id);
    }

    // Get RFP title for the notification
    const { data: rfp } = await admin
      .from("rfps")
      .select("title")
      .eq("id", rfpId)
      .single();

    // Send notification via integrations (Slack, Teams, webhook)
    await notifyIntegrations({
      orgId: profile.org_id,
      event: "section.assigned",
      title: "Section Assigned",
      message: `${assignee.full_name} has been assigned to "${section || "Section"}" (${questionIds.length} questions) on "${rfp?.title || "RFP"}" by ${profile.full_name}.`,
      url: `${request.nextUrl.origin}/rfps/${rfpId}`,
    }).catch(() => {});

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "section_assigned",
      entity_type: "rfp",
      entity_id: rfpId,
      metadata: {
        section,
        assigned_to: assignTo,
        assigned_name: assignee.full_name,
        question_count: questionIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      assigned: questionIds.length,
      assignee: assignee.full_name,
    });
  } catch (err) {
    console.error("Assign section error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
