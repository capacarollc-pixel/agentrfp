"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const confidenceColors: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-orange-100 text-orange-700",
  none: "bg-red-100 text-red-700",
};

interface Answer {
  id: string;
  content: string;
  confidence: string;
  is_ai_generated: boolean;
  version_number?: number;
  approved_by?: string;
  approved_at?: string;
}

interface Question {
  id: string;
  question_text: string;
  section: string | null;
  order_index: number;
  status: string;
  assigned_to: string | null;
  response_type: string;
  response_options: string[];
  response_value: string | null;
  answers: Answer[];
}

export function AnswerCard({
  question,
  rfpId,
  index,
  teamMembers,
}: {
  question: Question;
  rfpId: string;
  index: number;
  teamMembers?: Array<{ id: string; full_name: string }>;
}) {
  const answer = question.answers?.[0];
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer?.content || "");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<Array<{
    id: string;
    content: string;
    version_number: number;
    created_at: string;
    users?: { full_name: string };
  }>>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState<Array<{
    id: string;
    content: string;
    document_title: string;
    relevance_rank: number;
  }>>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const isApproved = question.status === "approved";
  const router = useRouter();

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    drafted: "bg-blue-50 text-blue-700",
    in_review: "bg-yellow-50 text-yellow-700",
    approved: "bg-green-50 text-green-700",
  };

  async function handleSave() {
    if (!answer) return;
    setSaving(true);
    const res = await fetch(`/api/answers/${answer.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    if (!answer) return;
    setRegenerating(true);
    await fetch(`/api/answers/${answer.id}`, { method: "DELETE" });
    await fetch(`/api/rfps/${rfpId}/generate`, { method: "POST" });
    setRegenerating(false);
    router.refresh();
  }

  async function handleApprove() {
    if (!answer) return;
    setApproving(true);
    const res = await fetch(`/api/answers/${answer.id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    }
    setApproving(false);
  }

  async function handleShowVersions() {
    if (showVersions) {
      setShowVersions(false);
      return;
    }
    if (!answer) return;
    setLoadingVersions(true);
    const res = await fetch(`/api/answers/${answer.id}/versions`);
    if (res.ok) {
      const data = await res.json();
      setVersions(data.versions);
    }
    setLoadingVersions(false);
    setShowVersions(true);
  }

  async function handleRestore(versionId: string) {
    if (!answer) return;
    setRestoringId(versionId);
    const res = await fetch(`/api/answers/${answer.id}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) {
      setShowVersions(false);
      router.refresh();
    }
    setRestoringId(null);
  }

  async function handleShowSources() {
    if (showSources) {
      setShowSources(false);
      return;
    }
    if (!answer) return;
    setLoadingSources(true);
    const res = await fetch(`/api/answers/${answer.id}/sources`);
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources);
    }
    setLoadingSources(false);
    setShowSources(true);
  }

  async function handleAssign(userId: string) {
    await fetch(`/api/questions/${question.id}/assign`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignTo: userId || null }),
    });
    router.refresh();
  }

  async function handleReject() {
    if (!answer) return;
    const res = await fetch(`/api/questions/${question.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_review" }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        isApproved ? "border-green-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">Q{index + 1}</span>
          {question.section && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
              {question.section}
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              statusColors[question.status] || statusColors.pending
            }`}
          >
            {question.status.replace("_", " ")}
          </span>
        </div>
        {/* Assignment */}
        {teamMembers && teamMembers.length >= 1 && !isApproved && (
          <select
            value={question.assigned_to || ""}
            onChange={(e) => handleAssign(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm font-medium text-gray-900 mb-3">
        {question.question_text}
      </p>

      {/* Structured response input (Yes/No, dropdown, etc.) */}
      {question.response_type && question.response_type !== "freetext" && (
        <div className="mb-3">
          <ResponseInput
            questionId={question.id}
            responseType={question.response_type}
            responseOptions={question.response_options || []}
            currentValue={question.response_value}
            disabled={isApproved}
          />
        </div>
      )}

      {answer ? (
        <div className={`rounded-lg p-4 ${isApproved ? "bg-green-50" : "bg-gray-50"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {!isApproved && (
                <>
                  <span className="text-xs font-medium text-gray-500">
                    {answer.is_ai_generated ? "AI Draft" : "Manual"}
                    {answer.version_number && answer.version_number > 1
                      ? ` · v${answer.version_number}`
                      : ""}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      confidenceColors[answer.confidence] || confidenceColors.none
                    }`}
                  >
                    {answer.confidence} confidence
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-1">
              {!editing && (
                <>
                  {!isApproved && (
                    <>
                      <button
                        onClick={() => {
                          setEditContent(answer.content);
                          setEditing(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleRegenerate}
                        disabled={regenerating}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 disabled:opacity-50"
                      >
                        {regenerating ? "Regenerating..." : "Regenerate"}
                      </button>
                    </>
                  )}
                  {answer.is_ai_generated && (
                    <button
                      onClick={handleShowSources}
                      className="text-xs text-teal-600 hover:text-teal-800 px-2 py-1"
                    >
                      {showSources ? "Hide Sources" : "Sources"}
                    </button>
                  )}
                  {answer.version_number && answer.version_number > 1 && (
                    <button
                      onClick={handleShowVersions}
                      className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1"
                    >
                      {showVersions ? "Hide History" : "History"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {answer.content}
            </p>
          )}

          {/* AI Sources panel */}
          {showSources && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Knowledge Sources Used
              </h4>
              {loadingSources ? (
                <p className="text-xs text-gray-400">Loading...</p>
              ) : sources.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No source traceability available for this answer.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sources.map((s, i) => (
                    <div
                      key={s.id}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          #{i + 1}
                        </span>
                        <span className="text-xs font-medium text-gray-600">
                          {s.document_title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-3">
                        {s.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Version history panel */}
          {showVersions && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                Version History
              </h4>
              {loadingVersions ? (
                <p className="text-xs text-gray-400">Loading...</p>
              ) : versions.length === 0 ? (
                <p className="text-xs text-gray-400">No previous versions.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          v{v.version_number}
                          {v.users?.full_name && ` by ${v.users.full_name}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                          {!isApproved && (
                            <button
                              onClick={() => handleRestore(v.id)}
                              disabled={restoringId === v.id}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                            >
                              {restoringId === v.id ? "Restoring..." : "Restore"}
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-3">
                        {v.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approve / Reject buttons */}
          {!editing && !isApproved && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approving ? "Approving..." : "Approve"}
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1.5 border border-orange-300 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-50 transition-colors"
              >
                Needs Review
              </button>
            </div>
          )}

          {isApproved && (
            <div className="mt-3 pt-3 border-t border-green-200 flex items-center justify-between">
              <span className="text-xs text-green-700 font-medium">
                Approved — saved to Answer Library
              </span>
              {answer.approved_at && (
                <span className="text-xs text-green-600">
                  {new Date(answer.approved_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No answer yet. Click &quot;Generate AI Answers&quot; above.
        </p>
      )}
    </div>
  );
}

function ResponseInput({
  questionId,
  responseType,
  responseOptions,
  currentValue,
  disabled,
}: {
  questionId: string;
  responseType: string;
  responseOptions: string[];
  currentValue: string | null;
  disabled: boolean;
}) {
  const [value, setValue] = useState(currentValue || "");
  const [saved, setSaved] = useState(false);

  async function handleChange(newValue: string) {
    setValue(newValue);
    setSaved(false);
    await fetch(`/api/questions/${questionId}/response`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_value: newValue }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const options =
    responseType === "yes_no"
      ? ["Yes", "No"]
      : responseType === "yes_no_na"
        ? ["Yes", "No", "N/A"]
        : responseOptions.length > 0
          ? responseOptions
          : ["Yes", "No", "N/A", "Partial"];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-500">Response:</span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => !disabled && handleChange(opt)}
            disabled={disabled}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              value === opt
                ? opt === "Yes"
                  ? "bg-green-600 text-white"
                  : opt === "No"
                    ? "bg-red-600 text-white"
                    : opt === "N/A"
                      ? "bg-gray-500 text-white"
                      : "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {saved && <span className="text-xs text-green-600">Saved</span>}
    </div>
  );
}
