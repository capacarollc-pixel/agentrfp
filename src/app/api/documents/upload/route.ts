import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { extractText, chunkText } from "@/lib/extract";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for org_id
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = (formData.get("title") as string) || file.name;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    // Determine file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const supportedTypes = ["pdf", "docx", "doc", "txt", "md", "xlsx", "xls", "csv"];
    if (!supportedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}` },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const filePath = `${profile.org_id}/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file: " + uploadError.message },
        { status: 500 }
      );
    }

    // Create document record
    const { data: doc, error: docError } = await admin
      .from("documents")
      .insert({
        org_id: profile.org_id,
        title,
        file_type: ext,
        file_path: filePath,
        status: "processing",
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (docError) {
      console.error("Document insert error:", docError);
      return NextResponse.json(
        { error: "Failed to create document record" },
        { status: 500 }
      );
    }

    // Extract text and chunk (inline for MVP — move to background job later)
    try {
      const text = await extractText(fileBuffer, ext);
      const chunks = chunkText(text);

      // Insert chunks (without embeddings for now — Slice 3 adds those)
      if (chunks.length > 0) {
        const chunkRows = chunks.map((content, index) => ({
          document_id: doc.id,
          org_id: profile.org_id,
          content,
          chunk_index: index,
          metadata: { source: title, file_type: ext },
        }));

        const { error: chunkError } = await admin
          .from("chunks")
          .insert(chunkRows);

        if (chunkError) {
          console.error("Chunk insert error:", chunkError);
          throw chunkError;
        }
      }

      // Update document status
      await admin
        .from("documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);

      // Audit log
      await admin.from("audit_log").insert({
        org_id: profile.org_id,
        user_id: user.id,
        action: "document_uploaded",
        entity_type: "document",
        entity_id: doc.id,
        metadata: { title, file_type: ext, chunk_count: chunks.length },
      });

      return NextResponse.json({
        id: doc.id,
        title,
        chunk_count: chunks.length,
        status: "ready",
      });
    } catch (extractError) {
      console.error("Text extraction error:", extractError);
      await admin
        .from("documents")
        .update({ status: "error" })
        .eq("id", doc.id);

      return NextResponse.json(
        { error: "Failed to process document. The file may be corrupted or password-protected." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
