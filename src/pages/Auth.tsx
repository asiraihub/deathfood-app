import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();

  if (user) { navigate("/"); return null; }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!name.trim() || !phone.trim() || !age.trim() || !gender) {
          toast({ title: t("fillAllFields"), description: t("fillAllFieldsDesc"), variant: "destructive" });
          setLoading(false);
          return;
        }
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
          toast({ title: t("correctAge"), variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").update({
            display_name: name.trim(), phone: phone.trim(), age: ageNum, gender,
          }).eq("user_id", data.user.id);
        }
        toast({ title: t("accountCreated"), description: t("accountCreatedDesc") });
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: t("problemOccurred"), description: err.message || t("tryAgain"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (error) toast({ title: t("googleLoginFailed"), description: error.message, variant: "destructive" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero px-4 pt-8 pb-12 text-primary-foreground">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <h1 className="text-xl font-bold">{isLogin ? t("login") : t("signup")}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 -mt-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <Button onClick={handleGoogleLogin} variant="outline" className="w-full rounded-full gap-2 h-11">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("googleLogin")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("or")}</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t("name")}</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} required={!isLogin} className="rounded-xl" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" required={!isLogin} className="rounded-xl" maxLength={15} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="age">{t("age")}</Label>
                      <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" required={!isLogin} className="rounded-xl" min={1} max={150} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("gender")}</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder={t("selectGender")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">{t("male")}</SelectItem>
                          <SelectItem value="female">{t("female")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="rounded-xl" maxLength={255} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                {loading ? t("waiting") : isLogin ? t("login") : t("signup")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? t("noAccount") : t("hasAccount")}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? t("signupNow") : t("loginNow")}
              </button>
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("loginOptional")}</p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
