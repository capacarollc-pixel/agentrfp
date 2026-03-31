import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cleanAnswerForLibrary } from "@/lib/clean-answer";
import { categorizeQuestion } from "@/lib/sections";
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all non-approved questions with answers
    const { data: questions } = await admin
      .from("questions")
      .select("*, answers(*)")
      .eq("rfp_id", rfpId)
      .eq("org_id", profile.org_id)
      .neq("status", "approved");

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions to approve" }, { status: 400 });
    }

    let approvedCount = 0;

    for (const q of questions) {
      const answer = q.answers?.[0];
      if (!answer) continue;

      // Update question status
      await admin
        .from("questions")
        .update({ status: "approved" })
        .eq("id", q.id);

      // Auto-categorize and save to answer library
      const category = categorizeQuestion(q.question_text);
      const tags = [category.sectionLabel];
      if (q.section && !tags.includes(q.section)) {
        tags.push(q.section);
      }

      const { data: existing } = await admin
        .from("answer_library")
        .select("id, version")
        .eq("org_id", profile.org_id)
        .eq("question", q.question_text)
        .single();

      if (existing) {
        await admin
          .from("answer_library")
          .update({
            answer: cleanAnswerForLibrary(answer.content),
            tags,
            version: existing.version + 1,
            approved_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await admin.from("answer_library").insert({
          org_id: profile.org_id,
          question: q.question_text,
          answer: cleanAnswerForLibrary(answer.content),
          tags,
          version: 1,
          approved_by: user.id,
        });
      }

      approvedCount++;
    }

    // Update RFP status to completed
    await admin
      .from("rfps")
      .update({ status: "completed" })
      .eq("id", rfpId);

    // Get RFP title for notification
    const { data: rfp } = await admin
      .from("rfps")
      .select("title")
      .eq("id", rfpId)
      .single();

    notifyIntegrations({
      orgId: profile.org_id,
      event: "rfp.completed",
      title: "RFP Completed",
      message: `All ${approvedCount} answers approved for "${rfp?.title || "RFP"}". Ready for export.`,
    }).catch(() => {});

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "rfp_all_approved",
      entity_type: "rfp",
      entity_id: rfpId,
      metadata: { approved_count: approvedCount },
    });

    return NextResponse.json({ success: true, approved: approvedCount });
  } catch (err) {
    console.error("Approve all error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
