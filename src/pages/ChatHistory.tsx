import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle, Clock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ChatDialog from "@/components/ChatDialog";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";

interface AnalysisResult {
  ingredients: {
    name_en: string;
    name_bn: string;
    status: "safe" | "warning" | "danger";
    reason_bn?: string;
  }[];
  summary_bn: string;
}

type Msg = { role: "user" | "assistant"; content: string };

interface ChatRecord {
  id: string;
  analysis_id: string | null;
  messages: Msg[];
  created_at: string;
  summary_bn?: string;
}

const ChatHistory = () => {
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLang();

  const [continueChat, setContinueChat] = useState<{
    result: AnalysisResult;
    analysisId: string;
    messages: Msg[];
    chatRecordId: string;
  } | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchChats();
  }, [user]);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("chat_history")
      .select("id, analysis_id, messages, created_at")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Fetch chat history error:", error);
    } else if (data) {
      const analysisIds = data.map((c: any) => c.analysis_id).filter(Boolean);
      let summaryMap: Record<string, string> = {};
      if (analysisIds.length > 0) {
        const { data: analyses } = await supabase.from("analysis_history").select("id, summary_bn").in("id", analysisIds);
        if (analyses) {
          for (const a of analyses) { if (a.summary_bn) summaryMap[a.id] = a.summary_bn; }
        }
      }
      setChats(data.map((c: any) => ({
        ...c,
        messages: (c.messages as any[]) || [],
        summary_bn: c.analysis_id ? summaryMap[c.analysis_id] : undefined,
      })));
    }
    setLoading(false);
  };

  const handleContinue = async (chat: ChatRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat.analysis_id) return;
    const { data: analysis } = await supabase.from("analysis_history").select("ingredients, summary_bn").eq("id", chat.analysis_id).maybeSingle();
    if (!analysis) return;
    setContinueChat({
      result: { ingredients: (analysis.ingredients as any[]) || [], summary_bn: analysis.summary_bn || "" },
      analysisId: chat.analysis_id,
      messages: chat.messages,
      chatRecordId: chat.id,
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-hero px-4 pt-8 pb-12 text-primary-foreground">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            <h1 className="text-xl font-bold">{t("chatHistory")}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 -mt-6 pb-8">
        <div className="max-w-md mx-auto space-y-3">
          {loading && <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-sm">{t("loading")}</div>}
          {!loading && chats.length === 0 && <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-sm">{t("noChatHistory")}</div>}

          {chats.map((chat) => {
            const isExpanded = expandedId === chat.id;
            const preview = chat.messages.find((m) => m.role === "assistant")?.content?.slice(0, 80) || "—";
            const msgCount = chat.messages.length;

            return (
              <div key={chat.id} className="glass-card rounded-2xl overflow-hidden cursor-pointer transition-all" onClick={() => setExpandedId(isExpanded ? null : chat.id)}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {chat.summary_bn && <p className="text-xs text-primary font-medium mb-1 truncate">{chat.summary_bn.slice(0, 60)}...</p>}
                      <p className="text-sm text-foreground truncate">{preview}...</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(chat.created_at)}</span>
                        <span>•</span>
                        <span>{msgCount} {t("messages")}</span>
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    <div className="px-4 py-3 space-y-2 max-h-[40vh] overflow-y-auto bg-muted/30">
                      {chat.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-background text-foreground rounded-bl-md border"}`}>
                            {msg.role === "assistant" ? (
                              <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:m-0 [&_p]:leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    {chat.analysis_id && (
                      <div className="px-4 py-2 border-t bg-muted/10">
                        <Button size="sm" className="w-full rounded-full gap-2" onClick={(e) => handleContinue(chat, e)}>
                          <PlayCircle className="w-4 h-4" />
                          {t("continueChat")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {continueChat && (
        <ChatDialog
          result={continueChat.result}
          analysisId={continueChat.analysisId}
          initialMessages={continueChat.messages}
          initialChatRecordId={continueChat.chatRecordId}
          open={true}
          onClose={() => { setContinueChat(null); fetchChats(); }}
        />
      )}
    </div>
  );
};

export default ChatHistory;
