import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
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

    const query = request.nextUrl.searchParams.get("q") || "";
    const type = request.nextUrl.searchParams.get("type") || "all";

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query}%`;
    const results: {
      type: string;
      id: string;
      title: string;
      excerpt: string;
      metadata?: Record<string, string>;
    }[] = [];

    // Search knowledge base chunks
    if (type === "all" || type === "knowledge") {
      const { data: chunks } = await admin
        .from("chunks")
        .select("id, content, document_id, metadata")
        .eq("org_id", profile.org_id)
        .ilike("content", searchTerm)
        .limit(10);

      if (chunks) {
        for (const chunk of chunks) {
          const meta = chunk.metadata as Record<string, string> | null;
          results.push({
            type: "knowledge",
            id: chunk.id,
            title: meta?.source || "Knowledge Base",
            excerpt: highlightMatch(chunk.content, query, 200),
            metadata: { document_id: chunk.document_id },
          });
        }
      }
    }

    // Search answer library
    if (type === "all" || type === "library") {
      const { data: libraryQ } = await admin
        .from("answer_library")
        .select("id, question, answer, tags")
        .eq("org_id", profile.org_id)
        .ilike("question", searchTerm)
        .limit(10);

      const { data: libraryA } = await admin
        .from("answer_library")
        .select("id, question, answer, tags")
        .eq("org_id", profile.org_id)
        .ilike("answer", searchTerm)
        .limit(10);

      // Dedupe
      const seen = new Set<string>();
      for (const entry of [...(libraryQ || []), ...(libraryA || [])]) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        results.push({
          type: "library",
          id: entry.id,
          title: entry.question,
          excerpt: highlightMatch(entry.answer, query, 200),
        });
      }
    }

    // Search documents
    if (type === "all" || type === "documents") {
      const { data: docs } = await admin
        .from("documents")
        .select("id, title, file_type, chunk_count, created_at")
        .eq("org_id", profile.org_id)
        .ilike("title", searchTerm)
        .limit(10);

      if (docs) {
        for (const doc of docs) {
          results.push({
            type: "document",
            id: doc.id,
            title: doc.title,
            excerpt: `${doc.file_type.toUpperCase()} · ${doc.chunk_count} chunks`,
          });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

function highlightMatch(text: string, query: string, maxLen: number): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "..." : "");

  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 120);
  let excerpt = text.slice(start, end);
  if (start > 0) excerpt = "..." + excerpt;
  if (end < text.length) excerpt = excerpt + "...";
  return excerpt;
}
