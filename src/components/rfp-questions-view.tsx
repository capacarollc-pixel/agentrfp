"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnswerCard } from "@/components/answer-card";

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
  answers: Array<{
    id: string;
    content: string;
    confidence: string;
    is_ai_generated: boolean;
    version_number?: number;
    approved_by?: string;
    approved_at?: string;
  }>;
}

export function RfpQuestionsView({
  questions,
  rfpId,
  teamMembers,
}: {
  questions: Question[];
  rfpId: string;
  teamMembers: Array<{ id: string; full_name: string }>;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [assigningSection, setAssigningSection] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [assigning, setAssigning] = useState(false);
  const router = useRouter();

  // Collect unique sections
  const sections = Array.from(
    new Set(questions.map((q) => q.section).filter(Boolean))
  ) as string[];

  // Filter questions by section
  const filtered = activeSection
    ? questions.filter((q) => q.section === activeSection)
    : questions;

  function getSectionStats(section: string | null) {
    const sectionQs = section
      ? questions.filter((q) => q.section === section)
      : questions;
    const total = sectionQs.length;
    const answered = sectionQs.filter(
      (q) => q.answers && q.answers.length > 0
    ).length;
    const approved = sectionQs.filter((q) => q.status === "approved").length;
    const assignedTo = sectionQs[0]?.assigned_to;
    const allSameAssignee = sectionQs.every((q) => q.assigned_to === assignedTo);
    return { total, answered, approved, assignedTo: allSameAssignee ? assignedTo : null };
  }

  async function handleGenerateSection(section: string) {
    setGeneratingSection(section);
    const sectionQs = questions
      .filter((q) => q.section === section && (!q.answers || q.answers.length === 0))
      .map((q) => q.id);

    if (sectionQs.length === 0) {
      setGeneratingSection(null);
      return;
    }

    await fetch(`/api/rfps/${rfpId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: sectionQs }),
    });

    setGeneratingSection(null);
    router.refresh();
  }

  async function handleAssignSection(section: string) {
    if (!assignTo) return;
    setAssigning(true);

    const sectionQs = questions
      .filter((q) => q.section === section)
      .map((q) => q.id);

    const res = await fetch(`/api/rfps/${rfpId}/assign-section`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionIds: sectionQs,
        assignTo,
        section,
      }),
    });

    if (res.ok) {
      setAssigningSection(null);
      setAssignTo("");
      router.refresh();
    }
    setAssigning(false);
  }

  const allStats = getSectionStats(null);

  return (
    <div>
      {/* Section filter bar */}
      {sections.length > 1 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSection(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                activeSection === null
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({allStats.total})
            </button>
            {sections.map((section) => {
              const stats = getSectionStats(section);
              const assignee = teamMembers.find((m) => m.id === stats.assignedTo);
              return (
                <button
                  key={section}
                  onClick={() =>
                    setActiveSection(activeSection === section ? null : section)
                  }
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    activeSection === section
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {section} ({stats.answered}/{stats.total})
                  {stats.approved === stats.total && stats.total > 0 && " \u2713"}
                  {assignee && ` · ${assignee.full_name.split(" ")[0]}`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-section action bar */}
      {activeSection && (
        <div className="mb-4 bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">
                {activeSection}
              </span>
              <span className="text-xs text-gray-500 ml-2">
                {getSectionStats(activeSection).answered}/
                {getSectionStats(activeSection).total} answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Assign section */}
              {teamMembers.length >= 1 && (
                <>
                  {assigningSection === activeSection ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={assignTo}
                        onChange={(e) => setAssignTo(e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white"
                      >
                        <option value="">Select person...</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignSection(activeSection)}
                        disabled={!assignTo || assigning}
                        className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {assigning ? "Assigning..." : "Assign & Notify"}
                      </button>
                      <button
                        onClick={() => setAssigningSection(null)}
                        className="text-xs text-gray-500 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningSection(activeSection)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                    >
                      Assign Section
                    </button>
                  )}
                </>
              )}
              {/* Generate section */}
              {getSectionStats(activeSection).answered <
                getSectionStats(activeSection).total && (
                <button
                  onClick={() => handleGenerateSection(activeSection)}
                  disabled={generatingSection === activeSection}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {generatingSection === activeSection
                    ? "Generating..."
                    : "Generate Answers"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {filtered.map((q, idx) => (
          <AnswerCard
            key={q.id}
            question={q}
            rfpId={rfpId}
            index={activeSection ? idx : q.order_index}
            teamMembers={teamMembers}
          />
        ))}
      </div>
    </div>
  );
}
