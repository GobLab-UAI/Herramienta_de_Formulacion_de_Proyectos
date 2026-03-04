import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const CONSULTOR_EMAIL = "admin2026@goblab.local";
    const CONSULTOR_PASSWORD = "consultor2026";
    const CONSULTOR_USERNAME = "admin2026";

    // Check if user already exists by looking up profile
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", CONSULTOR_USERNAME)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ message: "Consultor user already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: CONSULTOR_EMAIL,
      password: CONSULTOR_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Consultor",
        username: CONSULTOR_USERNAME,
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // The trigger will create a profile with FORMULADOR role, so we need to update to CONSULTOR
    await supabaseAdmin
      .from("user_roles")
      .update({ role: "CONSULTOR" })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ message: "Consultor user created", userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
