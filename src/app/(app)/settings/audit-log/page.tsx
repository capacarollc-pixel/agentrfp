export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";

export default async function AuditLogPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_log")
    .select("*, users(full_name)")
    .eq("org_id", user!.org_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track all actions taken in your organization.
          </p>
        </div>
        {logs && logs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {(log.users as { full_name: string })?.full_name ?? "System"}
                    </span>{" "}
                    <span className="text-gray-500">{log.action.replace(/_/g, " ")}</span>
                    {log.entity_type && (
                      <span className="text-gray-400">
                        {" "}
                        on {log.entity_type}
                      </span>
                    )}
                  </p>
                </div>
                <time className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500 text-center">
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}
