import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file.name;
    const dueDate = formData.get("dueDate") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload RFP source file to storage
    const filePath = `${profile.org_id}/rfps/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("RFP upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }

    // Create RFP record
    const { data: rfp, error: rfpError } = await admin
      .from("rfps")
      .insert({
        org_id: profile.org_id,
        title,
        status: "draft",
        source_file_path: filePath,
        due_date: dueDate || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (rfpError) {
      console.error("RFP insert error:", rfpError);
      return NextResponse.json(
        { error: "Failed to create RFP" },
        { status: 500 }
      );
    }

    // Audit log
    await admin.from("audit_log").insert({
      org_id: profile.org_id,
      user_id: user.id,
      action: "rfp_created",
      entity_type: "rfp",
      entity_id: rfp.id,
      metadata: { title },
    });

    return NextResponse.json({ id: rfp.id, title, status: "draft" });
  } catch (err) {
    console.error("RFP create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
