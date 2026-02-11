import { useState, useRef, useCallback } from "react";
import { Share2, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-lang";
import html2canvas from "html2canvas";

interface Ingredient {
  name_en: string;
  name_bn: string;
  status: "safe" | "warning" | "danger";
  reason_bn?: string;
}

interface AnalysisResult {
  ingredients: Ingredient[];
  summary_bn: string;
}

interface ShareResultProps {
  result: AnalysisResult;
  capturedImage: string | null;
}

const ShareResult = ({ result, capturedImage }: ShareResultProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useLang();

  const dangerCount = result.ingredients.filter((i) => i.status === "danger").length;
  const warningCount = result.ingredients.filter((i) => i.status === "warning").length;
  const safeCount = result.ingredients.filter((i) => i.status === "safe").length;

  const shareText = `🔍 Dead Food - App Inspector:\n✅ ${safeCount} ${t("safe")} | ⚠️ ${warningCount} ${t("warning")} | 🚫 ${dangerCount} ${t("danger")}\n\n${result.summary_bn}\n\n#deadfood`;

  const generateShareImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#1a1a2e", scale: 2, useCORS: true, allowTaint: true });
      return new Promise((resolve) => {canvas.toBlob((blob) => resolve(blob), "image/png", 0.9);});
    } catch (err) {
      console.error("Image generation error:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleNativeShare = useCallback(async () => {
    const blob = await generateShareImage();
    if (blob && navigator.share) {
      try {
        const file = new File([blob], "food-analysis.png", { type: "image/png" });
        await navigator.share({ title: t("appSubtitle"), text: shareText, files: [file] });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          try {await navigator.share({ title: t("appSubtitle"), text: shareText });} catch {}
        }
      }
    } else if (navigator.share) {
      await navigator.share({ title: t("appSubtitle"), text: shareText });
    }
  }, [shareText, generateShareImage, t]);

  const handleDownloadImage = useCallback(async () => {
    const blob = await generateShareImage();
    if (!blob) {toast({ title: t("imageGenFailed"), variant: "destructive" });return;}
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "food-analysis.png";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("imageDownloaded") });
  }, [generateShareImage, toast, t]);

  const openShare = useCallback((platform: string) => {
    const encoded = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encoded}`,
      x: `https://x.com/intent/tweet?text=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite?summary=${encoded}`
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "width=600,height=400");
  }, [shareText]);

  const copyText = useCallback(async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareText]);

  const sorted = [...result.ingredients].sort((a, b) => {
    const order = { danger: 0, warning: 1, safe: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-3 animate-in fade-in duration-300">
      {/* Hidden card for image generation */}
      <div className="overflow-hidden" style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={cardRef} style={{ width: 600, padding: 32, background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{t("appSubtitle")}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Death Food or Life Food?</div>
            </div>
          </div>
          {capturedImage &&
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: "hidden", maxHeight: 200 }}>
              <img src={capturedImage} alt="" style={{ width: "100%", height: 200, objectFit: "cover" }} crossOrigin="anonymous" />
            </div>
          }
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {safeCount > 0 && <span style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>✅ {safeCount} {t("safe")}</span>}
            {warningCount > 0 && <span style={{ background: "rgba(234,179,8,0.15)", color: "#eab308", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>⚠️ {warningCount} {t("warning")}</span>}
            {dangerCount > 0 && <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>🚫 {dangerCount} {t("danger")}</span>}
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>{result.summary_bn}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sorted.slice(0, 6).map((item, i) =>
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "6px 10px", borderRadius: 8, background: item.status === "danger" ? "rgba(239,68,68,0.1)" : item.status === "warning" ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)" }}>
                <span>{item.status === "danger" ? "🚫" : item.status === "warning" ? "⚠️" : "✅"}</span>
                <span style={{ fontWeight: 600 }}>{item.name_bn}</span>
                <span style={{ opacity: 0.5, fontSize: 11 }}>({item.name_en})</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: 20, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 11, opacity: 0.4, textAlign: "center" }}>{t("appSubtitle")} • AI</div>
        </div>
      </div>

      {/* Share buttons UI */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Share2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{t("share")}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {"share" in navigator &&
          <Button onClick={handleNativeShare} size="sm" className="rounded-full gap-1.5 text-xs" disabled={isGenerating}>
              <Share2 className="w-3.5 h-3.5" />
              {t("shareBtn")}
            </Button>
          }
          <Button onClick={handleDownloadImage} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" disabled={isGenerating}><Download className="w-3.5 h-3.5" />{t("saveImage")}</Button>
          <Button onClick={copyText} size="sm" variant="outline" className="rounded-full gap-1.5 text-xs">{copied ? <Check className="w-3.5 h-3.5" /> : null}{copied ? t("copied") : t("copy")}</Button>
        </div>
        
      </div>
    </div>);

};

export default ShareResult;