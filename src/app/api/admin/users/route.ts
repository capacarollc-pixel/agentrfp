import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || "capacarollc@gmail.com").split(",");

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isPlatformAdmin(userId: string): Promise<boolean> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();
  return data ? PLATFORM_ADMIN_EMAILS.includes(data.email) : false;
}

// List all users across all orgs
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await isPlatformAdmin(user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getAdminClient();

    const { data: users } = await admin
      .from("users")
      .select("id, email, full_name, role, created_at, org_id, organizations(name)")
      .order("created_at", { ascending: false });

    // Calculate account age
    const usersWithAge = (users || []).map((u) => {
      const created = new Date(u.created_at);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let age: string;
      if (days === 0) age = "Today";
      else if (days === 1) age = "1 day";
      else if (days < 30) age = `${days} days`;
      else if (days < 365) age = `${Math.floor(days / 30)} months`;
      else age = `${Math.floor(days / 365)} years`;

      return { ...u, account_age: age, account_days: days };
    });

    return NextResponse.json({ users: usersWithAge });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete a user and optionally their org
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!(await isPlatformAdmin(user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, deleteOrg } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const admin = getAdminClient();

    // Get user info before deleting
    const { data: targetUser } = await admin
      .from("users")
      .select("email, full_name, org_id")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (deleteOrg && targetUser.org_id) {
      // Delete entire org (cascades to all data)
      await admin.from("organizations").delete().eq("id", targetUser.org_id);
    }

    // Delete user profile
    await admin.from("users").delete().eq("id", userId);

    // Delete auth user
    await admin.auth.admin.deleteUser(userId);

    console.log(`[PLATFORM ADMIN] Deleted user ${targetUser.email} (org: ${deleteOrg ? "deleted" : "kept"})`);

    return NextResponse.json({
      success: true,
      deleted: targetUser.email,
      orgDeleted: !!deleteOrg,
    });
  } catch (err) {
    console.error("Admin delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
