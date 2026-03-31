import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Restore a previous version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: answerId } = await params;
    const { versionId } = await request.json();

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

    // Get the version to restore
    const { data: version } = await admin
      .from("answer_versions")
      .select("content, version_number")
      .eq("id", versionId)
      .eq("org_id", profile.org_id)
      .single();

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Get current answer to save as a version first
    const { data: currentAnswer } = await admin
      .from("answers")
      .select("content, version_number")
      .eq("id", answerId)
      .eq("org_id", profile.org_id)
      .single();

    if (!currentAnswer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Save current as version
    await admin.from("answer_versions").insert({
      answer_id: answerId,
      org_id: profile.org_id,
      content: currentAnswer.content,
      version_number: currentAnswer.version_number,
      edited_by: user.id,
    });

    const newVersion = (currentAnswer.version_number || 1) + 1;

    // Restore the selected version
    await admin
      .from("answers")
      .update({
        content: version.content,
        version_number: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", answerId);

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "answer_version_restored",
      entity_type: "answer",
      entity_id: answerId,
      metadata: { restored_version: version.version_number, new_version: newVersion },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
