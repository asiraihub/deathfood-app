import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLang } from "@/hooks/use-lang";
import ReactMarkdown from "react-markdown";

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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-about-result`;

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

interface ChatDialogProps {
  result: AnalysisResult;
  analysisId?: string | null;
  userProfile?: UserProfile | null;
  initialMessages?: Msg[];
  initialChatRecordId?: string | null;
  open: boolean;
  onClose: () => void;
}

const ChatDialog = ({ result, analysisId, userProfile, initialMessages, initialChatRecordId, open, onClose }: ChatDialogProps) => {
  const [messages, setMessages] = useState<Msg[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatRecordId, setChatRecordId] = useState<string | null>(initialChatRecordId || null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const { user } = useAuth();
  const { t } = useLang();

  const saveToDb = useCallback(async (msgs: Msg[]) => {
    if (!analysisId) return;
    try {
      if (chatRecordId) {
        await supabase.from("chat_history").update({ messages: msgs as any, updated_at: new Date().toISOString() }).eq("id", chatRecordId);
      } else {
        const { data } = await supabase.from("chat_history").insert({
          analysis_id: analysisId,
          messages: msgs as any,
          user_id: user?.id || null,
        }).select("id").single();
        if (data?.id) setChatRecordId(data.id);
      }
    } catch (e) {
      console.error("Save chat error:", e);
    }
  }, [analysisId, chatRecordId, user]);

  useEffect(() => {
    if (open && !hasInitialized.current) {
      hasInitialized.current = true;
      if (messages.length === 0) sendToAI([]);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendToAI = async (msgs: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = "";
    let finalMessages = msgs;

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        let updated: Msg[];
        if (last?.role === "assistant") {
          updated = prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        } else {
          updated = [...prev, { role: "assistant", content: assistantSoFar }];
        }
        finalMessages = updated;
        return updated;
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: msgs, resultContext: result, userProfile }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        upsertAssistant(err.error || "দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("দুঃখিত, সংযোগে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
      saveToDb(finalMessages);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    sendToAI(newMsgs);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-[85vh] sm:h-[70vh] bg-background rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">{t("aiChat")}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_p]:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("typeQuestion")} className="rounded-full text-sm" disabled={isLoading} />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;
