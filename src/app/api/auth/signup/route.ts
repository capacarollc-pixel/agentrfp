import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Use service role for creating org/user records
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, orgName } = await request.json();

    if (!userId || !email || !fullName || !orgName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgName })
      .select()
      .single();

    if (orgError) {
      console.error("Failed to create org:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      org_id: org.id,
      email,
      full_name: fullName,
      role: "admin", // First user is always admin
    });

    if (userError) {
      console.error("Failed to create user:", userError);
      // Clean up org
      await supabase.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orgId: org.id });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
