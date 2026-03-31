export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RfpActions } from "./rfp-actions";
import { RfpQuestionsView } from "@/components/rfp-questions-view";

export default async function RfpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: rfp } = await supabase
    .from("rfps")
    .select("*")
    .eq("id", id)
    .eq("org_id", user!.org_id)
    .single();

  if (!rfp) {
    redirect("/rfps");
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("*, answers(*)")
    .eq("rfp_id", id)
    .order("order_index", { ascending: true });

  const { data: teamMembers } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("org_id", user!.org_id);

  const answeredCount = (questions || []).filter(
    (q) => q.answers && q.answers.length > 0
  ).length;
  const approvedCount = (questions || []).filter(
    (q) => q.status === "approved"
  ).length;
  const totalCount = questions?.length || 0;

  // Section summary
  const sections = Array.from(
    new Set((questions || []).map((q) => q.section).filter(Boolean))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/rfps"
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
          >
            &larr; Back to RFPs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{rfp.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status: {rfp.status.replace("_", " ")}
            {rfp.due_date &&
              ` · Due ${new Date(rfp.due_date).toLocaleDateString()}`}
            {totalCount > 0 &&
              ` · ${answeredCount}/${totalCount} answered · ${approvedCount} approved`}
            {sections.length > 1 && ` · ${sections.length} sections`}
          </p>
        </div>
        <RfpActions
          rfpId={id}
          hasQuestions={totalCount > 0}
          hasAnswers={answeredCount > 0}
          allApproved={approvedCount === totalCount && totalCount > 0}
          rfpStatus={rfp.status}
        />
      </div>

      {questions && questions.length > 0 ? (
        <RfpQuestionsView
          questions={questions}
          rfpId={id}
          teamMembers={teamMembers || []}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">
            {rfp.status === "parsing"
              ? "Questions are being parsed... This page will update automatically."
              : 'No questions parsed yet. Click "Parse Questions" to extract questions from this RFP using AI.'}
          </p>
        </div>
      )}
    </div>
  );
}
