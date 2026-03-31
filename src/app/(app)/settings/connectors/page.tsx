"use client";

import { useState, useEffect } from "react";

interface ConnectorInfo {
  id: string;
  type: string;
  name: string;
  instance_url: string;
  enabled: boolean;
  last_sync_at: string | null;
  created_at: string;
}

const connectorTypes = [
  {
    value: "servicenow",
    label: "ServiceNow VRM",
    description: "Import vendor risk assessments and security questionnaires",
    fields: [
      { key: "instance_url", label: "Instance URL", placeholder: "https://your-instance.service-now.com" },
      { key: "client_id", label: "OAuth Client ID", placeholder: "Client ID from ServiceNow" },
      { key: "client_secret", label: "OAuth Client Secret", placeholder: "Client Secret", type: "password" },
    ],
  },
  {
    value: "coupa",
    label: "Coupa Procurement",
    description: "Import sourcing events and export bid responses",
    fields: [
      { key: "instance_url", label: "Coupa URL", placeholder: "https://your-company.coupahost.com" },
      { key: "client_id", label: "API Key / Client ID", placeholder: "From Coupa admin" },
      { key: "client_secret", label: "API Secret", placeholder: "API Secret", type: "password" },
    ],
  },
  {
    value: "ariba",
    label: "SAP Ariba",
    description: "Import sourcing projects and submit questionnaire responses",
    fields: [
      { key: "instance_url", label: "Ariba API URL", placeholder: "https://openapi.ariba.com" },
      { key: "client_id", label: "Application Key", placeholder: "From SAP Ariba Developer Portal" },
      { key: "client_secret", label: "Application Secret", placeholder: "Application Secret", type: "password" },
      { key: "realm", label: "Realm ID", placeholder: "Your Ariba realm" },
    ],
  },
];

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadConnectors(); }, []);

  async function loadConnectors() {
    const res = await fetch("/api/org/connectors");
    if (res.ok) {
      const data = await res.json();
      setConnectors(data.connectors);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const typeConfig = connectorTypes.find((t) => t.value === selectedType);
    if (!typeConfig) return;

    const res = await fetch("/api/org/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: selectedType,
        name: formData.name || typeConfig.label,
        instance_url: formData.instance_url || "",
        client_id: formData.client_id || "",
        client_secret: formData.client_secret || "",
        config: { realm: formData.realm || "" },
      }),
    });

    if (res.ok) {
      setAdding(false);
      setSelectedType("");
      setFormData({});
      loadConnectors();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add connector");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch("/api/org/connectors", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadConnectors();
  }

  async function handleSync(id: string, direction: "import" | "export") {
    const res = await fetch(`/api/org/connectors/${id}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(direction === "import"
        ? `Imported ${data.questionsImported} questions`
        : `Exported ${data.exported} answers`
      );
      loadConnectors();
    } else {
      const data = await res.json();
      alert(data.error || "Sync failed");
    }
  }

  const typeConfig = connectorTypes.find((t) => t.value === selectedType);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Enterprise Connectors</h2>
          <p className="text-sm text-gray-500">
            Connect to procurement and vendor management platforms.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add Connector
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New Connector</h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {connectorTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setSelectedType(type.value);
                  setFormData({ name: type.label });
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedType === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{type.label}</p>
                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>

          {typeConfig && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {typeConfig.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.instance_url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Connector"}
                </button>
                <button
                  onClick={() => { setAdding(false); setError(""); }}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing connectors */}
      {connectors.length > 0 ? (
        <div className="space-y-4">
          {connectors.map((conn) => {
            const typeInfo = connectorTypes.find((t) => t.value === conn.type);
            return (
              <div key={conn.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{conn.name}</h3>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {typeInfo?.label || conn.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{conn.instance_url}</p>
                    {conn.last_sync_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last sync: {new Date(conn.last_sync_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(conn.id, "import")}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                  >
                    Import Questions
                  </button>
                  <button
                    onClick={() => handleSync(conn.id, "export")}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
                  >
                    Export Responses
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !adding && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-2">No enterprise connectors configured.</p>
            <p className="text-sm text-gray-400">
              Connect to ServiceNow, Coupa, or SAP Ariba to import questionnaires and export responses directly.
            </p>
          </div>
        )
      )}
    </div>
  );
}
