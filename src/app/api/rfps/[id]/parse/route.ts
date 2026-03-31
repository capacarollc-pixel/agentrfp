import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getAIConfig, callAI } from "@/lib/ai";
import { extractText, extractExcelSheets } from "@/lib/extract";
import { notifyIntegrations } from "@/lib/notify";

/**
 * Robustly extract a JSON array from AI response text.
 * Handles markdown fences, truncated responses, and extra text.
 */
function extractJsonArray(text: string): Array<{ question_text: string; section: string | null }> {
  // Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue with recovery strategies
  }

  // Find the JSON array in the text (between first [ and last ])
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const jsonStr = cleaned.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(jsonStr);
    } catch {
      // Array might be truncated — try to fix it
    }

    // Try fixing truncated JSON: find last complete object
    const lastCompleteObj = jsonStr.lastIndexOf("}");
    if (lastCompleteObj > 0) {
      const fixed = jsonStr.slice(0, lastCompleteObj + 1) + "]";
      try {
        return JSON.parse(fixed);
      } catch {
        // One more attempt: remove trailing comma
        const noTrailingComma = fixed.replace(/,\s*\]$/, "]");
        try {
          return JSON.parse(noTrailingComma);
        } catch {
          // Give up
        }
      }
    }
  }

  throw new Error("Could not extract JSON array from response");
}

// Allow long-running parse (5 minutes max)
export const maxDuration = 300;

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

    // Get AI config
    const aiConfig = await getAIConfig(profile.org_id);
    if (!aiConfig) {
      return NextResponse.json(
        { error: "No API key configured. Go to Settings → API Keys to add your API key." },
        { status: 400 }
      );
    }
    console.log(`[RFP Parse] Using ${aiConfig.provider} (${aiConfig.model})`);

    // Mark RFP as parsing immediately
    await admin
      .from("rfps")
      .update({ status: "parsing" })
      .eq("id", rfpId)
      .eq("org_id", profile.org_id);

    // Get RFP
    const { data: rfp } = await admin
      .from("rfps")
      .select("*")
      .eq("id", rfpId)
      .eq("org_id", profile.org_id)
      .single();

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Download and extract text from RFP file
    const { data: fileData } = await admin.storage
      .from("documents")
      .download(rfp.source_file_path);

    if (!fileData) {
      return NextResponse.json({ error: "RFP file not found in storage" }, { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = rfp.source_file_path.split(".").pop()?.toLowerCase() || "txt";
    // Determine processing strategy based on file type
    const isExcel = ["xlsx", "xls"].includes(ext);

    // Build processing chunks — per-sheet for Excel, text chunks for other formats
    let processingUnits: Array<{ label: string; text: string }> = [];

    if (isExcel) {
      const sheets = extractExcelSheets(buffer);
      console.log(`[RFP Parse] Excel file with ${sheets.length} sheets`);
      sheets.forEach((s) =>
        console.log(`[RFP Parse]   Sheet "${s.sheetName}": ${s.rowCount} rows, ${s.text.length} chars`)
      );
      processingUnits = sheets.map((s) => ({
        label: s.sheetName,
        text: s.text,
      }));
    } else {
      const text = await extractText(buffer, ext);
      console.log(`[RFP Parse] ${ext.toUpperCase()} file: ${text.length} chars`);

      // Split large non-Excel documents into chunks
      const MAX_CHUNK_SIZE = 15000;
      if (text.length <= MAX_CHUNK_SIZE) {
        processingUnits = [{ label: "Document", text }];
      } else {
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = "";
        let chunkIdx = 1;

        for (const para of paragraphs) {
          if (currentChunk.length + para.length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
            processingUnits.push({ label: `Part ${chunkIdx}`, text: currentChunk });
            currentChunk = para;
            chunkIdx++;
          } else {
            currentChunk += (currentChunk ? "\n\n" : "") + para;
          }
        }
        if (currentChunk) {
          processingUnits.push({ label: `Part ${chunkIdx}`, text: currentChunk });
        }
      }
    }

    console.log(`[RFP Parse] Processing ${processingUnits.length} units`);

    const systemPrompt = `You are an expert at analyzing RFP (Request for Proposal), RFI, and Security Questionnaire documents. Your job is to extract every question or requirement that needs a response.

Return a JSON array of objects with these fields:
- "question_text": The full question or requirement text
- "section": The section name, tab name, or category if identifiable (null if not)
- "response_type": One of: "freetext", "yes_no", "yes_no_na", "dropdown". Detect this from column headers like "Response", "Answer", "Yes/No", "Y/N/NA", or from dropdown/selection indicators.
- "response_options": If response_type is "dropdown", list the allowed values as an array (e.g., ["Yes", "No", "N/A", "Partial"]). Empty array for freetext.

Rules:
- Extract EVERY question, requirement, or item that needs a response
- Include numbered items, bullet points, and implicit questions
- Preserve the original wording
- If a section has sub-questions, extract each one separately
- For Excel/spreadsheet data: look for columns like "Question", "Requirement", "Control" — these contain the questions. Columns like "Response", "Answer", "Vendor Response", "Status" indicate a response field. Columns like "Comment", "Details", "Additional Information" indicate a comment field.
- If a column has values like Yes/No/N/A or a fixed set of options, set response_type accordingly
- Return ONLY a valid JSON array, no markdown fences, no extra text
- Start your response with [ and end with ]`;

    // Process each unit (sheet or chunk) and collect all questions
    const allQuestions: Array<{
      question_text: string;
      section: string | null;
    }> = [];

    for (let i = 0; i < processingUnits.length; i++) {
      const unit = processingUnits[i];

      // Skip very small units (likely empty or summary sheets)
      if (unit.text.length < 50) {
        console.log(`[RFP Parse] Skipping "${unit.label}" — too short (${unit.text.length} chars)`);
        continue;
      }

      console.log(`[RFP Parse] Processing "${unit.label}" (${i + 1}/${processingUnits.length})...`);

      const contextLabel = isExcel
        ? `Extract all questions from this section/tab of a security questionnaire. The section is: "${unit.label}"`
        : `Extract all questions and requirements from this RFP document (${unit.label})`;

      const userMessage = `${contextLabel}:\n\n${unit.text}`;

      // Add delay between units to avoid rate limits
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      try {
        const result = await callAI(aiConfig, systemPrompt, userMessage, {
          maxTokens: 8192,
          useQualityModel: true, // Use better model for parsing (structure matters)
        });

        const parsed = extractJsonArray(result);
        if (parsed && parsed.length > 0) {
          // Save questions immediately per sheet (incremental)
          const currentOffset = allQuestions.length;
          const questionRows = parsed.map((q, idx) => ({
            rfp_id: rfpId,
            org_id: profile.org_id,
            question_text: q.question_text,
            section: q.section || (isExcel ? unit.label : null),
            order_index: currentOffset + idx,
            status: "pending",
            response_type: (q as Record<string, unknown>).response_type || "freetext",
            response_options: (q as Record<string, unknown>).response_options || [],
          }));

          await admin.from("questions").insert(questionRows);

          const questionsWithSection = parsed.map((q) => ({
            ...q,
            section: q.section || (isExcel ? unit.label : null),
          }));
          allQuestions.push(...questionsWithSection);
          console.log(`[RFP Parse] "${unit.label}": extracted ${parsed.length} questions (${allQuestions.length} total)`);
        } else {
          console.log(`[RFP Parse] "${unit.label}": no questions found`);
        }
      } catch (parseErr) {
        console.error(`[RFP Parse] Failed to process "${unit.label}":`, parseErr);
        // Continue with other units
      }
    }

    if (allQuestions.length === 0) {
      await admin.from("rfps").update({ status: "draft" }).eq("id", rfpId);
      return NextResponse.json(
        { error: "No questions found in the RFP document." },
        { status: 400 }
      );
    }

    // Questions already saved incrementally per sheet above

    // Update RFP status
    await admin
      .from("rfps")
      .update({ status: "in_progress" })
      .eq("id", rfpId);

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "rfp_questions_parsed",
      entity_type: "rfp",
      entity_id: rfpId,
      metadata: { question_count: allQuestions.length },
    });

    // Notify integrations
    notifyIntegrations({
      orgId: profile.org_id,
      event: "rfp.questions_parsed",
      title: "RFP Questions Parsed",
      message: `${allQuestions.length} questions extracted from "${rfp.title}". AI drafts are being generated.`,
    }).catch(() => {});

    // Auto-generate answers in the background
    // Fire and forget — don't block the parse response
    const baseUrl = request.nextUrl.origin;
    fetch(`${baseUrl}/api/rfps/${rfpId}/generate`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }).catch((err) => console.error("Auto-generate failed:", err));

    return NextResponse.json({
      success: true,
      question_count: allQuestions.length,
      auto_generating: true,
    });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
