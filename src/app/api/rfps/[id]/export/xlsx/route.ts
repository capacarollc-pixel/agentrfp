import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

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

    // Check compliance
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
            error: `${unapproved.length} answer(s) need approval before export.`,
          },
          { status: 403 }
        );
      }
    }

    // Build spreadsheet data
    const hasResponseValues = (questions || []).some((q) => q.response_value);

    const rows = (questions || []).map((q, idx) => {
      const answer = q.answers?.[0];
      const row: Record<string, string | number> = {
        "#": idx + 1,
        Section: q.section || "",
        Question: q.question_text,
      };
      if (hasResponseValues) {
        row["Response"] = q.response_value || "";
      }
      row["Answer / Comment"] = answer?.content || "";
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 5 },   // #
      { wch: 20 },  // Section
      { wch: 60 },  // Question
      { wch: 80 },  // Answer
      { wch: 12 },  // Confidence
      { wch: 12 },  // Status
      { wch: 14 },  // AI Generated
      { wch: 20 },  // Assigned To
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RFP Response");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "rfp_exported_xlsx",
      entity_type: "rfp",
      entity_id: rfpId,
    });

    const filename = `${rfp.title.replace(/[^a-zA-Z0-9]/g, "_")}_Response.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export XLSX error:", err);
    return NextResponse.json(
      { error: "Failed to export spreadsheet" },
      { status: 500 }
    );
  }
}
