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
    const { id } = await params;
    const type = request.nextUrl.searchParams.get("type") || "";

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

    if (type === "knowledge") {
      const { data: chunk } = await admin
        .from("chunks")
        .select("id, content, metadata, document_id, documents(title)")
        .eq("id", id)
        .eq("org_id", profile.org_id)
        .single();

      if (!chunk) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({
        type: "knowledge",
        id: chunk.id,
        title: (chunk.documents as unknown as { title: string })?.title || "Knowledge Base",
        content: chunk.content,
      });
    }

    if (type === "library") {
      const { data: entry } = await admin
        .from("answer_library")
        .select("*")
        .eq("id", id)
        .eq("org_id", profile.org_id)
        .single();

      if (!entry) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({
        type: "library",
        id: entry.id,
        title: entry.question,
        content: entry.answer,
        tags: entry.tags,
        version: entry.version,
      });
    }

    if (type === "document") {
      const { data: doc } = await admin
        .from("documents")
        .select("*, chunks(id, content, chunk_index)")
        .eq("id", id)
        .eq("org_id", profile.org_id)
        .single();

      if (!doc) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const chunks = (doc.chunks || [])
        .sort((a: { chunk_index: number }, b: { chunk_index: number }) => a.chunk_index - b.chunk_index)
        .map((c: { content: string }) => c.content)
        .join("\n\n");

      return NextResponse.json({
        type: "document",
        id: doc.id,
        title: doc.title,
        content: chunks || "No content extracted.",
        file_type: doc.file_type,
        chunk_count: doc.chunk_count,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("Search detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
