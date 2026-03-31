"use client";

import { useState, useEffect } from "react";

interface Integration {
  id: string;
  type: string;
  name: string;
  webhook_url: string | null;
  enabled: boolean;
  created_at: string;
}

const integrationTypes = [
  {
    value: "slack",
    label: "Slack",
    icon: "#",
    description: "Get notifications in a Slack channel",
    placeholder: "https://hooks.slack.com/services/...",
  },
  {
    value: "teams",
    label: "Microsoft Teams",
    icon: "T",
    description: "Get notifications in a Teams channel",
    placeholder: "https://outlook.office.com/webhook/...",
  },
  {
    value: "webhook",
    label: "Custom Webhook",
    icon: "</>",
    description: "Send events to any URL (Zapier, Make, etc.)",
    placeholder: "https://your-endpoint.com/webhook",
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    const res = await fetch("/api/org/integrations");
    if (res.ok) {
      const data = await res.json();
      setIntegrations(data.integrations);
    }
  }

  async function handleAdd() {
    if (!selectedType || !name || !webhookUrl) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/org/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: selectedType,
        name,
        webhook_url: webhookUrl,
      }),
    });

    if (res.ok) {
      setAdding(false);
      setSelectedType("");
      setName("");
      setWebhookUrl("");
      loadIntegrations();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add integration");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/org/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadIntegrations();
  }

  const typeConfig = integrationTypes.find((t) => t.value === selectedType);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-500">
            Connect AgentRFP to your team&apos;s tools.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add Integration
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            New Integration
          </h3>

          {/* Type selection */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {integrationTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedType === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-lg font-mono">{type.icon}</span>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {type.label}
                </p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>

          {selectedType && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g., ${typeConfig?.label} - #rfp-responses`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={typeConfig?.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={saving || !name || !webhookUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Integration"}
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setError("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing integrations */}
      {integrations.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {integrations.map((int) => (
            <div
              key={int.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      int.type === "slack"
                        ? "bg-purple-50 text-purple-700"
                        : int.type === "teams"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {int.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {int.name}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono truncate max-w-md">
                  {int.webhook_url}
                </p>
              </div>
              <button
                onClick={() => handleDelete(int.id)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        !adding && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-2">No integrations configured.</p>
            <p className="text-sm text-gray-400">
              Add Slack, Teams, or a webhook to get notified when RFPs are
              parsed, answers generated, or responses approved.
            </p>
          </div>
        )
      )}

      {/* Events reference */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Events sent to integrations
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">
              section.assigned
            </span>
            <span>When a section is assigned to a team member</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">
              rfp.questions_parsed
            </span>
            <span>When questions are extracted from an RFP</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">
              rfp.completed
            </span>
            <span>When all answers are approved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
