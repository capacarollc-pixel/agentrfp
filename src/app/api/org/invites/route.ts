import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Send invite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite team members" },
        { status: 403 }
      );
    }

    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if already a member
    const { data: existingUser } = await admin
      .from("users")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "This person is already a member" },
        { status: 400 }
      );
    }

    // Check if already invited
    const { data: existingInvite } = await admin
      .from("invites")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("email", email)
      .is("accepted_at", null)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: "This person already has a pending invite" },
        { status: 400 }
      );
    }

    // Create invite
    const { error: inviteError } = await admin.from("invites").insert({
      org_id: profile.org_id,
      email,
      role: role || "member",
      invited_by: user.id,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "invite_sent",
      entity_type: "invite",
      metadata: { email, role: role || "member" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// List pending invites
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: invites } = await admin
      .from("invites")
      .select("*")
      .eq("org_id", profile.org_id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    return NextResponse.json({ invites: invites || [] });
  } catch (err) {
    console.error("List invites error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
