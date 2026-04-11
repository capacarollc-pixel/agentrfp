import { Sidebar } from "@/components/sidebar";
import { SetupProfile } from "@/components/setup-profile";
import { TrialBanner } from "@/components/trial-banner";
import { TrialGate } from "@/components/trial-gate";
import { getCurrentUser } from "@/lib/supabase/user";
import { getTrialStatus } from "@/lib/trial";
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

  // Check trial / subscription status
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", user.org_id)
    .single();

  const isSubscribed =
    subscription?.status === "active" || subscription?.status === "trialing";

  const trial = getTrialStatus(user.organizations?.created_at);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar orgName={user.organizations?.name} userEmail={user.email} />
      <main className="flex-1 overflow-auto">
        {!isSubscribed && <TrialBanner daysRemaining={trial.daysRemaining} />}
        <div className="p-8">
          {trial.expired && !isSubscribed ? (
            <TrialGate>{children}</TrialGate>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
