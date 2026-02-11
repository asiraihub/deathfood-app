import { useState, useEffect } from "react";
import { Settings2, ShieldCheck, Zap, Check, Loader2, ArrowLeft, CreditCard, CheckCircle, XCircle, Users, BarChart3, MessageCircle, ScanLine, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

type AIProvider = "lovable" | "openai";

interface PaymentRequest {
  id: string;
  user_id: string;
  payment_method: string;
  transaction_id: string;
  phone_number: string;
  amount: number;
  credits: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  credit_packages?: { name: string };
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  has_diabetic: boolean | null;
  has_heart_problem: boolean | null;
  has_allergy: boolean | null;
  health_notes: string | null;
  purchased_credits: number;
  created_at: string;
}

const Admin = () => {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>("lovable");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [creditInput, setCreditInput] = useState<Record<string, string>>({});
  const [updatingCredit, setUpdatingCredit] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalUsers: number; totalAnalysis: number; totalChats: number; totalRevenue: number; pendingPayments: number } | null>(null);
  const { toast } = useToast();

  const fetchStats = async (key: string) => {
    const { data } = await supabase.functions.invoke("list-users", {
      body: { adminKey: key, action: "stats" },
    });
    if (data?.stats) setStats(data.stats);
  };

  const fetchSettings = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("ai_provider")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) setCurrentProvider(data.ai_provider as AIProvider);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      setIsAuthenticated(true);
      fetchStats(adminKey.trim());
    }
  };

  const updateProvider = async (provider: AIProvider) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-settings", {
        body: { adminKey, provider },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        if (data.error === "Unauthorized") setIsAuthenticated(false);
        return;
      }
      setCurrentProvider(provider);
      toast({ title: "✅ সফল", description: `AI Provider "${provider === "lovable" ? "Lovable AI" : "OpenAI (GPT-4o)"}" সেট করা হয়েছে।` });
    } catch (err) {
      console.error("Update error:", err);
      toast({ title: "Error", description: "Settings আপডেট করতে সমস্যা হয়েছে।", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
              <Settings2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Admin key দিয়ে লগইন করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-key">Admin Key</Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Enter admin key..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Login</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero px-6 py-6 text-primary-foreground">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link to="/">
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-primary-foreground/70 text-xs">Settings & Management</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">মোট ইউজার</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <ScanLine className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAnalysis}</p>
                    <p className="text-xs text-muted-foreground">মোট Analysis</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalChats}</p>
                    <p className="text-xs text-muted-foreground">মোট Chat</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">৳{stats.totalRevenue}</p>
                    <p className="text-xs text-muted-foreground">মোট বিক্রি</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pendingPayments}</p>
                    <p className="text-xs text-muted-foreground">পেন্ডিং পেমেন্ট</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top row: AI Provider + Payments side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* AI Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">বর্তমান AI Provider</CardTitle>
                <CardDescription>
                  {isFetching ? "লোড হচ্ছে..." : `এখন "${currentProvider === "lovable" ? "Lovable AI" : "OpenAI (GPT-4o)"}" ব্যবহার হচ্ছে`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => updateProvider("lovable")}
                  disabled={isLoading}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    currentProvider === "lovable" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Lovable AI</p>
                        <p className="text-xs text-muted-foreground">Gemini 2.5 Flash • Built-in</p>
                      </div>
                    </div>
                    {currentProvider === "lovable" && <Check className="w-5 h-5 text-primary" />}
                    {isLoading && currentProvider !== "lovable" && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                  </div>
                </button>

                <button
                  onClick={() => updateProvider("openai")}
                  disabled={isLoading}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    currentProvider === "openai" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">OpenAI</p>
                        <p className="text-xs text-muted-foreground">GPT-4o • Custom API Key</p>
                      </div>
                    </div>
                    {currentProvider === "openai" && <Check className="w-5 h-5 text-primary" />}
                    {isLoading && currentProvider !== "openai" && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Payment Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  পেমেন্ট রিকোয়েস্ট
                </CardTitle>
                <CardDescription>bKash/Nagad পেমেন্ট অনুমোদন করুন</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const { data } = await supabase.functions.invoke("manage-payments", {
                      body: { adminKey, action: "list" },
                    });
                    if (data?.data) setPayments(data.data);
                    if (data?.error) toast({ title: "Error", description: data.error, variant: "destructive" });
                  }}
                  className="mb-4"
                >
                  রিফ্রেশ
                </Button>

                {payments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">কোনো রিকোয়েস্ট নেই</p>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {payments.map((p) => (
                    <div key={p.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <p className="font-medium">{p.credit_packages?.name || "Package"} — {p.credits} ক্রেডিট</p>
                          <p className="text-muted-foreground text-xs">
                            {p.payment_method.toUpperCase()} • TxnID: {p.transaction_id} • ফোন: {p.phone_number}
                          </p>
                          <p className="text-muted-foreground text-xs">৳{p.amount} • {new Date(p.created_at).toLocaleString("bn-BD")}</p>
                        </div>
                        <Badge variant={p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                          {p.status === "pending" ? "অপেক্ষায়" : p.status === "approved" ? "অনুমোদিত" : "বাতিল"}
                        </Badge>
                      </div>
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={processingId === p.id}
                            onClick={async () => {
                              setProcessingId(p.id);
                              const { data } = await supabase.functions.invoke("manage-payments", {
                                body: { adminKey, action: "approve", paymentId: p.id },
                              });
                              if (data?.success) {
                                setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "approved" } : x));
                                toast({ title: "✅ অনুমোদিত" });
                              } else {
                                toast({ title: "Error", description: data?.error, variant: "destructive" });
                              }
                              setProcessingId(null);
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={processingId === p.id}
                            onClick={async () => {
                              setProcessingId(p.id);
                              const { data } = await supabase.functions.invoke("manage-payments", {
                                body: { adminKey, action: "reject", paymentId: p.id },
                              });
                              if (data?.success) {
                                setPayments(prev => prev.map(x => x.id === p.id ? { ...x, status: "rejected" } : x));
                                toast({ title: "❌ বাতিল করা হয়েছে" });
                              } else {
                                toast({ title: "Error", description: data?.error, variant: "destructive" });
                              }
                              setProcessingId(null);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> বাতিল
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Users - Full width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                সকল ইউজার ({users.length})
              </CardTitle>
              <CardDescription>রেজিস্টার্ড সকল ইউজারদের তালিকা ও ক্রেডিট ম্যানেজমেন্ট</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { data } = await supabase.functions.invoke("list-users", {
                    body: { adminKey },
                  });
                  if (data?.data) setUsers(data.data);
                  if (data?.error) toast({ title: "Error", description: data.error, variant: "destructive" });
                }}
                className="mb-4"
              >
                ইউজার লোড করুন
              </Button>

              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">কোনো ইউজার নেই বা লোড করুন</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div key={u.user_id} className="rounded-lg border p-3">
                    <button
                      className="w-full text-left flex items-center justify-between"
                      onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.display_name || "নাম নেই"}</p>
                          <p className="text-xs text-muted-foreground">{u.email || "ইমেইল নেই"}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{u.purchased_credits} ক্রেডিট</Badge>
                    </button>

                    {expandedUser === u.user_id && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">ফোন:</span> {u.phone || "—"}</div>
                        <div><span className="text-muted-foreground">বয়স:</span> {u.age || "—"}</div>
                        <div><span className="text-muted-foreground">লিঙ্গ:</span> {u.gender || "—"}</div>
                        <div><span className="text-muted-foreground">ওজন:</span> {u.weight ? `${u.weight} কেজি` : "—"}</div>
                        <div><span className="text-muted-foreground">উচ্চতা:</span> {u.height ? `${u.height} ফুট` : "—"}</div>
                        <div><span className="text-muted-foreground">ডায়াবেটিস:</span> {u.has_diabetic ? "হ্যাঁ" : "না"}</div>
                        <div><span className="text-muted-foreground">হার্ট:</span> {u.has_heart_problem ? "হ্যাঁ" : "না"}</div>
                        <div><span className="text-muted-foreground">অ্যালার্জি:</span> {u.has_allergy ? "হ্যাঁ" : "না"}</div>
                        {u.health_notes && (
                          <div className="col-span-2"><span className="text-muted-foreground">নোট:</span> {u.health_notes}</div>
                        )}
                        <div className="col-span-2"><span className="text-muted-foreground">যোগদান:</span> {new Date(u.created_at).toLocaleDateString("bn-BD")}</div>

                        {/* Credit Management */}
                        <div className="col-span-2 mt-2 pt-2 border-t">
                          <p className="text-sm font-medium mb-2">ক্রেডিট ম্যানেজমেন্ট</p>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="যেমন: 50 বা -10"
                              value={creditInput[u.user_id] || ""}
                              onChange={(e) => setCreditInput(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                              className="h-8 text-xs w-28"
                            />
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1"
                              disabled={updatingCredit === u.user_id || !creditInput[u.user_id]}
                              onClick={async () => {
                                const amount = parseInt(creditInput[u.user_id] || "0", 10);
                                if (isNaN(amount) || amount === 0) return;
                                setUpdatingCredit(u.user_id);
                                const { data } = await supabase.functions.invoke("list-users", {
                                  body: { adminKey, action: "update-credits", userId: u.user_id, credits: amount },
                                });
                                if (data?.success) {
                                  setUsers(prev => prev.map(x => x.user_id === u.user_id ? { ...x, purchased_credits: data.new_credits } : x));
                                  setCreditInput(prev => ({ ...prev, [u.user_id]: "" }));
                                  toast({ title: `✅ ক্রেডিট আপডেট হয়েছে (${data.new_credits})` });
                                } else {
                                  toast({ title: "Error", description: data?.error, variant: "destructive" });
                                }
                                setUpdatingCredit(null);
                              }}
                            >
                              {updatingCredit === u.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              আপডেট
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">ধনাত্মক সংখ্যা = যোগ, ঋণাত্মক = কমানো</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
