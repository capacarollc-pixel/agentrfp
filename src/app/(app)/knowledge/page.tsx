export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { DeleteButton } from "@/components/delete-button";

export default async function KnowledgePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("org_id", user!.org_id)
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-50 text-yellow-700",
    ready: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <Link
          href="/knowledge/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Upload Document
        </Link>
      </div>

      <div className="mb-6">
        <SearchBar
          searchType="knowledge"
          placeholder="Search knowledge base content..."
        />
      </div>

      {documents && documents.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {doc.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {doc.file_type.toUpperCase()} · {doc.chunk_count} chunks ·
                  Uploaded {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    statusColors[doc.status] || ""
                  }`}
                >
                  {doc.status}
                </span>
                <DeleteButton
                  entityType="document"
                  entityId={doc.id}
                  entityName={doc.title}
                  apiPath="/api/documents/delete"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No documents yet.</p>
          <Link
            href="/knowledge/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upload your first document
          </Link>
        </div>
      )}
    </div>
  );
}
