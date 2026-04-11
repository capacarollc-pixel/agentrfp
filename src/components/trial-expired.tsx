"use client";

import Link from "next/link";

export function TrialExpired() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Your 30-day free trial has ended
        </h2>
        <p className="text-gray-500 mb-6">
          Subscribe to continue using AgentRFP. Your data is safe — pick up
          right where you left off.
        </p>
        <Link
          href="/settings/billing"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Subscribe — $49/user/mo
        </Link>
      </div>
    </div>
  );
}
