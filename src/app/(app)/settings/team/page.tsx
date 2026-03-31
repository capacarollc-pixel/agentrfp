export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { InviteForm } from "./invite-form";

export default async function TeamPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("users")
    .select("id, email, full_name, role, created_at")
    .eq("org_id", user!.org_id)
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Invite */}
      {user!.role === "admin" && <InviteForm />}

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-1">
            {members?.length || 0} member{(members?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {members?.map((member) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {member.full_name}
                  {member.id === user!.id && (
                    <span className="text-xs text-gray-400 ml-2">(you)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  member.role === "admin"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
