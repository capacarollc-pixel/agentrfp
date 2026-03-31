import { Connector, ensureValidToken, ImportedQuestion, ExportAnswer } from "./base";

/**
 * Coupa Procurement Connector
 *
 * Imports: Sourcing events / questionnaires from Coupa
 * Exports: Completed responses back to Coupa
 */

export async function importFromCoupa(
  connector: Connector
): Promise<{ questions: ImportedQuestion[]; eventId: string }> {
  const token = await ensureValidToken(connector);
  const baseUrl = connector.instance_url;

  // Get open sourcing events
  const eventsRes = await fetch(
    `${baseUrl}/api/sourcing_events?status=published&fields=["id","name","commodity","event_type"]`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!eventsRes.ok) {
    throw new Error(`Coupa API error: ${eventsRes.status}`);
  }

  const events = await eventsRes.json();
  const event = events[0];

  if (!event) {
    throw new Error("No open sourcing events found in Coupa.");
  }

  // Get questionnaire items for this event
  const questionsRes = await fetch(
    `${baseUrl}/api/sourcing_events/${event.id}/items?fields=["id","description","section","response_type","options"]`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!questionsRes.ok) {
    throw new Error(`Coupa items API error: ${questionsRes.status}`);
  }

  const items = await questionsRes.json();
  const questions: ImportedQuestion[] = (items || []).map(
    (item: Record<string, unknown>) => ({
      external_id: String(item.id),
      question_text: String(item.description || ""),
      section: item.section ? String(item.section) : null,
      response_type: mapCoupaType(String(item.response_type || "")),
      response_options: Array.isArray(item.options) ? item.options.map(String) : [],
    })
  );

  return { questions, eventId: String(event.id) };
}

export async function exportToCoupa(
  connector: Connector,
  eventId: string,
  answers: ExportAnswer[]
): Promise<{ exported: number }> {
  const token = await ensureValidToken(connector);
  const baseUrl = connector.instance_url;
  let exported = 0;

  // Submit responses as a bid
  const responses = answers.map((a) => ({
    item_id: a.external_id,
    response: a.response_value || a.answer_text,
    comments: a.answer_text,
  }));

  const bidRes = await fetch(
    `${baseUrl}/api/sourcing_events/${eventId}/responses`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        status: "draft",
        item_responses: responses,
      }),
    }
  );

  if (bidRes.ok) {
    exported = answers.length;
  } else {
    throw new Error(`Coupa export error: ${bidRes.status}`);
  }

  return { exported };
}

function mapCoupaType(type: string): string {
  switch (type.toLowerCase()) {
    case "yes_no": return "yes_no";
    case "single_select": return "dropdown";
    case "multi_select": return "multi_select";
    default: return "freetext";
  }
}
