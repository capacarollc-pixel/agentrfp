export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";

export default async function RfpsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: rfps } = await supabase
    .from("rfps")
    .select("*, questions(id, status, answers(id))")
    .eq("org_id", user!.org_id)
    .order("created_at", { ascending: false });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-50 text-blue-700",
    review: "bg-yellow-50 text-yellow-700",
    completed: "bg-green-50 text-green-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">RFPs</h1>
        <Link
          href="/rfps/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Import RFP
        </Link>
      </div>

      {rfps && rfps.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {rfps.map((rfp) => {
            const questions = rfp.questions || [];
            const totalQ = questions.length;
            const answeredQ = questions.filter(
              (q: { answers: unknown[] }) => q.answers && q.answers.length > 0
            ).length;
            const approvedQ = questions.filter(
              (q: { status: string }) => q.status === "approved"
            ).length;

            return (
              <div
                key={rfp.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Link href={`/rfps/${rfp.id}`} className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {rfp.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Created{" "}
                      {new Date(rfp.created_at).toLocaleDateString()}
                      {rfp.due_date &&
                        ` · Due ${new Date(rfp.due_date).toLocaleDateString()}`}
                      {totalQ > 0 &&
                        ` · ${answeredQ}/${totalQ} answered · ${approvedQ} approved`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-3 ml-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        statusColors[rfp.status] || statusColors.draft
                      }`}
                    >
                      {rfp.status.replace("_", " ")}
                    </span>
                    {totalQ > 0 && (
                      <div className="flex gap-1">
                        <a
                          href={`/api/rfps/${rfp.id}/export/docx`}
                          className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 border border-gray-200 rounded hover:border-blue-300 transition-colors"
                          title="Download Word"
                        >
                          .docx
                        </a>
                        <a
                          href={`/api/rfps/${rfp.id}/export/xlsx`}
                          className="text-xs text-gray-500 hover:text-green-600 px-2 py-1 border border-gray-200 rounded hover:border-green-300 transition-colors"
                          title="Download Excel"
                        >
                          .xlsx
                        </a>
                      </div>
                    )}
                    <DeleteButton
                      entityType="RFP"
                      entityId={rfp.id}
                      entityName={rfp.title}
                      apiPath="/api/rfps/delete"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No RFPs yet.</p>
          <Link
            href="/rfps/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Import your first RFP
          </Link>
        </div>
      )}
    </div>
  );
}
