import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    const { data: integrations } = await admin
      .from("integrations")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ integrations: integrations || [] });
  } catch (err) {
    console.error("List integrations error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Only admins can manage integrations" }, { status: 403 });
    }

    const { type, name, webhook_url, config } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    const { data: integration, error } = await admin
      .from("integrations")
      .insert({
        org_id: profile.org_id,
        type,
        name,
        webhook_url: webhook_url || null,
        config: config || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "integration_added",
      entity_type: "integration",
      entity_id: integration.id,
      metadata: { type, name },
    });

    return NextResponse.json({ integration });
  } catch (err) {
    console.error("Create integration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
      return NextResponse.json({ error: "Only admins can manage integrations" }, { status: 403 });
    }

    const { id } = await request.json();

    await admin
      .from("integrations")
      .delete()
      .eq("id", id)
      .eq("org_id", profile.org_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete integration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
