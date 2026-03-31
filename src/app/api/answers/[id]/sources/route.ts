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

    // Get sources with chunk content and document title
    const { data: answerSources } = await admin
      .from("answer_sources")
      .select("id, relevance_rank, chunk_id, chunks(content, document_id, metadata)")
      .eq("answer_id", answerId)
      .order("relevance_rank", { ascending: true });

    const sources = (answerSources || []).map((s) => {
      const chunk = s.chunks as unknown as {
        content: string;
        document_id: string;
        metadata: Record<string, string> | null;
      };
      return {
        id: s.id,
        content: chunk?.content || "",
        document_title: chunk?.metadata?.source || "Knowledge Base",
        relevance_rank: s.relevance_rank,
      };
    });

    return NextResponse.json({ sources });
  } catch (err) {
    console.error("Sources error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
