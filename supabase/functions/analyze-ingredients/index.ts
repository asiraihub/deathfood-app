import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `তুমি একজন খাদ্য বিশ্লেষক। ব্যবহারকারী খাবারের প্যাকেটের ছবি পাঠাবে। এটি হতে পারে:
- Ingredients List (উপাদান তালিকা)
- Nutrition Facts / Nutrition Information (পুষ্টি তথ্য)
- অথবা দুটোই একসাথে

তোমাকে ছবিতে যা আছে সেটা বিশ্লেষণ করতে হবে। ছবিতে শুধু Nutrition Facts থাকলেও সেটা বিশ্লেষণ করো — কখনো বলবে না "ইনগ্রিডিয়েন্টস নেই"।

**যদি Ingredients List হয়:**
- প্রতিটি উপাদান চিহ্নিত করো
- বাংলায় অনুবাদ করো
- ক্ষতিকর বা সতর্কতার প্রয়োজন কিনা জানাও

**যদি Nutrition Facts হয়:**
- প্রতিটি পুষ্টি উপাদান (Calories, Total Fat, Saturated Fat, Cholesterol, Sodium, Total Carbohydrate, Sugars, Protein ইত্যাদি) আলাদা আলাদা item হিসেবে ingredients array তে দাও
- পরিমাণ ও % Daily Value সহ name_en এ দেখাও
- কোনটি অতিরিক্ত বা ক্ষতিকর মাত্রায় আছে তা warning/danger দিয়ে চিহ্নিত করো (যেমন: অতিরিক্ত Sugar, Sodium, Saturated Fat)
- স্বাস্থ্যকর মাত্রায় থাকলে safe দাও

**যদি দুটোই থাকে:**
- Ingredients ও Nutrition Facts দুটোই একসাথে ingredients array তে দাও

গুরুত্বপূর্ণ: ingredients array কখনো খালি রাখবে না। ছবিতে যা তথ্য আছে সব বিশ্লেষণ করে ingredients array তে দাও।

উত্তর এই JSON ফরম্যাটে দাও:
{
  "ingredients": [
    {
      "name_en": "English name (e.g. 'Total Fat 20g (30%)')",
      "name_bn": "বাংলা নাম (e.g. 'মোট চর্বি ২০ গ্রাম (৩০%)')",
      "status": "safe" | "warning" | "danger",
      "reason_bn": "বাংলায় কারণ (যদি warning বা danger হয়)"
    }
  ],
  "summary_bn": "সামগ্রিক মূল্যায়ন বাংলায় ২-৩ লাইনে"
}

শুধু JSON দাও, অন্য কিছু না।`;

const USER_PROMPT = "এই খাবারের উপাদান তালিকার ছবি বিশ্লেষণ করো।";

async function getProvider(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from("app_settings").select("ai_provider").limit(1).maybeSingle();
    return data?.ai_provider || "lovable";
  } catch {
    return "lovable";
  }
}

async function callLovableAI(imageBase64: string, systemPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
    }),
  });
}

async function callOpenAI(imageBase64: string, systemPrompt: string) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

  return await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, userProfile } = await req.json();

    let systemPrompt = SYSTEM_PROMPT;
    if (userProfile && (userProfile.age || userProfile.gender || userProfile.has_diabetic || userProfile.has_heart_problem || userProfile.has_allergy || userProfile.health_notes || userProfile.weight || userProfile.height)) {
      systemPrompt += `\n\n⚠️ গুরুত্বপূর্ণ: এই ব্যবহারকারীর স্বাস্থ্য তথ্য বিবেচনা করে ব্যক্তিগতকৃত মূল্যায়ন দাও:\n`;
      if (userProfile.age) systemPrompt += `- বয়স: ${userProfile.age} বছর\n`;
      if (userProfile.gender) systemPrompt += `- লিঙ্গ: ${userProfile.gender === 'male' ? 'পুরুষ' : 'মহিলা'}\n`;
      if (userProfile.weight) systemPrompt += `- ওজন: ${userProfile.weight} কেজি\n`;
      if (userProfile.height) {
        const feet = Math.floor(userProfile.height);
        const inch = Math.round((userProfile.height - feet) * 10);
        systemPrompt += `- উচ্চতা: ${feet} ফুট ${inch} ইঞ্চি\n`;
      }
      if (userProfile.has_diabetic) systemPrompt += `- ডায়াবেটিস আছে — চিনি/শর্করা সম্পর্কে বিশেষ সতর্কতা দাও\n`;
      if (userProfile.has_heart_problem) systemPrompt += `- হৃদরোগ আছে — চর্বি, সোডিয়াম, কোলেস্টেরল সম্পর্কে বিশেষ সতর্কতা দাও\n`;
      if (userProfile.has_allergy) systemPrompt += `- এলার্জি আছে — সম্ভাব্য এলার্জেন উপাদান চিহ্নিত করো\n`;
      if (userProfile.health_notes) systemPrompt += `- অতিরিক্ত স্বাস্থ্য তথ্য: ${userProfile.health_notes}\n`;
      systemPrompt += `\nসামগ্রিক মূল্যায়নে (summary_bn) এই ব্যবহারকারীর স্বাস্থ্য অবস্থা অনুযায়ী ব্যক্তিগত পরামর্শ দাও। কোন উপাদান তার জন্য বিশেষভাবে ক্ষতিকর বা উপকারী সেটা উল্লেখ করো।`;
    }

    const provider = await getProvider();
    console.log("Using AI provider:", provider);

    const response = provider === "openai" ? await callOpenAI(imageBase64, systemPrompt) : await callLovableAI(imageBase64, systemPrompt);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "অনেক বেশি অনুরোধ হয়েছে, একটু পরে চেষ্টা করুন।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "ক্রেডিট শেষ হয়ে গেছে।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI বিশ্লেষণে সমস্যা হয়েছে" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      result = { ingredients: [], summary_bn: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-ingredients error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
