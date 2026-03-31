import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface NotifyEvent {
  orgId: string;
  event: string;
  title: string;
  message: string;
  url?: string;
}

/**
 * Send notifications to all enabled integrations for an org
 */
export async function notifyIntegrations(payload: NotifyEvent) {
  const admin = getAdminClient();

  const { data: integrations } = await admin
    .from("integrations")
    .select("*")
    .eq("org_id", payload.orgId)
    .eq("enabled", true);

  if (!integrations || integrations.length === 0) return;

  for (const integration of integrations) {
    try {
      switch (integration.type) {
        case "slack":
          await sendSlack(integration.webhook_url!, payload);
          break;
        case "teams":
          await sendTeams(integration.webhook_url!, payload);
          break;
        case "webhook":
          await sendWebhook(integration.webhook_url!, payload);
          break;
        case "google_sheets":
          await appendToSheet(integration, payload);
          break;
      }
    } catch (err) {
      console.error(`Failed to notify ${integration.type}:`, err);
    }
  }
}

async function sendSlack(webhookUrl: string, payload: NotifyEvent) {
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: payload.title },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: payload.message },
    },
  ];

  if (payload.url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${payload.url}|View in AgentRFP>`,
      },
    });
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks }),
  });
}

async function sendTeams(webhookUrl: string, payload: NotifyEvent) {
  const card = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "2563EB",
    summary: payload.title,
    sections: [
      {
        activityTitle: payload.title,
        text: payload.message,
      },
    ],
    potentialAction: payload.url
      ? [
          {
            "@type": "OpenUri",
            name: "View in AgentRFP",
            targets: [{ os: "default", uri: payload.url }],
          },
        ]
      : [],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card),
  });
}

async function sendWebhook(webhookUrl: string, payload: NotifyEvent) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: payload.event,
      title: payload.title,
      message: payload.message,
      url: payload.url,
      timestamp: new Date().toISOString(),
    }),
  });
}

async function appendToSheet(
  integration: { config: Record<string, string> },
  payload: NotifyEvent
) {
  // Google Sheets append via Sheets API
  // Requires: config.spreadsheet_id, config.sheet_name, config.api_key
  const { spreadsheet_id, sheet_name, api_key } = integration.config || {};
  if (!spreadsheet_id || !api_key) return;

  const range = `${sheet_name || "Sheet1"}!A:D`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${range}:append?valueInputOption=RAW&key=${api_key}`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      values: [
        [
          new Date().toISOString(),
          payload.event,
          payload.title,
          payload.message,
        ],
      ],
    }),
  });
}
