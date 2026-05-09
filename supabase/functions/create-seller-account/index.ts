// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user } } = await callerClient.auth.getUser();
    const { data: profile } = await callerClient.from("profiles").select("role").eq("id", user?.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");

    const { application_id, email, password, mobile } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get application
    const { data: app } = await supabaseAdmin
      .from("seller_applications")
      .select("*").eq("id", application_id).single();

    if (!app) throw new Error("Application not found");

    // Create user via admin API (does NOT sign out the admin)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email || app.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: app.owner_name.split(" ")[0],
        last_name: app.owner_name.split(" ").slice(1).join(" ") || "",
        mobile_number: mobile || app.phone,
        role: "seller",
      },
    });

    if (createError) throw createError;

    // Approve application
    await supabaseAdmin
      .from("seller_applications")
      .update({ status: "approved" })
      .eq("id", application_id);

    return new Response(
      JSON.stringify({ success: true, user_id: newUser.user.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
