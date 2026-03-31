"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "API Keys", href: "/settings/api-keys" },
  { name: "Team", href: "/settings/team" },
  { name: "Integrations", href: "/settings/integrations" },
  { name: "Connectors", href: "/settings/connectors" },
  { name: "Audit Log", href: "/settings/audit-log" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              pathname === tab.href
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
