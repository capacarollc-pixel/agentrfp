import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient, encrypt } from "@/lib/connectors/base";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from("users").select("org_id").eq("id", user.id).single();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: connectors } = await admin
      .from("connectors")
      .select("id, type, name, instance_url, enabled, last_sync_at, created_at, config")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ connectors: connectors || [] });
  } catch (err) {
    console.error("List connectors error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from("users").select("org_id, role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can manage connectors" }, { status: 403 });
    }

    const { type, name, instance_url, client_id, client_secret, config } = await request.json();

    if (!type || !name || !instance_url) {
      return NextResponse.json({ error: "Type, name, and instance URL are required" }, { status: 400 });
    }

    const { data: connector, error } = await admin
      .from("connectors")
      .insert({
        org_id: profile.org_id,
        type,
        name,
        instance_url: instance_url.replace(/\/$/, ""), // Remove trailing slash
        client_id: client_id || null,
        client_secret_encrypted: client_secret ? encrypt(client_secret) : null,
        config: config || {},
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create connector" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "connector_added",
      entity_type: "connector",
      entity_id: connector.id,
      metadata: { type, name },
    });

    return NextResponse.json({ connector });
  } catch (err) {
    console.error("Create connector error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from("users").select("org_id, role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can manage connectors" }, { status: 403 });
    }

    const { id } = await request.json();
    await admin.from("connectors").delete().eq("id", id).eq("org_id", profile.org_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete connector error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
