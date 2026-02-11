import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserCircle, Save, HeartPulse, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-lang";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInch, setHeightInch] = useState("");

  // Health History
  const [hasDiabetic, setHasDiabetic] = useState(false);
  const [hasHeartProblem, setHasHeartProblem] = useState(false);
  const [hasAllergy, setHasAllergy] = useState(false);
  const [weight, setWeight] = useState("");
  const [healthNotes, setHealthNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, phone, age, gender, email, has_diabetic, has_heart_problem, has_allergy, weight, height, health_notes")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setName(data.display_name || "");
      setPhone(data.phone || "");
      setAge(data.age?.toString() || "");
      setGender(data.gender || "");
      setEmail(data.email || user!.email || "");
      setHasDiabetic(data.has_diabetic || false);
      setHasHeartProblem(data.has_heart_problem || false);
      setHasAllergy(data.has_allergy || false);
      setWeight(data.weight?.toString() || "");
      const h = data.height?.toString() || "";
      if (h.includes(".")) {
        const [f, i] = h.split(".");
        setHeightFeet(f);
        setHeightInch(i);
      } else if (h) {
        setHeightFeet(h);
        setHeightInch("0");
      }
      setHealthNotes(data.health_notes || "");
    } else {
      setEmail(user!.email || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightVal = heightFeet ? parseFloat(`${heightFeet}.${heightInch || "0"}`) : null;
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: name.trim(),
      phone: phone.trim(),
      age: isNaN(ageNum) ? null : ageNum,
      gender: gender || null,
      has_diabetic: hasDiabetic,
      has_heart_problem: hasHeartProblem,
      has_allergy: hasAllergy,
      weight: isNaN(weightNum) ? null : weightNum,
      height: heightVal,
      health_notes: healthNotes.trim() || null,
    }, { onConflict: "user_id" });

    if (error) {
      toast({ title: t("problemOccurred"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("profileUpdated"), duration: 2000 });
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">{t("loading")}</p></div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero px-4 pt-8 pb-12 text-primary-foreground">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <UserCircle className="w-6 h-6" />
            <h1 className="text-xl font-bold">{t("profile")}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 -mt-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">

          {/* Health History Section */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold">{t("healthHistory")}</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <Label className="text-sm font-medium">{t("hasDiabetic")}</Label>
                <RadioGroup value={hasDiabetic ? "yes" : "no"} onValueChange={(v) => setHasDiabetic(v === "yes")} className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="yes" id="diabetic-yes" />
                    <Label htmlFor="diabetic-yes" className="text-sm cursor-pointer">{t("yes")}</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="no" id="diabetic-no" />
                    <Label htmlFor="diabetic-no" className="text-sm cursor-pointer">{t("no")}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <Label className="text-sm font-medium">{t("hasHeartProblem")}</Label>
                <RadioGroup value={hasHeartProblem ? "yes" : "no"} onValueChange={(v) => setHasHeartProblem(v === "yes")} className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="yes" id="heart-yes" />
                    <Label htmlFor="heart-yes" className="text-sm cursor-pointer">{t("yes")}</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="no" id="heart-no" />
                    <Label htmlFor="heart-no" className="text-sm cursor-pointer">{t("no")}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <Label className="text-sm font-medium">{t("hasAllergy")}</Label>
                <RadioGroup value={hasAllergy ? "yes" : "no"} onValueChange={(v) => setHasAllergy(v === "yes")} className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="yes" id="allergy-yes" />
                    <Label htmlFor="allergy-yes" className="text-sm cursor-pointer">{t("yes")}</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="no" id="allergy-no" />
                    <Label htmlFor="allergy-no" className="text-sm cursor-pointer">{t("no")}</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="weight">{t("weight")}</Label>
                <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="rounded-xl" min={1} max={500} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("height")}</Label>
                <div className="flex items-center gap-2">
                  <Select value={heightFeet} onValueChange={setHeightFeet}>
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder={t("feet")} />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7].map((f) => (
                        <SelectItem key={f} value={f.toString()}>{f} {t("feet")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={heightInch} onValueChange={setHeightInch}>
                    <SelectTrigger className="rounded-xl flex-1">
                      <SelectValue placeholder={t("inch")} />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                        <SelectItem key={i} value={i.toString()}>{i} {t("inch")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="healthNotes">{t("healthNotes")}</Label>
              <Textarea id="healthNotes" value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder={t("healthNotes")} className="rounded-xl resize-none" rows={3} maxLength={500} />
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{t("personalInfo")}</h2>
            </div>

            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("email")}</Label>
              <Input value={email} disabled className="rounded-xl bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="rounded-xl" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className="rounded-xl" maxLength={15} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age">{t("age")}</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className="rounded-xl" min={1} max={150} />
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
          </div>

        </div>
        {/* Spacer for floating save button */}
        <div className="h-20" />
      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto">
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-full h-12 gap-2 shadow-lg shadow-primary/25 text-base font-semibold">
            <Save className="w-5 h-5" />
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
