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

interface Stats {
  totalUsers: number;
  totalOrgs: number;
  totalRfps: number;
  totalDocs: number;
  totalLibraryAnswers: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteOrg, setDeleteOrg] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [usersRes, statsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/stats"),
    ]);

    if (usersRes.status === 403) {
      setError("Access denied. Platform admin only.");
      setLoading(false);
      return;
    }

    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users);
    }

    if (statsRes.ok) {
      setStats(await statsRes.json());
    }

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
        <p className="text-gray-500 mt-1">
          Manage all accounts across AgentRFP.
        </p>
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

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            All Users ({users.length})
          </h2>
        </div>
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
                    {(u.organizations as unknown as { name: string })?.name || "N/A"}
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
