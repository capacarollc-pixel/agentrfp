"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    const res = await fetch("/api/org/invites");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites);
    }
  }

  async function handleInvite() {
    if (!email) return;
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/org/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    if (res.ok) {
      setMessage(`Invite sent to ${email}`);
      setEmail("");
      loadInvites();
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send invite");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Invite Team Members
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Invited users can sign in with Google, Microsoft, or email and will automatically join your organization.
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleInvite}
          disabled={loading || !email}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? "Sending..." : "Send Invite"}
        </button>
      </div>

      {message && (
        <div className="text-sm text-green-700 bg-green-50 rounded-lg p-3 mt-3">
          {message}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">
          {error}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Pending Invites
          </h3>
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{inv.email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {inv.role} · {new Date(inv.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                    pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
