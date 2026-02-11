import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Scan, Download, MessageCircle, Zap } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import ResultDisplay from "@/components/ResultDisplay";
import ChatDialog from "@/components/ChatDialog";
import ShareResult from "@/components/ShareResult";
import BottomNav from "@/components/BottomNav";
import BuyCreditsDialog from "@/components/BuyCreditsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";
import { Button } from "@/components/ui/button";

interface AnalysisResult {
  ingredients: {
    name_en: string;
    name_bn: string;
    status: "safe" | "warning" | "danger";
    reason_bn?: string;
  }[];
  summary_bn: string;
}

interface UserProfile {
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  height?: number | null;
  has_diabetic?: boolean | null;
  has_heart_problem?: boolean | null;
  has_allergy?: boolean | null;
  health_notes?: string | null;
}

const MAX_DAILY_CREDITS = 5;

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [purchasedCredits, setPurchasedCredits] = useState(0);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const { toast } = useToast();
  const { canInstall, install } = usePwaInstall();
  const { user } = useAuth();
  const { t } = useLang();

  const remainingFreeCredits = Math.max(0, MAX_DAILY_CREDITS - creditsUsed);
  const totalAvailable = remainingFreeCredits + purchasedCredits;

  const getTodayKey = () => {
    const today = new Date();
    return `credits_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const fetchCreditsUsed = useCallback(async () => {
    if (user) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("analysis_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());
      setCreditsUsed(count || 0);
    } else {
      const key = getTodayKey();
      const stored = localStorage.getItem(key);
      setCreditsUsed(stored ? parseInt(stored, 10) : 0);
    }
  }, [user]);

  useEffect(() => {
    fetchCreditsUsed();
  }, [fetchCreditsUsed]);

  useEffect(() => {
    if (!user) { setUserProfile(null); setPurchasedCredits(0); return; }
    supabase.from("profiles").select("age, gender, weight, height, has_diabetic, has_heart_problem, has_allergy, health_notes, purchased_credits")
      .eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setUserProfile(data);
          setPurchasedCredits((data as any).purchased_credits || 0);
        }
      });
  }, [user]);

  const handleCapture = async (imageBase64: string) => {
    if (totalAvailable <= 0) {
      toast({ title: "ক্রেডিট শেষ!", description: "আপনার সব ক্রেডিট শেষ হয়ে গেছে। নতুন ক্রেডিট কিনুন।", variant: "destructive" });
      setBuyDialogOpen(true);
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    setCapturedImage(imageBase64);
    try {
      const [analysisRes, uploadRes] = await Promise.all([
        supabase.functions.invoke("analyze-ingredients", { body: { imageBase64, userProfile } }),
        supabase.functions.invoke("upload-image", { body: { imageBase64 } }),
      ]);
      if (analysisRes.error) throw analysisRes.error;
      if (analysisRes.data?.error) {
        toast({ title: t("problemOccurred"), description: analysisRes.data.error, variant: "destructive" });
        return;
      }
      setResult(analysisRes.data);

      // Update credits - use free credits first, then purchased
      if (!user) {
        const key = getTodayKey();
        const newCount = creditsUsed + 1;
        localStorage.setItem(key, String(newCount));
        setCreditsUsed(newCount);
      } else if (remainingFreeCredits <= 0 && purchasedCredits > 0) {
        // Deduct from purchased credits
        const newPurchased = purchasedCredits - 1;
        setPurchasedCredits(newPurchased);
        supabase.from("profiles").update({ purchased_credits: newPurchased }).eq("user_id", user.id);
      }

      const imageUrl = uploadRes.data?.url || "";
      if (imageUrl) {
        supabase.from("analysis_history").insert({
          image_url: imageUrl,
          ingredients: analysisRes.data.ingredients || [],
          summary_bn: analysisRes.data.summary_bn || "",
          user_id: user?.id || null,
        }).select("id").single().then(({ data: insertData, error: saveErr }) => {
          if (saveErr) console.error("Save to DB error:", saveErr);
          if (insertData?.id) setAnalysisId(insertData.id);
          if (user) setCreditsUsed(prev => prev + 1);
        });
      } else if (user) {
        setCreditsUsed(prev => prev + 1);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast({ title: t("analysisFailed"), description: t("tryAgain"), variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero px-4 pt-8 pb-12 text-primary-foreground">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t("appName")}</h1>
              <p className="text-primary-foreground/70 text-sm">{t("appSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBuyDialogOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${totalAvailable > 2 ? 'bg-primary-foreground/20 text-primary-foreground' : totalAvailable > 0 ? 'bg-yellow-500/20 text-yellow-200' : 'bg-red-500/20 text-red-200'}`}
            >
              <Zap className="w-3.5 h-3.5" />
              {totalAvailable} ক্রেডিট
            </button>
            {canInstall && (
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={install}>
                <Download className="w-4 h-4" />
                {t("install")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 -mt-6 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {!result && !isAnalyzing && (
            <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <Scan className="w-5 h-5 text-primary shrink-0" />
              <p className="text-muted-foreground text-xs">
                {t("scanInstruction")} <strong className="text-foreground">{t("scanInstructionBold")}</strong> {t("scanInstructionEnd")}
              </p>
            </div>
          )}

          <CameraCapture onCapture={handleCapture} isAnalyzing={isAnalyzing} hasResult={!!result} />

          {result && !isAnalyzing && (
            <div className="flex justify-center">
              <Button onClick={() => setChatOpen(true)} className="rounded-full gap-2" size="lg">
                <MessageCircle className="w-5 h-5" />
                {t("startChat")}
              </Button>
            </div>
          )}

          {result && <ResultDisplay result={result} />}
          {result && !isAnalyzing && <ShareResult result={result} capturedImage={capturedImage} />}
        </div>
      </main>

      {result && <ChatDialog result={result} analysisId={analysisId} userProfile={userProfile} open={chatOpen} onClose={() => setChatOpen(false)} />}
      <BuyCreditsDialog open={buyDialogOpen} onClose={() => { setBuyDialogOpen(false); fetchCreditsUsed(); }} />
      <BottomNav />
    </div>
  );
};

export default Index;
