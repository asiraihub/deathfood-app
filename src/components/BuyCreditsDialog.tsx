import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, CreditCard, Phone, CheckCircle, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_bdt: number;
}

interface BuyCreditsDialogProps {
  open: boolean;
  onClose: () => void;
}

const BKASH_NUMBER = "01989772167";
const NAGAD_NUMBER = "01989772167";

const BuyCreditsDialog = ({ open, onClose }: BuyCreditsDialogProps) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      supabase.from("credit_packages").select("*").eq("is_active", true).then(({ data }) => {
        if (data) setPackages(data as CreditPackage[]);
      });
      setSelectedPkg(null);
      setTransactionId("");
      setPhoneNumber("");
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "লগইন করুন", description: "ক্রেডিট কিনতে আগে লগইন করুন।", variant: "destructive" });
      return;
    }
    if (!selectedPkg || !transactionId.trim() || !phoneNumber.trim()) {
      toast({ title: "সব তথ্য দিন", description: "Transaction ID ও ফোন নম্বর দিন।", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        package_id: selectedPkg.id,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        phone_number: phoneNumber.trim(),
        amount: selectedPkg.price_bdt,
        credits: selectedPkg.credits,
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Payment request error:", err);
      toast({ title: "সমস্যা হয়েছে", description: "আবার চেষ্টা করুন।", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold">পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে!</h3>
            <p className="text-sm text-muted-foreground">
              আপনার পেমেন্ট যাচাই করা হলে ক্রেডিট যোগ হবে। সাধারণত ১-২ ঘন্টা সময় লাগে।
            </p>
            <Button onClick={onClose} className="w-full">ঠিক আছে</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            ক্রেডিট কিনুন
          </DialogTitle>
          <DialogDescription>
            bKash/Nagad দিয়ে পেমেন্ট করে ক্রেডিট কিনুন
          </DialogDescription>
        </DialogHeader>

        {/* Package Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Monthly প্যাকেজ বাছাই করুন - 1 Month Plan</Label>
          <div className="grid gap-2">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  selectedPkg?.id === pkg.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-sm">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground">{pkg.credits} টি Analysis</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-bold">
                    ৳{pkg.price_bdt}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedPkg && (
          <>
            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">পেমেন্ট মেথড</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("bkash")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                    paymentMethod === "bkash" ? "border-pink-500 bg-pink-50 text-pink-700" : "border-border"
                  }`}
                >
                  bKash
                </button>
                <button
                  onClick={() => setPaymentMethod("nagad")}
                  className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-all ${
                    paymentMethod === "nagad" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-border"
                  }`}
                >
                  Nagad
                </button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
              <p className="font-semibold">📌 পেমেন্ট নির্দেশনা:</p>
              <p>1. {paymentMethod === "bkash" ? "bKash" : "Nagad"} অ্যাপ থেকে <strong>Send Money</strong> করুন</p>
              <p className="flex items-center gap-1">2. নম্বর: <strong className="text-primary">{paymentMethod === "bkash" ? BKASH_NUMBER : NAGAD_NUMBER}</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paymentMethod === "bkash" ? BKASH_NUMBER : NAGAD_NUMBER);
                    toast({ title: "কপি হয়েছে!" });
                  }}
                  className="inline-flex items-center justify-center rounded p-0.5 hover:bg-primary/10 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </button>
              </p>
              <p>3. পরিমাণ: <strong>৳{selectedPkg.price_bdt}</strong></p>
              <p>4. Transaction ID নিচে দিন</p>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="txn-id" className="text-sm">Transaction ID</Label>
                <Input
                  id="txn-id"
                  placeholder="যেমন: 8N7A2K3M5P"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  আপনার ফোন নম্বর
                </Label>
                <Input
                  id="phone"
                  placeholder="01XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !transactionId.trim() || !phoneNumber.trim()}
              className="w-full gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {isSubmitting ? "পাঠানো হচ্ছে..." : "পেমেন্ট রিকোয়েস্ট পাঠান"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuyCreditsDialog;
