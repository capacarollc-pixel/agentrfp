import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Update an answer
export async function PUT(
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

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Get current answer to save as version
    const { data: currentAnswer } = await admin
      .from("answers")
      .select("content, version_number")
      .eq("id", answerId)
      .eq("org_id", profile.org_id)
      .single();

    if (!currentAnswer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Save current content as a version before overwriting
    await admin.from("answer_versions").insert({
      answer_id: answerId,
      org_id: profile.org_id,
      content: currentAnswer.content,
      version_number: currentAnswer.version_number,
      edited_by: user.id,
    });

    const newVersion = (currentAnswer.version_number || 1) + 1;

    const { error } = await admin
      .from("answers")
      .update({
        content,
        is_ai_generated: false,
        version_number: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerId)
      .eq("org_id", profile.org_id);

    if (error) {
      return NextResponse.json({ error: "Failed to update answer" }, { status: 500 });
    }

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "answer_edited",
      entity_type: "answer",
      entity_id: answerId,
      metadata: { version: newVersion },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Answer update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete an answer (to allow regeneration)
export async function DELETE(
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

    // Get the answer to find the question
    const { data: answer } = await admin
      .from("answers")
      .select("question_id")
      .eq("id", answerId)
      .eq("org_id", profile.org_id)
      .single();

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Delete answer
    await admin.from("answers").delete().eq("id", answerId);

    // Reset question status to pending
    await admin
      .from("questions")
      .update({ status: "pending" })
      .eq("id", answer.question_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Answer delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
