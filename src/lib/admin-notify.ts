/**
 * Notify the platform admin (you) about important events like new signups.
 * Uses env vars so it works without database config.
 */

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";
const ADMIN_WEBHOOK_URL = process.env.ADMIN_NOTIFICATION_WEBHOOK || "";

interface AdminEvent {
  event: string;
  title: string;
  message: string;
  details?: Record<string, string>;
}

export async function notifyAdmin(payload: AdminEvent) {
  const promises: Promise<void>[] = [];

  // Slack/Teams webhook notification
  if (ADMIN_WEBHOOK_URL) {
    promises.push(sendWebhook(payload));
  }

  // Email via Supabase Edge Function or simple fetch
  // For now, log to console as a fallback
  console.log(`[ADMIN NOTIFY] ${payload.title}: ${payload.message}`);

  if (payload.details) {
    Object.entries(payload.details).forEach(([k, v]) => {
      console.log(`[ADMIN NOTIFY]   ${k}: ${v}`);
    });
  }

  await Promise.allSettled(promises);
}

async function sendWebhook(payload: AdminEvent) {
  try {
    // Auto-detect Slack vs Teams vs generic webhook
    if (ADMIN_WEBHOOK_URL.includes("hooks.slack.com")) {
      await fetch(ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: payload.title },
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: payload.message },
            },
            ...(payload.details
              ? [
                  {
                    type: "section",
                    fields: Object.entries(payload.details).map(([k, v]) => ({
                      type: "mrkdwn",
                      text: `*${k}:*\n${v}`,
                    })),
                  },
                ]
              : []),
          ],
        }),
      });
    } else if (ADMIN_WEBHOOK_URL.includes("office.com") || ADMIN_WEBHOOK_URL.includes("webhook.office")) {
      await fetch(ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@type": "MessageCard",
          themeColor: "2563EB",
          summary: payload.title,
          sections: [
            {
              activityTitle: payload.title,
              text: payload.message,
              facts: payload.details
                ? Object.entries(payload.details).map(([k, v]) => ({ name: k, value: v }))
                : [],
            },
          ],
        }),
      });
    } else {
      // Generic webhook
      await fetch(ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: payload.event,
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch (err) {
    console.error("[ADMIN NOTIFY] Webhook failed:", err);
  }
}
