import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function encrypt(value: string): string {
  return Buffer.from(`enc:${value}`).toString("base64");
}

export function decrypt(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8").replace("enc:", "");
}

export interface Connector {
  id: string;
  org_id: string;
  type: string;
  name: string;
  instance_url: string;
  client_id: string | null;
  client_secret_encrypted: string | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  token_expires_at: string | null;
  config: Record<string, unknown>;
}

export interface ImportedQuestion {
  external_id: string;
  question_text: string;
  section: string | null;
  response_type: string;
  response_options: string[];
}

export interface ExportAnswer {
  external_id: string;
  response_value: string | null;
  answer_text: string;
}

/**
 * Refresh OAuth token if expired
 */
export async function ensureValidToken(connector: Connector): Promise<string> {
  if (!connector.access_token_encrypted) {
    throw new Error("No access token. Please reconnect the integration.");
  }

  const token = decrypt(connector.access_token_encrypted);
  const expiresAt = connector.token_expires_at
    ? new Date(connector.token_expires_at)
    : null;

  // If token is still valid, return it
  if (!expiresAt || expiresAt > new Date()) {
    return token;
  }

  // Token expired — refresh it
  if (!connector.refresh_token_encrypted) {
    throw new Error("Token expired and no refresh token. Please reconnect.");
  }

  const refreshToken = decrypt(connector.refresh_token_encrypted);
  const newTokens = await refreshOAuthToken(connector, refreshToken);

  // Save new tokens
  const admin = getAdminClient();
  await admin
    .from("connectors")
    .update({
      access_token_encrypted: encrypt(newTokens.access_token),
      refresh_token_encrypted: newTokens.refresh_token
        ? encrypt(newTokens.refresh_token)
        : connector.refresh_token_encrypted,
      token_expires_at: newTokens.expires_at,
    })
    .eq("id", connector.id);

  return newTokens.access_token;
}

async function refreshOAuthToken(
  connector: Connector,
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_at: string }> {
  const clientSecret = connector.client_secret_encrypted
    ? decrypt(connector.client_secret_encrypted)
    : "";

  let tokenUrl: string;
  switch (connector.type) {
    case "servicenow":
      tokenUrl = `${connector.instance_url}/oauth_token.do`;
      break;
    case "coupa":
      tokenUrl = `${connector.instance_url}/oauth2/token`;
      break;
    case "ariba":
      tokenUrl = "https://api.ariba.com/v2/oauth/token";
      break;
    default:
      throw new Error(`Unsupported connector type: ${connector.type}`);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: connector.client_id || "",
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
  };
}
