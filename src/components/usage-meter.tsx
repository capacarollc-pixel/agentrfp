"use client";

import { useState, useEffect } from "react";

interface UsageData {
  documents: { used: number; limit: number };
  rfps: { used: number; limit: number };
  users: { used: number; limit: number };
  storageMb: { used: number; limit: number };
  plan: string;
}

export function UsageMeter() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/org/usage")
      .then((res) => res.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const planLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Usage</h2>
        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
          {planLabels[usage.plan] || usage.plan} Plan
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Meter
          label="Knowledge Docs"
          used={usage.documents.used}
          limit={usage.documents.limit}
        />
        <Meter
          label="RFPs"
          used={usage.rfps.used}
          limit={usage.rfps.limit}
        />
        <Meter
          label="Team Members"
          used={usage.users.used}
          limit={usage.users.limit}
        />
        <Meter
          label="Storage"
          used={usage.storageMb.used}
          limit={usage.storageMb.limit}
          unit="MB"
        />
      </div>
    </div>
  );
}

function Meter({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 80;
  const isMaxed = pct >= 100;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span
          className={`text-xs font-medium ${
            isMaxed
              ? "text-red-600"
              : isWarning
                ? "text-amber-600"
                : "text-gray-700"
          }`}
        >
          {used}{unit ? ` ${unit}` : ""} / {limit}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isMaxed
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-blue-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
