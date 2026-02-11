import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminKey, action, userId, credits } = await req.json();

    const ADMIN_KEY = Deno.env.get("ADMIN_KEY");
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return Response.json({ error: "Unauthorized" }, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "update-credits" && userId && typeof credits === "number") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("purchased_credits")
        .eq("user_id", userId)
        .single();
      const current = profile?.purchased_credits || 0;
      const newCredits = Math.max(0, current + credits);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ purchased_credits: newCredits })
        .eq("user_id", userId);
      if (updateErr) throw updateErr;
      return Response.json({ success: true, new_credits: newCredits }, { headers: corsHeaders });
    }

    if (action === "stats") {
      const [usersRes, analysisRes, chatRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("analysis_history").select("id", { count: "exact", head: true }),
        supabase.from("chat_history").select("id", { count: "exact", head: true }),
        supabase.from("payment_requests").select("amount, status"),
      ]);
      const totalRevenue = (paymentsRes.data || [])
        .filter((p: any) => p.status === "approved")
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const pendingPayments = (paymentsRes.data || []).filter((p: any) => p.status === "pending").length;
      return Response.json({
        stats: {
          totalUsers: usersRes.count || 0,
          totalAnalysis: analysisRes.count || 0,
          totalChats: chatRes.count || 0,
          totalRevenue,
          pendingPayments,
        }
      }, { headers: corsHeaders });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, phone, age, gender, weight, height, has_diabetic, has_heart_problem, has_allergy, health_notes, purchased_credits, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ data }, { headers: corsHeaders });
  } catch (err) {
    console.error("list-users error:", err);
    return Response.json({ error: err.message }, { headers: corsHeaders, status: 500 });
  }
});
