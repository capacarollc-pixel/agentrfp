import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  BorderStyle,
} from "docx";

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

    // Check compliance: does org require approval before export?
    const { data: org } = await admin
      .from("organizations")
      .select("require_approval_for_export")
      .eq("id", profile.org_id)
      .single();

    // Get questions with answers
    const { data: questions } = await admin
      .from("questions")
      .select("*, answers(*)")
      .eq("rfp_id", rfpId)
      .order("order_index", { ascending: true });

    if (org?.require_approval_for_export) {
      const unapproved = (questions || []).filter(
        (q) => q.status !== "approved" && q.answers?.length > 0
      );
      if (unapproved.length > 0) {
        return NextResponse.json(
          {
            error: `${unapproved.length} answer(s) need approval before export. Approve all answers or disable approval requirement in Settings.`,
          },
          { status: 403 }
        );
      }
    }

    // Build Word document
    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        text: rfp.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );

    // Metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date().toLocaleDateString()}`,
            size: 20,
            color: "888888",
          }),
          new TextRun({
            text: rfp.due_date
              ? `  |  Due: ${new Date(rfp.due_date).toLocaleDateString()}`
              : "",
            size: 20,
            color: "888888",
          }),
        ],
        spacing: { after: 400 },
      })
    );

    // Separator
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
        spacing: { after: 400 },
      })
    );

    let currentSection = "";

    for (const q of questions || []) {
      // Section header
      if (q.section && q.section !== currentSection) {
        currentSection = q.section;
        children.push(
          new Paragraph({
            text: q.section,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
      }

      // Question
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Q${q.order_index + 1}: `,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: q.question_text,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      );

      // Answer
      const answer = q.answers?.[0];
      if (answer) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: answer.content,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[No answer provided]",
                size: 22,
                color: "CC0000",
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "rfp_exported_docx",
      entity_type: "rfp",
      entity_id: rfpId,
    });

    const filename = `${rfp.title.replace(/[^a-zA-Z0-9]/g, "_")}_Response.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export DOCX error:", err);
    return NextResponse.json(
      { error: "Failed to export document" },
      { status: 500 }
    );
  }
}
