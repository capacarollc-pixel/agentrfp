"use client";

import { useState, useEffect } from "react";

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  org_id: string;
  organizations: { name: string } | null;
  account_age: string;
  account_days: number;
}

interface OrgInfo {
  id: string;
  name: string;
  plan: string;
  created_at: string;
  trial: { daysElapsed: number; daysRemaining: number; expired: boolean };
  users: { count: number; limit: number };
  docs: { count: number; limit: number };
  rfps: { count: number; limit: number; completed: number };
  questions: number;
  aiAnswers: number;
  lastActivity: string | null;
  limitsHit: string[];
  hasActivity: boolean;
}

interface Stats {
  totalUsers: number;
  totalOrgs: number;
  totalRfps: number;
  totalDocs: number;
  totalLibraryAnswers: number;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function UsageCell({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  const pct = limit > 0 ? (count / limit) * 100 : 0;
  const atLimit = count >= limit;
  const nearLimit = pct >= 80 && !atLimit;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-sm font-medium ${
          atLimit
            ? "text-red-600"
            : nearLimit
            ? "text-amber-600"
            : "text-gray-700"
        }`}
      >
        {count}/{limit}
      </span>
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            atLimit
              ? "bg-red-500"
              : nearLimit
              ? "bg-amber-400"
              : "bg-blue-400"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-gray-100 text-gray-600",
    starter: "bg-blue-50 text-blue-700",
    pro: "bg-purple-50 text-purple-700",
    enterprise: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        colors[plan] || colors.free
      }`}
    >
      {plan}
    </span>
  );
}

function TrialBadge({
  trial,
}: {
  trial: OrgInfo["trial"];
}) {
  if (trial.expired) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        Trial expired
      </span>
    );
  }
  if (trial.daysRemaining <= 7) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        {trial.daysRemaining}d left
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">
      {trial.daysRemaining}d left
    </span>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"orgs" | "users">("orgs");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteOrg, setDeleteOrg] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [usersRes, statsRes, orgsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/stats"),
      fetch("/api/admin/orgs"),
    ]);

    if (usersRes.status === 403) {
      setError("Access denied. Platform admin only.");
      setLoading(false);
      return;
    }

    if (usersRes.ok) setUsers((await usersRes.json()).users);
    if (statsRes.ok) setStats(await statsRes.json());
    if (orgsRes.ok) setOrgs((await orgsRes.json()).orgs);

    setLoading(false);
  }

  async function handleDelete(userId: string) {
    setDeletingId(userId);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, deleteOrg }),
    });
    if (res.ok) {
      setConfirmDelete(null);
      loadData();
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const inactiveOrgs = orgs.filter((o) => !o.hasActivity).length;
  const limitOrgs = orgs.filter((o) => o.limitsHit.length > 0).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
        <p className="text-gray-500 mt-1">Manage all accounts across AgentRFP.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Users" value={stats.totalUsers} />
          <StatCard label="Organizations" value={stats.totalOrgs} />
          <StatCard label="RFPs" value={stats.totalRfps} />
          <StatCard label="Knowledge Docs" value={stats.totalDocs} />
          <StatCard label="Library Answers" value={stats.totalLibraryAnswers} />
        </div>
      )}

      {/* Callout row */}
      {(inactiveOrgs > 0 || limitOrgs > 0) && (
        <div className="flex gap-3 mb-6">
          {inactiveOrgs > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span>
                <strong className="text-gray-900">{inactiveOrgs}</strong> org
                {inactiveOrgs !== 1 ? "s" : ""} with no activity yet
              </span>
            </div>
          )}
          {limitOrgs > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>
                <strong>{limitOrgs}</strong> org
                {limitOrgs !== 1 ? "s" : ""} at a plan limit
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <TabButton active={tab === "orgs"} onClick={() => setTab("orgs")}>
          Organizations ({orgs.length})
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Users ({users.length})
        </TabButton>
      </div>

      {/* Organizations tab */}
      {tab === "orgs" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Organization</th>
                  <th className="px-6 py-3 text-left">Plan / Trial</th>
                  <th className="px-6 py-3 text-left">Users</th>
                  <th className="px-6 py-3 text-left">Docs</th>
                  <th className="px-6 py-3 text-left">RFPs</th>
                  <th className="px-6 py-3 text-left">AI Answers</th>
                  <th className="px-6 py-3 text-left">Last Active</th>
                  <th className="px-6 py-3 text-left">Limits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((org) => (
                  <tr
                    key={org.id}
                    className={`hover:bg-gray-50 ${
                      !org.hasActivity ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Created {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <PlanBadge plan={org.plan} />
                        <TrialBadge trial={org.trial} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UsageCell count={org.users.count} limit={org.users.limit} />
                    </td>
                    <td className="px-6 py-4">
                      <UsageCell count={org.docs.count} limit={org.docs.limit} />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <UsageCell count={org.rfps.count} limit={org.rfps.limit} />
                        {org.rfps.completed > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {org.rfps.completed} completed
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          org.aiAnswers > 0 ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {org.aiAnswers > 0 ? org.aiAnswers.toLocaleString() : "—"}
                      </span>
                      {org.questions > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {org.questions} questions
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${
                          org.lastActivity ? "text-gray-700" : "text-gray-400 italic"
                        }`}
                      >
                        {relativeTime(org.lastActivity)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {org.limitsHit.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {org.limitsHit.map((l) => (
                            <span
                              key={l}
                              className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Organization</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Account Age</th>
                  <th className="px-6 py-3 text-left">Signed Up</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {(u.organizations as unknown as { name: string })?.name ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{u.account_age}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {confirmDelete === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-500">
                            <input
                              type="checkbox"
                              checked={deleteOrg}
                              onChange={(e) => setDeleteOrg(e.target.checked)}
                              className="rounded"
                            />
                            Delete org &amp; data
                          </label>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingId === u.id ? "Deleting..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setConfirmDelete(u.id);
                            setDeleteOrg(true);
                          }}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
