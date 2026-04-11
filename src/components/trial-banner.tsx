"use client";

import Link from "next/link";

export function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining > 7) return null;

  const urgent = daysRemaining <= 3;

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium ${
        urgent
          ? "bg-red-50 text-red-700 border-b border-red-200"
          : "bg-yellow-50 text-yellow-700 border-b border-yellow-200"
      }`}
    >
      {daysRemaining === 0
        ? "Your free trial has ended. "
        : `Your free trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}. `}
      <Link
        href="/settings/billing"
        className="underline font-semibold hover:opacity-80"
      >
        Subscribe now
      </Link>
    </div>
  );
}
