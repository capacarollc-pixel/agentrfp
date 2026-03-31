import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type AIProvider = "anthropic" | "openai" | "google";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const MODEL_DEFAULTS: Record<AIProvider, { fast: string; quality: string }> = {
  anthropic: {
    fast: "claude-haiku-4-5-20251001",
    quality: "claude-sonnet-4-20250514",
  },
  openai: {
    fast: "gpt-4o-mini",
    quality: "gpt-4o",
  },
  google: {
    fast: "gemini-2.0-flash",
    quality: "gemini-2.0-pro",
  },
};

/**
 * Get the AI config for an org (provider + decrypted key + model)
 */
export async function getAIConfig(orgId: string): Promise<AIConfig | null> {
  const admin = getAdminClient();

  // Check for keys in priority order: anthropic, openai, google
  const { data: keys } = await admin
    .from("api_keys")
    .select("provider, encrypted_key")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (!keys || keys.length === 0) return null;

  // Use the most recently added key
  const key = keys[0];
  const decoded = Buffer.from(key.encrypted_key, "base64").toString("utf-8");
  const apiKey = decoded.replace("enc:", "");
  const provider = key.provider as AIProvider;

  return {
    provider,
    apiKey,
    model: MODEL_DEFAULTS[provider]?.fast || key.provider,
  };
}

/**
 * Get the decrypted API key for an org (backwards compat)
 */
export async function getApiKey(orgId: string): Promise<string | null> {
  const config = await getAIConfig(orgId);
  return config?.apiKey || null;
}

/**
 * Call any AI provider with retry on rate limits
 */
export async function callAI(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; useQualityModel?: boolean }
): Promise<string> {
  const model = options?.useQualityModel
    ? MODEL_DEFAULTS[config.provider]?.quality || config.model
    : config.model;

  switch (config.provider) {
    case "anthropic":
      return callClaude(config.apiKey, systemPrompt, userMessage, {
        maxTokens: options?.maxTokens,
        model,
      });
    case "openai":
      return callOpenAI(config.apiKey, systemPrompt, userMessage, {
        maxTokens: options?.maxTokens,
        model,
      });
    case "google":
      return callGemini(config.apiKey, systemPrompt, userMessage, {
        maxTokens: options?.maxTokens,
        model,
      });
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Call Claude API with retry on rate limits
 */
export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options?.model || "claude-haiku-4-5-20251001",
        max_tokens: options?.maxTokens || 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("retry-after") || "15");
      const waitTime = Math.max(retryAfter, 5) * 1000;
      console.log(`[Claude] Rate limited, waiting ${waitTime / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  throw new Error("Claude API rate limit exceeded after retries.");
}

/**
 * Call OpenAI API (GPT-4o, GPT-4o-mini)
 */
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || "gpt-4o-mini",
        max_tokens: options?.maxTokens || 4096,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (response.status === 429) {
      const waitTime = 10000 * (attempt + 1);
      console.log(`[OpenAI] Rate limited, waiting ${waitTime / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  throw new Error("OpenAI API rate limit exceeded after retries.");
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  const model = options?.model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 4096,
        },
      }),
    });

    if (response.status === 429) {
      const waitTime = 10000 * (attempt + 1);
      console.log(`[Gemini] Rate limited, waiting ${waitTime / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Gemini API rate limit exceeded after retries.");
}
