// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Step 1: Verify the caller is a logged-in admin ──────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_ANON_KEY"),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Parse the request body ──────────────────────────────────────
    const { application_id, email, password, mobile } = await req.json();

    if (!application_id || !email || !password) {
      return new Response(
        JSON.stringify({ error: "application_id, email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Use service role client for privileged operations ───────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    // ── Step 4: Fetch the seller application ────────────────────────────────
    const { data: application, error: appError } = await supabaseAdmin
      .from("seller_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: "Seller application not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (application.status === "approved") {
      return new Response(
        JSON.stringify({ error: "This application is already approved" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Create the seller auth account via Admin SDK ────────────────
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: application.owner_name.split(" ")[0],
        last_name: application.owner_name.split(" ").slice(1).join(" ") || "",
        mobile_number: mobile || application.phone,
        role: "seller",
      },
    });

    if (createError) {
      if (!createError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Step 6: Approve the application ─────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from("seller_applications")
      .update({ status: "approved" })
      .eq("id", application_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update application status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 7: Send welcome email via Resend ───────────────────────────────
    const sellerPortalUrl = Deno.env.get("SELLER_PORTAL_URL") || "https://seller.swaxthika.com";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Swaxthika <noreply@swaxthika.com>";

    let emailSent = false;
    let emailError = null;

    if (RESEND_API_KEY) {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf9f6;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e3d9;">
    <div style="background-color:#78350f;padding:32px 40px;text-align:center;">
      <h1 style="color:#fef3c7;font-size:28px;font-weight:400;margin:0;letter-spacing:1px;">Swaxthika</h1>
      <p style="color:#fcd34d;font-size:13px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase;">Seller Partner Portal</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#78350f;font-size:22px;font-weight:500;margin:0 0 12px;">Welcome, ${application.owner_name}!</h2>
      <p style="color:#57534e;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Congratulations! Your seller application for <strong style="color:#1c1917;">${application.business_name}</strong> has been approved.
        You can now access the Swaxthika Seller Portal to manage your products and track orders.
      </p>
      <div style="background:#fef9f0;border:1px solid #fcd34d;border-radius:8px;padding:24px;margin:0 0 28px;">
        <p style="color:#78350f;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Login Credentials</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#78350f;font-size:14px;font-weight:600;width:120px;">Portal URL</td>
            <td style="padding:8px 0;color:#1c1917;font-size:14px;">
              <a href="${sellerPortalUrl}" style="color:#92400e;text-decoration:underline;">${sellerPortalUrl}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#78350f;font-size:14px;font-weight:600;">Email</td>
            <td style="padding:8px 0;color:#1c1917;font-size:14px;font-family:monospace;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#78350f;font-size:14px;font-weight:600;">Password</td>
            <td style="padding:8px 0;color:#1c1917;font-size:14px;font-family:monospace;">${password}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;margin:0 0 32px;">
        <a href="${sellerPortalUrl}" style="display:inline-block;background-color:#78350f;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:500;letter-spacing:0.5px;">
          Access Seller Portal
        </a>
      </div>
      <div style="background:#fef2f2;border-left:3px solid #ef4444;padding:14px 16px;border-radius:4px;margin:0 0 28px;">
        <p style="color:#991b1b;font-size:13px;margin:0;line-height:1.6;">
          <strong>Security reminder:</strong> Please change your password after your first login. Do not share your credentials with anyone.
        </p>
      </div>
      <div style="border-top:1px solid #e8e3d9;padding-top:24px;">
        <p style="color:#78350f;font-size:14px;font-weight:600;margin:0 0 12px;">Getting started</p>
        <ul style="color:#57534e;font-size:14px;line-height:2;margin:0;padding-left:20px;">
          <li>Log in to the seller portal using the credentials above</li>
          <li>Add your first product from the Products section</li>
          <li>Products go live on the main site as soon as you save them</li>
          <li>Track your orders and revenue from the Dashboard</li>
        </ul>
      </div>
    </div>
    <div style="background:#faf9f6;padding:20px 40px;text-align:center;border-top:1px solid #e8e3d9;">
      <p style="color:#a8a29e;font-size:12px;margin:0;line-height:1.6;">
        This email was sent to ${application.email} because your seller application was approved.<br>
        &copy; Swaxthika. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`.trim();

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [application.email],
            subject: "Welcome to Swaxthika Seller Portal — Your Login Credentials",
            html: emailHtml,
          }),
        });

        if (emailRes.ok) {
          emailSent = true;
          console.log("Email sent successfully via Resend");
        } else {
          const errBody = await emailRes.text();
          console.error("Resend API error:", emailRes.status, errBody);
          emailError = `Resend returned ${emailRes.status}: ${errBody}`;
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        emailError = emailErr.message;
      }
    } else {
      emailError = "RESEND_API_KEY not configured";
    }

    // ── Step 8: Return success ──────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent
          ? "Seller approved! Credentials email sent successfully."
          : "Seller approved! (Email not sent — use copy button to share credentials)",
        seller_email: email,
        seller_name: application.owner_name,
        business_name: application.business_name,
        email_sent: emailSent,
        email_error: emailError,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (err) {
    console.error("approve-seller error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
