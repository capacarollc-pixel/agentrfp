import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyAdmin } from "@/lib/admin-notify";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // Check if user has a profile — if not, auto-create one
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const admin = getAdminClient();
    const { data: existingProfile } = await admin
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existingProfile) {
      // No profile yet — check for invite or domain match
      const email = user.email || "";
      const domain = email.split("@")[1];
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0];

      // 1. Check for pending invite
      const { data: invite } = await admin
        .from("invites")
        .select("org_id, role")
        .eq("email", email)
        .is("accepted_at", null)
        .single();

      if (invite) {
        // Join invited org
        await admin.from("users").insert({
          id: user.id,
          org_id: invite.org_id,
          email,
          full_name: fullName,
          role: invite.role,
        });

        // Mark invite as accepted
        await admin
          .from("invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("org_id", invite.org_id)
          .eq("email", email);

        await admin.from("audit_log").insert({
          org_id: invite.org_id,
          user_id: user.id,
          action: "user_joined_via_invite",
          entity_type: "user",
          entity_id: user.id,
        });
      } else if (domain) {
        // 2. Check for domain auto-join
        const { data: orgByDomain } = await admin
          .from("organizations")
          .select("id")
          .eq("allowed_domain", domain)
          .single();

        if (orgByDomain) {
          await admin.from("users").insert({
            id: user.id,
            org_id: orgByDomain.id,
            email,
            full_name: fullName,
            role: "member",
          });

          await admin.from("audit_log").insert({
            org_id: orgByDomain.id,
            user_id: user.id,
            action: "user_joined_via_domain",
            entity_type: "user",
            entity_id: user.id,
            metadata: { domain },
          });
        } else {
          // 3. No invite, no domain match — create new org
          const orgName = user.user_metadata?.org_name || `${fullName}'s Org`;

          const { data: org } = await admin
            .from("organizations")
            .insert({ name: orgName })
            .select()
            .single();

          if (org) {
            await admin.from("users").insert({
              id: user.id,
              org_id: org.id,
              email,
              full_name: fullName,
              role: "admin",
            });

            notifyAdmin({
              event: "new_signup",
              title: "New Signup on AgentRFP",
              message: `*${fullName}* signed up via SSO with org *${orgName}*`,
              details: {
                Name: fullName,
                Email: email,
                Organization: orgName,
                Method: "SSO (Google/Microsoft/Okta)",
                "Signed Up": new Date().toLocaleString(),
              },
            }).catch(() => {});
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
