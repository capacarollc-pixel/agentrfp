import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface OrgUsage {
  documents: { used: number; limit: number };
  rfps: { used: number; limit: number };
  users: { used: number; limit: number };
  storageMb: { used: number; limit: number };
  plan: string;
}

export interface PlanLimits {
  storage_limit_mb: number;
  doc_limit: number;
  rfp_limit: number;
  user_limit: number;
}

const PLAN_DEFAULTS: Record<string, PlanLimits> = {
  free: { storage_limit_mb: 100, doc_limit: 10, rfp_limit: 5, user_limit: 3 },
  starter: { storage_limit_mb: 500, doc_limit: 50, rfp_limit: 25, user_limit: 10 },
  pro: { storage_limit_mb: 5000, doc_limit: 500, rfp_limit: 100, user_limit: 50 },
  enterprise: { storage_limit_mb: 50000, doc_limit: 5000, rfp_limit: 1000, user_limit: 500 },
};

export async function getOrgUsage(orgId: string): Promise<OrgUsage> {
  const admin = getAdminClient();

  const [docsRes, rfpsRes, usersRes, orgRes] = await Promise.all([
    admin.from("documents").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("rfps").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("users").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    admin.from("organizations").select("plan, storage_limit_mb, doc_limit, rfp_limit, user_limit").eq("id", orgId).single(),
  ]);

  const plan = orgRes.data?.plan || "free";
  const limits = PLAN_DEFAULTS[plan] || PLAN_DEFAULTS.free;

  // Estimate storage from document count (rough: avg 2MB per doc)
  const docCount = docsRes.count || 0;
  const estimatedStorageMb = docCount * 2;

  return {
    documents: {
      used: docCount,
      limit: orgRes.data?.doc_limit || limits.doc_limit,
    },
    rfps: {
      used: rfpsRes.count || 0,
      limit: orgRes.data?.rfp_limit || limits.rfp_limit,
    },
    users: {
      used: usersRes.count || 0,
      limit: orgRes.data?.user_limit || limits.user_limit,
    },
    storageMb: {
      used: estimatedStorageMb,
      limit: orgRes.data?.storage_limit_mb || limits.storage_limit_mb,
    },
    plan,
  };
}

export async function checkLimit(
  orgId: string,
  resource: "documents" | "rfps" | "users"
): Promise<{ allowed: boolean; message?: string }> {
  const usage = await getOrgUsage(orgId);
  const { used, limit } = usage[resource];

  if (used >= limit) {
    const planName = usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1);
    return {
      allowed: false,
      message: `You've reached the ${resource} limit (${used}/${limit}) on the ${planName} plan. Upgrade to add more.`,
    };
  }

  return { allowed: true };
}
