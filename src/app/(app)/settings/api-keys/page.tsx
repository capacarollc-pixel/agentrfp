"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const providers = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description: "Claude Haiku (fast) and Sonnet (quality). Best for instruction following.",
    placeholder: "sk-ant-...",
    prefix: "sk-ant-",
    link: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI (GPT-4o)",
    description: "GPT-4o-mini (fast) and GPT-4o (quality). Most popular models.",
    placeholder: "sk-proj-...",
    prefix: "sk-",
    link: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    name: "Google (Gemini)",
    description: "Gemini Flash (fast, 1M context) and Pro (quality). Best for very large RFPs.",
    placeholder: "AIza...",
    prefix: "",
    link: "https://aistudio.google.com/apikey",
  },
];

interface SavedKey {
  id: string;
  provider: string;
  created_at: string;
}

export default function ApiKeysPage() {
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("org_id")
      .eq("id", user.user.id)
      .single();

    if (profile) {
      const { data: keys } = await supabase
        .from("api_keys")
        .select("id, provider, created_at")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });

      setSavedKeys(keys || []);
    }
  }

  async function handleSave(provider: string) {
    if (!apiKey) return;
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/org/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, provider }),
    });

    if (res.ok) {
      setMessage("API key saved successfully.");
      setApiKey("");
      setAddingProvider(null);
      loadKeys();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to save API key.");
    }
    setSaving(false);
  }

  async function handleDelete(keyId: string) {
    await fetch("/api/org/api-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: keyId }),
    });
    loadKeys();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Provider</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add your API key for any supported AI provider. The most recently added key will be used.
          Your key is encrypted and only used server-side.
        </p>
      </div>

      {/* Saved keys */}
      {savedKeys.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {savedKeys.map((key) => {
            const providerInfo = providers.find((p) => p.id === key.provider);
            return (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {providerInfo?.name || key.provider}
                    </span>
                    {key.id === savedKeys[0]?.id && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Added {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Provider cards */}
      <div className="grid gap-4">
        {providers.map((provider) => {
          const hasKey = savedKeys.some((k) => k.provider === provider.id);
          const isAdding = addingProvider === provider.id;

          return (
            <div
              key={provider.id}
              className={`bg-white rounded-xl border p-5 ${
                hasKey ? "border-green-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {provider.name}
                    {hasKey && (
                      <span className="text-green-600 ml-2 text-xs font-normal">
                        configured
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {provider.description}
                  </p>
                </div>
                {!isAdding && (
                  <button
                    onClick={() => {
                      setAddingProvider(provider.id);
                      setApiKey("");
                      setMessage("");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                  >
                    {hasKey ? "Update Key" : "Add Key"}
                  </button>
                )}
              </div>

              {isAdding && (
                <div className="mt-3 space-y-3">
                  <div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Get your key at{" "}
                      <a
                        href={provider.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {provider.link.replace("https://", "")}
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(provider.id)}
                      disabled={saving || !apiKey}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Key"}
                    </button>
                    <button
                      onClick={() => {
                        setAddingProvider(null);
                        setMessage("");
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <div
          className={`text-sm rounded-lg p-3 ${
            message.includes("success")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
