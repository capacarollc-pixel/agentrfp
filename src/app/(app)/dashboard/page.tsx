export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Fetch counts and status
  const [rfpsRes, docsRes, apiKeyRes, membersRes, libraryRes] =
    await Promise.all([
      supabase
        .from("rfps")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user!.org_id),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user!.org_id),
      supabase
        .from("api_keys")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user!.org_id),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user!.org_id),
      supabase
        .from("answer_library")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user!.org_id),
    ]);

  const rfpCount = rfpsRes.count ?? 0;
  const docCount = docsRes.count ?? 0;
  const hasApiKey = (apiKeyRes.count ?? 0) > 0;
  const memberCount = membersRes.count ?? 0;
  const libraryCount = libraryRes.count ?? 0;

  // Onboarding checklist
  const steps = [
    {
      done: hasApiKey,
      label: "Add your Anthropic API key",
      href: "/settings/api-keys",
      hint: "Required for AI features",
    },
    {
      done: docCount > 0,
      label: "Upload a knowledge document",
      href: "/knowledge/upload",
      hint: "PDF, DOCX, Excel, or TXT",
    },
    {
      done: rfpCount > 0,
      label: "Import your first RFP",
      href: "/rfps/new",
      hint: "AI will extract questions automatically",
    },
    {
      done: libraryCount > 0,
      label: "Approve answers to build your library",
      href: "/rfps",
      hint: "Approved answers are reused on future RFPs",
    },
    {
      done: memberCount > 1,
      label: "Invite a team member",
      href: "/settings/team",
      hint: "Collaborate on RFP responses",
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user!.full_name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your RFPs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Active RFPs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{rfpCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Knowledge Docs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{docCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Answer Library</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {libraryCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Team Members</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {memberCount}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/rfps/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Import RFP
          </Link>
          <Link
            href="/knowledge/upload"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Upload Knowledge Doc
          </Link>
          <Link
            href="/settings/team"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Invite Teammate
          </Link>
          <Link
            href="/help"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Help Docs
          </Link>
        </div>
      </div>

      {/* Onboarding checklist */}
      {!allDone && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Getting Started
            </h2>
            <span className="text-sm text-gray-500">
              {completedSteps}/{steps.length} complete
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(completedSteps / steps.length) * 100}%`,
              }}
            />
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  step.done
                    ? "bg-green-50"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-white"
                  }`}
                >
                  {step.done ? "\u2713" : i + 1}
                </span>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      step.done
                        ? "text-green-700 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500">{step.hint}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
