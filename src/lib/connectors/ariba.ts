import { Connector, ensureValidToken, ImportedQuestion, ExportAnswer } from "./base";

/**
 * SAP Ariba Connector
 *
 * Imports: Sourcing projects / questionnaires from Ariba
 * Exports: Completed responses back to Ariba
 *
 * Uses SAP Ariba APIs:
 * - Sourcing API for events
 * - Operational Reporting for questionnaire data
 */

const ARIBA_API_BASE = "https://openapi.ariba.com/api";

export async function importFromAriba(
  connector: Connector
): Promise<{ questions: ImportedQuestion[]; projectId: string }> {
  const token = await ensureValidToken(connector);
  const realm = (connector.config as Record<string, string>).realm || "";

  // Get active sourcing projects
  const projectsRes = await fetch(
    `${ARIBA_API_BASE}/sourcing/v1/prod/projects?realm=${realm}&$filter=status eq 'Open'&$top=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: connector.client_id || "",
        Accept: "application/json",
      },
    }
  );

  if (!projectsRes.ok) {
    throw new Error(`Ariba API error: ${projectsRes.status}`);
  }

  const projectsData = await projectsRes.json();
  const project = projectsData.value?.[0];

  if (!project) {
    throw new Error("No open sourcing projects found in Ariba.");
  }

  // Get questionnaire content for this project
  const contentRes = await fetch(
    `${ARIBA_API_BASE}/sourcing/v1/prod/projects/${project.InternalId}/content?realm=${realm}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: connector.client_id || "",
        Accept: "application/json",
      },
    }
  );

  if (!contentRes.ok) {
    throw new Error(`Ariba content API error: ${contentRes.status}`);
  }

  const content = await contentRes.json();

  // Parse questionnaire sections and questions
  const questions: ImportedQuestion[] = [];
  const sections = content.value || content.Sections || [];

  for (const section of sections) {
    const sectionName = section.Title || section.Name || null;
    const items = section.Questions || section.Items || [];

    for (const item of items) {
      questions.push({
        external_id: String(item.InternalId || item.Id || ""),
        question_text: String(item.Description || item.QuestionText || item.Title || ""),
        section: sectionName,
        response_type: mapAribaType(String(item.QuestionType || item.Type || "")),
        response_options: item.AllowedValues
          ? (item.AllowedValues as string[]).map(String)
          : [],
      });
    }
  }

  return { questions, projectId: String(project.InternalId) };
}

export async function exportToAriba(
  connector: Connector,
  projectId: string,
  answers: ExportAnswer[]
): Promise<{ exported: number }> {
  const token = await ensureValidToken(connector);
  const realm = (connector.config as Record<string, string>).realm || "";
  let exported = 0;

  // Submit bid response
  const responsePayload = {
    ProjectId: projectId,
    Responses: answers.map((a) => ({
      QuestionId: a.external_id,
      ResponseValue: a.response_value || "",
      Comments: a.answer_text,
    })),
  };

  const submitRes = await fetch(
    `${ARIBA_API_BASE}/sourcing/v1/prod/projects/${projectId}/responses?realm=${realm}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: connector.client_id || "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(responsePayload),
    }
  );

  if (submitRes.ok) {
    exported = answers.length;
  } else {
    const err = await submitRes.text();
    throw new Error(`Ariba export error: ${submitRes.status} - ${err}`);
  }

  return { exported };
}

function mapAribaType(type: string): string {
  switch (type.toLowerCase()) {
    case "yesno":
    case "yes/no":
      return "yes_no";
    case "singlechoice":
    case "single_choice":
      return "dropdown";
    case "multichoice":
    case "multi_choice":
      return "multi_select";
    default:
      return "freetext";
  }
}
