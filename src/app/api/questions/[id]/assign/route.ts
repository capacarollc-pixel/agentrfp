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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
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

    const { assignTo } = await request.json();

    const { error } = await admin
      .from("questions")
      .update({ assigned_to: assignTo || null })
      .eq("id", questionId)
      .eq("org_id", profile.org_id);

    if (error) {
      return NextResponse.json({ error: "Failed to assign" }, { status: 500 });
    }

    // Send notification if assigning to someone
    if (assignTo) {
      const { data: assignee } = await admin
        .from("users")
        .select("full_name")
        .eq("id", assignTo)
        .single();

      const { data: question } = await admin
        .from("questions")
        .select("question_text, rfp_id, rfps(title)")
        .eq("id", questionId)
        .single();

      const rfpTitle = (question?.rfps as unknown as { title: string })?.title || "RFP";
      const shortQuestion = question?.question_text?.slice(0, 80) + (question?.question_text && question.question_text.length > 80 ? "..." : "");

      notifyIntegrations({
        orgId: profile.org_id,
        event: "question.assigned",
        title: "Question Assigned",
        message: `${assignee?.full_name || "Someone"} has been assigned a question on "${rfpTitle}" by ${profile.full_name}:\n"${shortQuestion}"`,
        url: question?.rfp_id ? `${request.nextUrl.origin}/rfps/${question.rfp_id}` : undefined,
      }).catch(() => {});
    }

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "question_assigned",
      entity_type: "question",
      entity_id: questionId,
      metadata: { assigned_to: assignTo },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Assign error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
