import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cleanAnswerForLibrary } from "@/lib/clean-answer";
import { categorizeQuestion } from "@/lib/sections";

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
    const { id: answerId } = await params;
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

    // Get the answer with its question
    const { data: answer } = await admin
      .from("answers")
      .select("*, questions(id, question_text, section)")
      .eq("id", answerId)
      .eq("org_id", profile.org_id)
      .single();

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Update question status to approved
    await admin
      .from("questions")
      .update({ status: "approved" })
      .eq("id", answer.question_id);

    // Track who approved and when on the answer
    await admin
      .from("answers")
      .update({
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", answerId);

    // Save to answer library
    const question = answer.questions as { id: string; question_text: string; section: string | null };

    // Check if this Q&A already exists in the library
    const { data: existing } = await admin
      .from("answer_library")
      .select("id, version")
      .eq("org_id", profile.org_id)
      .eq("question", question.question_text)
      .single();

    // Auto-categorize the question
    const category = categorizeQuestion(question.question_text);
    const tags = [category.sectionLabel];
    if (question.section && !tags.includes(question.section)) {
      tags.push(question.section);
    }

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
        question: question.question_text,
        answer: cleanAnswerForLibrary(answer.content),
        tags,
        version: 1,
        approved_by: user.id,
      });
    }

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "answer_approved",
      entity_type: "answer",
      entity_id: answerId,
      metadata: { question_id: answer.question_id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
