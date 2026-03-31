import { Sidebar } from "@/components/sidebar";
import { SetupProfile } from "@/components/setup-profile";
import { getCurrentUser } from "@/lib/supabase/user";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  // Auth user exists but no profile — needs onboarding
  if (!user) {
    return <SetupProfile />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar orgName={user.organizations?.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
