import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getAIConfig, callAI, type AIConfig } from "@/lib/ai";

// Allow long-running generation (5 minutes max)
export const maxDuration = 300;

// Normalized word-overlap + synonym-aware similarity (0-1 score)
function getSimpleSimilarity(a: string, b: string): number {
  // Normalize: lowercase, remove punctuation, stem common variants
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .map((w) => {
        // Basic stemming for common RFP/security terms
        if (w.endsWith("ing")) return w.slice(0, -3);
        if (w.endsWith("tion")) return w.slice(0, -4);
        if (w.endsWith("ment")) return w.slice(0, -4);
        if (w.endsWith("ness")) return w.slice(0, -4);
        if (w.endsWith("ies")) return w.slice(0, -3) + "y";
        if (w.endsWith("es")) return w.slice(0, -2);
        if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
        return w;
      });
  };

  // Common synonyms in RFP/security context
  const synonyms: Record<string, string> = {
    "pen": "penetrat", "pentest": "penetrat", "conduct": "perform",
    "organization": "company", "org": "company", "firm": "company",
    "employ": "staff", "worker": "staff", "personnel": "staff",
    "encrypt": "cryptograph", "cipher": "cryptograph",
    "authenticate": "auth", "mfa": "multifactor", "2fa": "multifactor",
    "incident": "breach", "vulnerability": "vuln", "assess": "evaluat",
    "backup": "recover", "disaster": "recover", "bcp": "recover",
    "monitor": "track", "log": "track", "audit": "track",
    "firewall": "network", "vpn": "network", "proxy": "network",
  };

  const wordsA = normalize(a).map((w) => synonyms[w] || w);
  const wordsB = normalize(b).map((w) => synonyms[w] || w);

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap++;
  }

  // Jaccard-like with Dice coefficient
  const score = (2 * overlap) / (setA.size + setB.size);

  // Bonus: if exact match after normalization
  if (wordsA.join(" ") === wordsB.join(" ")) return 1.0;

  return score;
}

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

    // Get AI config (provider + key + model)
    const aiConfig = await getAIConfig(profile.org_id);
    if (!aiConfig) {
      return NextResponse.json(
        { error: "No API key configured. Go to Settings → API Keys." },
        { status: 400 }
      );
    }
    console.log(`[Generate] Using ${aiConfig.provider} (${aiConfig.model})`);

    // Check for per-section question IDs
    let specificQuestionIds: string[] | null = null;
    try {
      const body = await request.json();
      if (body.questionIds && Array.isArray(body.questionIds)) {
        specificQuestionIds = body.questionIds;
      }
    } catch {
      // No body or invalid JSON — generate for all
    }

    // Get questions that need answers
    let query = admin
      .from("questions")
      .select("*, answers(id)")
      .eq("rfp_id", rfpId)
      .eq("org_id", profile.org_id)
      .order("order_index", { ascending: true });

    if (specificQuestionIds) {
      query = query.in("id", specificQuestionIds);
    }

    const { data: allQuestions } = await query;

    // Filter to only questions without answers
    const questions = (allQuestions || []).filter(
      (q) => !q.answers || q.answers.length === 0
    );

    // Mark RFP as in_progress for polling
    await admin
      .from("rfps")
      .update({ status: "in_progress" })
      .eq("id", rfpId);

    console.log(`[Generate] Starting: ${questions.length} questions to answer`);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "All questions already have answers. Edit individual answers to regenerate." },
        { status: 400 }
      );
    }

    // Get ALL knowledge base chunks for per-question retrieval
    const { data: allChunks } = await admin
      .from("chunks")
      .select("id, content, document_id, metadata")
      .eq("org_id", profile.org_id);

    const chunks = allChunks || [];

    // Helper: find most relevant chunks for a given question
    function findRelevantChunks(questionText: string, maxChunks: number = 8) {
      if (chunks.length === 0) return [];

      const qWords = new Set(
        questionText.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );

      const scored = chunks.map((chunk) => {
        const cWords = chunk.content.toLowerCase().split(/\s+/);
        let hits = 0;
        for (const word of cWords) {
          if (qWords.has(word)) hits++;
        }
        return { ...chunk, relevance: hits };
      });

      return scored
        .filter((c) => c.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxChunks);
    }

    const baseRules = `Rules:
- Write clean, professional responses ready to submit to a customer
- Do NOT include citation markers like [1], [2] or source references — the answer should stand on its own
- Do NOT mention "knowledge base" or "source material" in the answer
- If the knowledge base covers the topic, write confidently based on that information
- If the knowledge base doesn't fully cover the question, write the best answer you can and note at the end: "[NEEDS REVIEW: Not fully covered in knowledge base]"
- Do not fabricate specific claims, statistics, or capabilities
- Be concise, direct, and professional`;

    // Load answer library for reuse
    const { data: libraryEntries } = await admin
      .from("answer_library")
      .select("question, answer")
      .eq("org_id", profile.org_id);

    // Generate answers for each question with rate limit handling
    let answeredCount = 0;
    let reusedCount = 0;

    for (const question of questions) {
      try {
        let answerText: string;
        let confidence: string;
        let wasReused = false;
        let relevantChunks: typeof chunks = [];

        // First: check Answer Library for a matching past answer
        const libraryMatch = (libraryEntries || []).find((entry) => {
          const similarity = getSimpleSimilarity(
            question.question_text.toLowerCase(),
            entry.question.toLowerCase()
          );
          return similarity > 0.8;
        });

        if (libraryMatch) {
          // Reuse approved answer from library
          answerText = libraryMatch.answer;
          confidence = "high";
          wasReused = true;
          reusedCount++;
        } else {
          // Generate with AI
          if (answeredCount - reusedCount > 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          // Find relevant knowledge chunks for THIS question
          relevantChunks = findRelevantChunks(question.question_text);
          const knowledgeContext = relevantChunks.length > 0
            ? relevantChunks
                .map((c, i) =>
                  `[${i + 1}] ${c.content}\n(Source: ${(c.metadata as Record<string, string>)?.source || "Unknown"})`
                )
                .join("\n\n")
            : "";

          const systemPrompt = `You are an expert proposal writer helping respond to an RFP (Request for Proposal).

${
  knowledgeContext
    ? `You have access to the following approved company knowledge base. Base your answers on this information.

KNOWLEDGE BASE:
${knowledgeContext}`
    : "No company knowledge base is available yet. Provide a general professional response and clearly note that this answer needs review and company-specific details."
}

${baseRules}`;

          answerText = await callAI(aiConfig, systemPrompt, question.question_text, {
            maxTokens: 1024,
          });

          confidence = "none";
          if (knowledgeContext) {
            const needsReview = /\[NEEDS REVIEW/i.test(answerText);
            confidence = needsReview ? "low" : "high";
            answerText = answerText.replace(/\s*\[NEEDS REVIEW:.*?\]\s*/gi, "").trim();
          }
        }

        // Insert answer
        const { data: newAnswer } = await admin
          .from("answers")
          .insert({
            question_id: question.id,
            org_id: profile.org_id,
            content: answerText,
            confidence,
            is_ai_generated: !wasReused,
            created_by: user.id,
          })
          .select("id")
          .single();

        // Save source traceability (which chunks informed this answer)
        if (newAnswer && relevantChunks && relevantChunks.length > 0 && !wasReused) {
          const sourceRows = relevantChunks.slice(0, 5).map((c, i) => ({
            answer_id: newAnswer.id,
            chunk_id: c.id,
            relevance_rank: i,
          }));
          await admin.from("answer_sources").insert(sourceRows);
        }

        // Update question status
        await admin
          .from("questions")
          .update({ status: "drafted" })
          .eq("id", question.id);

        answeredCount++;
        console.log(`[Generate] ${answeredCount}/${questions.length} — answered "${question.question_text.slice(0, 60)}..."`);
      } catch (questionErr) {
        console.error(
          `Failed to generate answer for question ${question.id}:`,
          questionErr
        );
        // Continue with next question
      }
    }

    // Update RFP status
    await admin
      .from("rfps")
      .update({ status: "review" })
      .eq("id", rfpId);

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "answers_generated",
      entity_type: "rfp",
      entity_id: rfpId,
      metadata: {
        total_questions: questions.length,
        answered: answeredCount,
        reused_from_library: reusedCount,
      },
    });

    return NextResponse.json({
      success: true,
      answered: answeredCount,
      reused: reusedCount,
      total: questions.length,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
