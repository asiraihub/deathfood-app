import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return document.documentElement.classList.contains("dark");
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero px-4 pt-8 pb-12 text-primary-foreground">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold">{t("settings")}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 -mt-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                <div>
                  <Label className="text-sm font-medium">{t("darkMode")}</Label>
                  <p className="text-xs text-muted-foreground">{t("darkModeDesc")}</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium">{t("language")}</Label>
                  <p className="text-xs text-muted-foreground">{t("languageDesc")}</p>
                </div>
              </div>
              <Select value={lang} onValueChange={(v) => setLang(v as "bn" | "en")}>
                <SelectTrigger className="w-28 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bn">বাংলা</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-foreground">Dead Food App</p>
              <p className="text-xs text-muted-foreground">{t("version")}</p>
              <p className="text-xs text-muted-foreground">{t("appDescription")}</p>
            </div>
          </div>

          {user && (
            <div className="glass-card rounded-2xl p-5">
              <Button onClick={async () => { await signOut(); navigate("/"); }} variant="destructive" className="w-full rounded-full h-11 gap-2">
                <LogOut className="w-4 h-4" />
                {t("logout")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
