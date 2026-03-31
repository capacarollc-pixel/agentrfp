"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt: string;
  metadata?: Record<string, string>;
}

export function SearchBar({
  searchType,
  placeholder,
}: {
  searchType: "all" | "knowledge" | "library" | "documents";
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [fullContent, setFullContent] = useState<string>("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(value)}&type=${searchType}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setOpen(data.results.length > 0);
      }
      setLoading(false);
    }, 300);
  }

  const typeLabels: Record<string, string> = {
    knowledge: "Knowledge",
    library: "Library",
    document: "Document",
  };

  const typeColors: Record<string, string> = {
    knowledge: "bg-blue-50 text-blue-700",
    library: "bg-green-50 text-green-700",
    document: "bg-gray-100 text-gray-600",
  };

  return (
    <div ref={wrapperRef}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && !selected && setOpen(true)}
          placeholder={placeholder || "Search..."}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            searching...
          </span>
        )}
      </div>

      {/* Dropdown results */}
      {open && !selected && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={async () => {
                setSelected(result);
                setOpen(false);
                setLoadingDetail(true);
                setFullContent("");
                try {
                  const res = await fetch(
                    `/api/search/${result.id}?type=${result.type}`
                  );
                  if (res.ok) {
                    const data = await res.json();
                    setFullContent(data.content || result.excerpt);
                  } else {
                    setFullContent(result.excerpt);
                  }
                } catch {
                  setFullContent(result.excerpt);
                }
                setLoadingDetail(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    typeColors[result.type] || typeColors.document
                  }`}
                >
                  {typeLabels[result.type] || result.type}
                </span>
                <span className="text-sm font-medium text-gray-900 truncate">
                  {result.title}
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">
                {result.excerpt}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Expanded result view */}
      {selected && (
        <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  typeColors[selected.type] || typeColors.document
                }`}
              >
                {typeLabels[selected.type] || selected.type}
              </span>
              <h3 className="text-sm font-semibold text-gray-900">
                {selected.title}
              </h3>
            </div>
            <button
              onClick={() => {
                setSelected(null);
                setFullContent("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Close
            </button>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto">
            {loadingDetail ? (
              <p className="text-sm text-gray-400">Loading full content...</p>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {fullContent || selected.excerpt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
