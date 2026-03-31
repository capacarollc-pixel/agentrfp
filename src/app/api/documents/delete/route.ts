import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function DELETE(request: NextRequest) {
  try {
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

    const { id } = await request.json();

    const { data: doc } = await admin
      .from("documents")
      .select("id, title, file_path")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from storage
    if (doc.file_path) {
      await admin.storage.from("documents").remove([doc.file_path]);
    }

    // Cascade delete handles chunks
    await admin.from("documents").delete().eq("id", id);

    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "document_deleted",
      entity_type: "document",
      metadata: { title: doc.title },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete document error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
