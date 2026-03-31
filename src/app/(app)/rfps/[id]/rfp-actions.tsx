"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RfpActions({
  rfpId,
  hasQuestions,
  hasAnswers,
  allApproved,
  rfpStatus,
}: {
  rfpId: string;
  hasQuestions: boolean;
  hasAnswers: boolean;
  allApproved: boolean;
  rfpStatus: string;
}) {
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Resume polling if RFP is in processing state
  useEffect(() => {
    if (rfpStatus === "parsing") {
      setParsing(true);
      startPolling();
    } else if (rfpStatus === "in_progress") {
      setGenerating(true);
      startPolling();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [rfpStatus]);

  function startPolling() {
    setProgress("Processing sheets...");
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/rfps/${rfpId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "parsing") {
          setProgress(data.progress || "Processing...");
        } else {
          // Done — stop polling
          if (pollRef.current) clearInterval(pollRef.current);
          setParsing(false);
          setGenerating(false);
          setProgress("");
          router.refresh();
        }
      }
    }, 3000);
  }

  async function handleParseQuestions() {
    setParsing(true);
    setError("");
    setProgress("Starting...");

    // Fire and forget — the API processes in background
    fetch(`/api/rfps/${rfpId}/parse`, { method: "POST" }).catch(() => {});

    // Start polling for progress
    startPolling();
  }

  async function handleGenerateAnswers() {
    setGenerating(true);
    setError("");
    setProgress("Generating answers...");

    fetch(`/api/rfps/${rfpId}/generate`, { method: "POST" }).catch(() => {});

    startPolling();
  }

  async function handleApproveAll() {
    setApprovingAll(true);
    setError("");
    const res = await fetch(`/api/rfps/${rfpId}/approve-all`, {
      method: "POST",
    });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to approve all");
    }
    setApprovingAll(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap justify-end">
        {!hasQuestions && !parsing && (
          <button
            onClick={handleParseQuestions}
            disabled={parsing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Parse Questions
          </button>
        )}
        {(parsing || generating) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {progress}
          </div>
        )}
        {hasQuestions && !parsing && !generating && (
          <>
            <button
              onClick={handleGenerateAnswers}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Generate AI Answers
            </button>
            {hasAnswers && !allApproved && (
              <button
                onClick={handleApproveAll}
                disabled={approvingAll}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approvingAll ? "Approving..." : "Approve All"}
              </button>
            )}
            <a
              href={`/api/rfps/${rfpId}/export/docx`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Export Word
            </a>
            <a
              href={`/api/rfps/${rfpId}/export/xlsx`}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Export Excel
            </a>
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-1">
          {error}
        </p>
      )}
    </div>
  );
}
