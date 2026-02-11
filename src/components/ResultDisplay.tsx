import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { useLang } from "@/hooks/use-lang";

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

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  const { t } = useLang();

  const statusConfig = {
    safe: { icon: ShieldCheck, bg: "bg-safe/10", border: "border-safe/30", text: "text-safe", label: t("safe") },
    warning: { icon: AlertTriangle, bg: "bg-warning/10", border: "border-warning/30", text: "text-warning", label: t("warning") },
    danger: { icon: ShieldAlert, bg: "bg-danger/10", border: "border-danger/30", text: "text-danger", label: t("danger") },
  };

  const dangerCount = result.ingredients.filter((i) => i.status === "danger").length;
  const warningCount = result.ingredients.filter((i) => i.status === "warning").length;
  const safeCount = result.ingredients.filter((i) => i.status === "safe").length;

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-lg">{t("overallAssessment")}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{result.summary_bn}</p>
        <div className="flex gap-3 pt-1">
          {safeCount > 0 && <span className="text-xs font-medium bg-safe/10 text-safe px-3 py-1 rounded-full">✅ {safeCount} {t("safe")}</span>}
          {warningCount > 0 && <span className="text-xs font-medium bg-warning/10 text-warning px-3 py-1 rounded-full">⚠️ {warningCount} {t("warning")}</span>}
          {dangerCount > 0 && <span className="text-xs font-medium bg-danger/10 text-danger px-3 py-1 rounded-full">🚫 {dangerCount} {t("danger")}</span>}
        </div>
      </div>

      <div className="space-y-2">
        {[...result.ingredients].sort((a, b) => {
          const order = { danger: 0, warning: 1, safe: 2 };
          return order[a.status] - order[b.status];
        }).map((item, index) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          return (
            <div key={index} className={`rounded-xl border p-4 ${config.bg} ${config.border} transition-all`} style={{ animationDelay: `${index * 80}ms` }}>
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.text} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.name_bn}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}>{config.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.name_en}</span>
                  {item.reason_bn && <p className="text-xs text-muted-foreground mt-1">{item.reason_bn}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-2 pb-1">
        AI দ্বারা চালিত • শুধুমাত্র তথ্যমূলক উদ্দেশ্যে
      </p>
    </div>
  );
};

export default ResultDisplay;
