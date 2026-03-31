export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { SearchBar } from "@/components/search-bar";
import { DeleteButton } from "@/components/delete-button";
import { LibraryFilter } from "./library-filter";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("answer_library")
    .select("*")
    .eq("org_id", user!.org_id)
    .order("updated_at", { ascending: false });

  // Collect all unique tags for the filter
  const allTags = new Set<string>();
  (entries || []).forEach((e) => {
    (e.tags || []).forEach((t: string) => allTags.add(t));
  });
  const tagList = Array.from(allTags).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Answer Library</h1>
        <span className="text-sm text-gray-500">
          {entries?.length || 0} answers
        </span>
      </div>

      <div className="mb-4">
        <SearchBar
          searchType="library"
          placeholder="Search questions and answers..."
        />
      </div>

      <LibraryFilter tags={tagList} entries={entries || []} />
    </div>
  );
}
