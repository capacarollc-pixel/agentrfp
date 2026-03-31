import { Connector, ensureValidToken, ImportedQuestion, ExportAnswer } from "./base";

/**
 * ServiceNow VRM (Vendor Risk Management) Connector
 *
 * Imports: Assessment questionnaires from sn_vdr_assessment table
 * Exports: Completed responses back to ServiceNow
 */

export async function importFromServiceNow(
  connector: Connector
): Promise<{ questions: ImportedQuestion[]; assessmentId: string }> {
  const token = await ensureValidToken(connector);
  const baseUrl = connector.instance_url;

  // Get open assessments assigned to this vendor
  const assessmentsRes = await fetch(
    `${baseUrl}/api/now/table/sn_vdr_assessment?sysparm_query=state=ready^ORstate=in_progress&sysparm_limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!assessmentsRes.ok) {
    throw new Error(`ServiceNow API error: ${assessmentsRes.status}`);
  }

  const assessments = await assessmentsRes.json();
  const assessment = assessments.result?.[0];

  if (!assessment) {
    throw new Error("No open assessments found in ServiceNow.");
  }

  // Get questions for this assessment
  const questionsRes = await fetch(
    `${baseUrl}/api/now/table/sn_vdr_question?sysparm_query=assessment=${assessment.sys_id}&sysparm_fields=sys_id,question_text,category,type,choices`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!questionsRes.ok) {
    throw new Error(`ServiceNow questions API error: ${questionsRes.status}`);
  }

  const questionsData = await questionsRes.json();
  const questions: ImportedQuestion[] = (questionsData.result || []).map(
    (q: Record<string, string>) => ({
      external_id: q.sys_id,
      question_text: q.question_text,
      section: q.category || null,
      response_type: mapServiceNowType(q.type),
      response_options: q.choices ? q.choices.split(",").map((c: string) => c.trim()) : [],
    })
  );

  return { questions, assessmentId: assessment.sys_id };
}

export async function exportToServiceNow(
  connector: Connector,
  assessmentId: string,
  answers: ExportAnswer[]
): Promise<{ exported: number }> {
  const token = await ensureValidToken(connector);
  const baseUrl = connector.instance_url;
  let exported = 0;

  for (const answer of answers) {
    const response = await fetch(
      `${baseUrl}/api/now/table/sn_vdr_response`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          assessment: assessmentId,
          question: answer.external_id,
          response: answer.response_value || "",
          comments: answer.answer_text,
          state: "complete",
        }),
      }
    );

    if (response.ok) exported++;
  }

  // Update assessment state to complete if all answered
  await fetch(
    `${baseUrl}/api/now/table/sn_vdr_assessment/${assessmentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: "complete" }),
    }
  );

  return { exported };
}

function mapServiceNowType(type: string): string {
  switch (type) {
    case "yes_no": return "yes_no";
    case "choice": return "dropdown";
    case "multi_choice": return "multi_select";
    default: return "freetext";
  }
}
