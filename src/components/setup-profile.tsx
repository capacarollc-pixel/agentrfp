"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SetupProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSetup() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/setup-profile", { method: "POST" });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Setup failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Setup Incomplete
        </h1>
        <p className="text-gray-500 mb-4">
          Your account was created but your organization profile is missing.
          This can happen if signup was interrupted.
        </p>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleSetup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Setting up..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}
