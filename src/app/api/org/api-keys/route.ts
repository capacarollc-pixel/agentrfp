import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const validProviders = ["anthropic", "openai", "google"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, provider } = await request.json();

    if (!key || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("org_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can manage API keys" }, { status: 403 });
    }

    const encrypted = Buffer.from(`enc:${key}`).toString("base64");

    // Upsert: delete existing key for this provider, insert new one
    await admin
      .from("api_keys")
      .delete()
      .eq("org_id", profile.org_id)
      .eq("provider", provider);

    const { error } = await admin.from("api_keys").insert({
      org_id: profile.org_id,
      provider,
      encrypted_key: encrypted,
      created_by: user.id,
    });

    if (error) {
      console.error("Failed to save API key:", error);
      return NextResponse.json({ error: "Failed to save API key" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "api_key_updated",
      entity_type: "api_key",
      metadata: { provider },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API key save error:", err);
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
      return NextResponse.json({ error: "Only admins can manage API keys" }, { status: 403 });
    }

    const { id } = await request.json();

    await admin
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("org_id", profile.org_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API key delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
