"use client";

import { useState } from "react";
import { DeleteButton } from "@/components/delete-button";

interface LibraryEntry {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  version: number;
  updated_at: string;
}

export function LibraryFilter({
  tags,
  entries,
}: {
  tags: string[];
  entries: LibraryEntry[];
}) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? entries.filter((e) => e.tags?.includes(activeTag))
    : entries;

  return (
    <>
      {/* Section filter pills */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeTag === null
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({entries.length})
          </button>
          {tags.map((tag) => {
            const count = entries.filter((e) => e.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  activeTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Entries */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {entry.question}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {entry.answer}
              </p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {entry.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  v{entry.version} · Updated{" "}
                  {new Date(entry.updated_at).toLocaleDateString()}
                </p>
                <DeleteButton
                  entityType="answer"
                  entityId={entry.id}
                  entityName={
                    entry.question.slice(0, 40) +
                    (entry.question.length > 40 ? "..." : "")
                  }
                  apiPath="/api/library/delete"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {activeTag
              ? `No answers in "${activeTag}" category.`
              : "No approved answers yet. Complete an RFP to start building your library."}
          </p>
        </div>
      )}
    </>
  );
}
