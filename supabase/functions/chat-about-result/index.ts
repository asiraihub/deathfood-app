import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `তুমি একজন খাদ্য বিশ্লেষণ সহায়ক AI। তোমার কাজ হলো ব্যবহারকারীকে তাদের খাবারের উপাদান বিশ্লেষণের ফলাফল বুঝতে সাহায্য করা।

গুরুত্বপূর্ণ নিয়ম:
1. সবসময় বাংলায় উত্তর দাও।
2. প্রতিটি উত্তর সর্বোচ্চ ৩-৪ লাইনের মধ্যে দাও।
3. কোনো greeting বা সালাম দেওয়ার দরকার নেই। সরাসরি বিষয়ে কথা বলো।
4. কোনো disclaimer বা পরিচয় দেওয়ার দরকার নেই।
5. মেডিকেল পরামর্শ দিও না। কেউ রোগ বা চিকিৎসা জিজ্ঞেস করলে সংক্ষেপে বলো ডাক্তারের কাছে যেতে।
6. শুধুমাত্র খাদ্য উপাদান, পুষ্টি, এবং সাধারণ খাদ্য নিরাপত্তা সম্পর্কে তথ্য দাও।
7. সহজ ভাষায়, সংক্ষিপ্ত ও সরাসরি উত্তর দাও।`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, resultContext, userProfile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message with the analysis result
    let contextMsg = SYSTEM_PROMPT;
    if (resultContext) {
      contextMsg += `\n\nব্যবহারকারীর সর্বশেষ খাদ্য বিশ্লেষণের ফলাফল:\n`;
      contextMsg += `সামগ্রিক মূল্যায়ন: ${resultContext.summary_bn}\n`;
      contextMsg += `উপাদান তালিকা:\n`;
      for (const ing of resultContext.ingredients || []) {
        contextMsg += `- ${ing.name_bn} (${ing.name_en}) — ${ing.status === 'safe' ? 'নিরাপদ' : ing.status === 'warning' ? 'সতর্কতা' : 'ক্ষতিকর'}${ing.reason_bn ? ': ' + ing.reason_bn : ''}\n`;
      }
      contextMsg += `\nএই ফলাফলের ভিত্তিতে ব্যবহারকারীর প্রশ্নের উত্তর দাও।`;
    }

    if (userProfile && (userProfile.age || userProfile.gender || userProfile.has_diabetic || userProfile.has_heart_problem || userProfile.has_allergy || userProfile.health_notes || userProfile.weight || userProfile.height)) {
      contextMsg += `\n\n⚠️ ব্যবহারকারীর স্বাস্থ্য তথ্য (উত্তরে এগুলো বিবেচনা করো):\n`;
      if (userProfile.age) contextMsg += `- বয়স: ${userProfile.age} বছর\n`;
      if (userProfile.gender) contextMsg += `- লিঙ্গ: ${userProfile.gender === 'male' ? 'পুরুষ' : 'মহিলা'}\n`;
      if (userProfile.weight) contextMsg += `- ওজন: ${userProfile.weight} কেজি\n`;
      if (userProfile.height) {
        const feet = Math.floor(userProfile.height);
        const inch = Math.round((userProfile.height - feet) * 10);
        contextMsg += `- উচ্চতা: ${feet} ফুট ${inch} ইঞ্চি\n`;
      }
      if (userProfile.has_diabetic) contextMsg += `- ডায়াবেটিস আছে\n`;
      if (userProfile.has_heart_problem) contextMsg += `- হৃদরোগ আছে\n`;
      if (userProfile.has_allergy) contextMsg += `- এলার্জি আছে\n`;
      if (userProfile.health_notes) contextMsg += `- অতিরিক্ত তথ্য: ${userProfile.health_notes}\n`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextMsg },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনেক বেশি অনুরোধ, একটু পরে চেষ্টা করুন।" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "ক্রেডিট শেষ হয়ে গেছে।" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI তে সমস্যা হয়েছে" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
