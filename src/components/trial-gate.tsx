"use client";

import { usePathname } from "next/navigation";
import { TrialExpired } from "./trial-expired";

export function TrialGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Allow access to billing and settings pages so user can subscribe
  if (pathname.startsWith("/settings")) {
    return <>{children}</>;
  }

  return <TrialExpired />;
}
