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
    const { adminKey, action, paymentId, adminNote } = await req.json();

    const ADMIN_KEY = Deno.env.get("ADMIN_KEY");
    if (!adminKey || adminKey !== ADMIN_KEY) {
      return Response.json({ error: "Unauthorized" }, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "list") {
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*, credit_packages(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return Response.json({ data }, { headers: corsHeaders });
    }

    if (action === "approve" && paymentId) {
      // Get payment request
      const { data: payment, error: fetchErr } = await supabase
        .from("payment_requests")
        .select("*")
        .eq("id", paymentId)
        .single();
      if (fetchErr || !payment) {
        return Response.json({ error: "Payment not found" }, { headers: corsHeaders });
      }
      if (payment.status !== "pending") {
        return Response.json({ error: "Already processed" }, { headers: corsHeaders });
      }

      // Update payment status
      await supabase
        .from("payment_requests")
        .update({ status: "approved", admin_note: adminNote || "Approved" })
        .eq("id", paymentId);

      // Add credits to user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("purchased_credits")
        .eq("user_id", payment.user_id)
        .single();

      const currentCredits = profile?.purchased_credits || 0;
      await supabase
        .from("profiles")
        .update({ purchased_credits: currentCredits + payment.credits })
        .eq("user_id", payment.user_id);

      return Response.json({ success: true, message: "Payment approved, credits added" }, { headers: corsHeaders });
    }

    if (action === "reject" && paymentId) {
      await supabase
        .from("payment_requests")
        .update({ status: "rejected", admin_note: adminNote || "Rejected" })
        .eq("id", paymentId);
      return Response.json({ success: true, message: "Payment rejected" }, { headers: corsHeaders });
    }

    return Response.json({ error: "Invalid action" }, { headers: corsHeaders });
  } catch (err) {
    console.error("manage-payments error:", err);
    return Response.json({ error: err.message }, { headers: corsHeaders, status: 500 });
  }
});
