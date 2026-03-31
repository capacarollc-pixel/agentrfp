import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient, type Connector } from "@/lib/connectors/base";
import { importFromServiceNow, exportToServiceNow } from "@/lib/connectors/servicenow";
import { importFromCoupa, exportToCoupa } from "@/lib/connectors/coupa";
import { importFromAriba, exportToAriba } from "@/lib/connectors/ariba";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectorId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from("users").select("org_id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: connector } = await admin
      .from("connectors")
      .select("*")
      .eq("id", connectorId)
      .eq("org_id", profile.org_id)
      .single();

    if (!connector) {
      return NextResponse.json({ error: "Connector not found" }, { status: 404 });
    }

    const { direction, rfpId } = await request.json();

    if (direction === "import") {
      return await handleImport(connector as Connector, profile.org_id, user.id, admin);
    } else if (direction === "export" && rfpId) {
      return await handleExport(connector as Connector, profile.org_id, user.id, rfpId, admin);
    } else {
      return NextResponse.json({ error: "Invalid direction or missing rfpId" }, { status: 400 });
    }
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}

async function handleImport(
  connector: Connector,
  orgId: string,
  userId: string,
  admin: ReturnType<typeof getAdminClient>
) {
  let result: { questions: Array<{ external_id: string; question_text: string; section: string | null; response_type: string; response_options: string[] }>; assessmentId?: string; eventId?: string; projectId?: string };

  switch (connector.type) {
    case "servicenow": {
      const r = await importFromServiceNow(connector);
      result = { ...r, questions: r.questions };
      break;
    }
    case "coupa": {
      const r = await importFromCoupa(connector);
      result = { ...r, questions: r.questions };
      break;
    }
    case "ariba": {
      const r = await importFromAriba(connector);
      result = { ...r, questions: r.questions };
      break;
    }
    default:
      return NextResponse.json({ error: "Unsupported connector type" }, { status: 400 });
  }

  // Create RFP from imported questions
  const externalId = result.assessmentId || result.eventId || result.projectId || "";
  const { data: rfp } = await admin
    .from("rfps")
    .insert({
      org_id: orgId,
      title: `${connector.name} Import - ${new Date().toLocaleDateString()}`,
      status: "in_progress",
      created_by: userId,
    })
    .select()
    .single();

  if (rfp && result.questions.length > 0) {
    const questionRows = result.questions.map((q, idx) => ({
      rfp_id: rfp.id,
      org_id: orgId,
      question_text: q.question_text,
      section: q.section,
      order_index: idx,
      status: "pending",
      response_type: q.response_type,
      response_options: q.response_options,
    }));

    await admin.from("questions").insert(questionRows);
  }

  // Log sync
  await admin.from("connector_sync_log").insert({
    connector_id: connector.id,
    org_id: orgId,
    direction: "import",
    status: "success",
    records_processed: result.questions.length,
    metadata: { external_id: externalId, rfp_id: rfp?.id },
  });

  await admin.from("connectors").update({ last_sync_at: new Date().toISOString() }).eq("id", connector.id);

  return NextResponse.json({
    success: true,
    rfpId: rfp?.id,
    questionsImported: result.questions.length,
  });
}

async function handleExport(
  connector: Connector,
  orgId: string,
  userId: string,
  rfpId: string,
  admin: ReturnType<typeof getAdminClient>
) {
  // Get questions and answers for this RFP
  const { data: questions } = await admin
    .from("questions")
    .select("*, answers(*)")
    .eq("rfp_id", rfpId)
    .eq("org_id", orgId)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "No questions to export" }, { status: 400 });
  }

  const answers = questions.map((q) => ({
    external_id: q.id, // Would need mapping to external IDs
    response_value: q.response_value || null,
    answer_text: q.answers?.[0]?.content || "",
  }));

  // Get the external reference from sync log
  const { data: lastImport } = await admin
    .from("connector_sync_log")
    .select("metadata")
    .eq("connector_id", connector.id)
    .eq("direction", "import")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const externalId = (lastImport?.metadata as Record<string, string>)?.external_id || "";

  let exported = 0;

  switch (connector.type) {
    case "servicenow": {
      const r = await exportToServiceNow(connector, externalId, answers);
      exported = r.exported;
      break;
    }
    case "coupa": {
      const r = await exportToCoupa(connector, externalId, answers);
      exported = r.exported;
      break;
    }
    case "ariba": {
      const r = await exportToAriba(connector, externalId, answers);
      exported = r.exported;
      break;
    }
  }

  await admin.from("connector_sync_log").insert({
    connector_id: connector.id,
    org_id: orgId,
    direction: "export",
    status: "success",
    records_processed: exported,
    metadata: { rfp_id: rfpId, external_id: externalId },
  });

  await admin.from("connectors").update({ last_sync_at: new Date().toISOString() }).eq("id", connector.id);

  return NextResponse.json({ success: true, exported });
}
