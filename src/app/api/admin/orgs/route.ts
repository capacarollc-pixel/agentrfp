import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { getTrialStatus } from "@/lib/trial";

const PLATFORM_ADMIN_EMAILS = (
  process.env.PLATFORM_ADMIN_EMAILS || "capacarollc@gmail.com"
).split(",");

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function groupByOrg<T extends { org_id: string }>(items: T[]): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    if (!map[item.org_id]) map[item.org_id] = [];
    map[item.org_id].push(item);
  }
  return map;
}

function latestDate(dates: (string | null | undefined)[]): string | null {
  const valid = dates.filter(Boolean) as string[];
  if (!valid.length) return null;
  return valid.sort().reverse()[0];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("email")
      .eq("id", user.id)
      .single();
    if (!profile || !PLATFORM_ADMIN_EMAILS.includes(profile.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch everything in parallel
    const [orgsRes, docsRes, rfpsRes, usersRes, questionsRes, answersRes] =
      await Promise.all([
        admin
          .from("organizations")
          .select("id, name, plan, created_at, doc_limit, rfp_limit, user_limit")
          .order("created_at", { ascending: false }),
        admin.from("documents").select("id, org_id, created_at"),
        admin.from("rfps").select("id, org_id, created_at, status"),
        admin.from("users").select("id, org_id"),
        admin.from("questions").select("id, org_id"),
        admin
          .from("answers")
          .select("id, org_id, is_ai_generated, created_at")
          .eq("is_ai_generated", true),
      ]);

    const orgs = orgsRes.data || [];
    const docsByOrg = groupByOrg(docsRes.data || []);
    const rfpsByOrg = groupByOrg(rfpsRes.data || []);
    const usersByOrg = groupByOrg(usersRes.data || []);
    const questionsByOrg = groupByOrg(questionsRes.data || []);
    const answersByOrg = groupByOrg(answersRes.data || []);

    const result = orgs.map((org) => {
      const orgDocs = docsByOrg[org.id] || [];
      const orgRfps = rfpsByOrg[org.id] || [];
      const orgUsers = usersByOrg[org.id] || [];
      const orgQuestions = questionsByOrg[org.id] || [];
      const orgAnswers = answersByOrg[org.id] || [];

      const docLimit = org.doc_limit ?? 10;
      const rfpLimit = org.rfp_limit ?? 5;
      const userLimit = org.user_limit ?? 3;

      const lastActivity = latestDate([
        ...orgDocs.map((d) => d.created_at),
        ...orgRfps.map((r) => r.created_at),
        ...orgAnswers.map((a) => a.created_at),
      ]);

      const trial = getTrialStatus(org.created_at);

      const limitsHit: string[] = [];
      if (orgDocs.length >= docLimit) limitsHit.push("docs");
      if (orgRfps.length >= rfpLimit) limitsHit.push("rfps");
      if (orgUsers.length >= userLimit) limitsHit.push("users");

      const completedRfps = orgRfps.filter((r) => r.status === "completed").length;

      return {
        id: org.id,
        name: org.name,
        plan: org.plan || "free",
        created_at: org.created_at,
        trial,
        users: { count: orgUsers.length, limit: userLimit },
        docs: { count: orgDocs.length, limit: docLimit },
        rfps: { count: orgRfps.length, limit: rfpLimit, completed: completedRfps },
        questions: orgQuestions.length,
        aiAnswers: orgAnswers.length,
        lastActivity,
        limitsHit,
        hasActivity: orgDocs.length > 0 || orgRfps.length > 0,
      };
    });

    return NextResponse.json({ orgs: result });
  } catch (err) {
    console.error("Admin orgs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
