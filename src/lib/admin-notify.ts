/**
 * Notify the platform admin about important events like new signups.
 * Sends email to ADMIN_EMAIL via Resend API.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "capacarollc@gmail.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

interface AdminEvent {
  event: string;
  title: string;
  message: string;
  details?: Record<string, string>;
}

export async function notifyAdmin(payload: AdminEvent) {
  // Always log to server console
  console.log(`[ADMIN] ${payload.title}: ${payload.message}`);

  // Send email if Resend is configured
  if (RESEND_API_KEY) {
    await sendEmail(payload).catch((err) =>
      console.error("[ADMIN] Email failed:", err)
    );
  }
}

async function sendEmail(payload: AdminEvent) {
  const detailsHtml = payload.details
    ? `<table style="margin-top:16px;border-collapse:collapse;">
        ${Object.entries(payload.details)
          .map(
            ([k, v]) =>
              `<tr>
                <td style="padding:4px 16px 4px 0;color:#6b7280;font-size:14px;">${k}</td>
                <td style="padding:4px 0;font-size:14px;font-weight:500;">${v}</td>
              </tr>`
          )
          .join("")}
       </table>`
    : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "AgentRFP <info@agentrfp.ai>",
      to: [ADMIN_EMAIL],
      subject: payload.title,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:500px;">
          <div style="background:linear-gradient(135deg,#2563eb,#06b6d4);padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;font-size:18px;margin:0;">${payload.title}</h1>
          </div>
          <div style="padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;color:#374151;margin:0 0 8px 0;">
              ${payload.message.replace(/\*(.*?)\*/g, "<strong>$1</strong>")}
            </p>
            ${detailsHtml}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
            <p style="font-size:12px;color:#9ca3af;margin:0;">
              AgentRFP &middot; Capacaro LLC
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend error (${response.status}): ${err}`);
  }
}
