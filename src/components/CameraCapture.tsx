import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Zap, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/hooks/use-lang";

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void;
  isAnalyzing: boolean;
  hasResult?: boolean;
}

interface FocusPoint {
  x: number;
  y: number;
}

const CameraCapture = ({ onCapture, isAnalyzing, hasResult }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { t } = useLang();

  useEffect(() => {
    if (isStreaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [isStreaming]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setIsStreaming(true);
      setCaptured(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast({ title: t("cameraNoPermission"), description: t("cameraNoPermissionDesc"), variant: "destructive" });
      } else if (err.name === "NotFoundError") {
        toast({ title: t("cameraNotFound"), description: t("cameraNotFoundDesc"), variant: "destructive" });
      } else {
        toast({ title: t("cameraError"), description: t("cameraErrorDesc"), variant: "destructive" });
      }
    }
  }, [toast, t]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    setCaptured(base64);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsStreaming(false);
    onCapture(base64);
  }, [onCapture]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCaptured(base64);
      onCapture(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onCapture]);

  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsStreaming(false);
    setCaptured(null);
  }, []);

  const reset = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const handleTapToFocus = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!streamRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setFocusPoint(null), 800);
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities?.();
      const advancedConstraints: any[] = [];
      if (capabilities && 'focusMode' in capabilities) advancedConstraints.push({ focusMode: 'manual' });
      if (capabilities && 'pointsOfInterest' in capabilities) advancedConstraints.push({ pointsOfInterest: [{ x, y }] });
      if (capabilities && 'focusMode' in capabilities) advancedConstraints.push({ focusMode: 'continuous' });
      if (advancedConstraints.length > 0) await track.applyConstraints({ advanced: advancedConstraints } as any);
    } catch { }
  }, []);

  return (
    <div className="relative w-full mx-auto transition-all duration-300" style={{ maxWidth: hasResult && captured && !isStreaming ? '200px' : '28rem' }}>
      <div className="relative rounded-2xl overflow-hidden bg-foreground/5 aspect-[3/4]">
        {!isStreaming && !captured && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center pulse-ring cursor-pointer" onClick={startCamera}>
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{t("cameraPrompt")}</p>
            <div className="flex flex-col gap-2 w-full px-8">
              <Button onClick={startCamera} size="lg" className="rounded-full gap-2 w-full">
                <Camera className="w-5 h-5" />
                {t("openCamera")}
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} size="lg" variant="outline" className="rounded-full gap-2 w-full">
                <ImagePlus className="w-5 h-5" />
                {t("uploadGallery")}
              </Button>
            </div>
          </div>
        )}

        {isStreaming && (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 z-[5]" onClick={handleTapToFocus} />
            {focusPoint && (
              <div className="absolute w-16 h-16 border-2 border-primary rounded-lg pointer-events-none z-[6] animate-in zoom-in-50 duration-200" style={{ left: focusPoint.x - 32, top: focusPoint.y - 32 }} />
            )}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-primary/40 rounded-xl" />
              <div className="absolute left-4 right-4 h-0.5 bg-primary/60 scan-line" />
            </div>
            <button onClick={closeCamera} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-foreground/50 flex items-center justify-center text-background hover:bg-foreground/70 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>
          </>
        )}

        {captured && <img src={captured} alt="Captured" className="w-full h-full object-cover" />}

        {isAnalyzing && captured && (
          <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
            <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-foreground font-medium">{t("analyzing")}</span>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {isStreaming && (
        <div className="mt-4 flex justify-center">
          <button onClick={captureImage} className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full border-4 border-primary-foreground" />
          </button>
        </div>
      )}

      {captured && !isAnalyzing && (
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={reset} variant="outline" className="rounded-full gap-2">
            <RotateCcw className="w-4 h-4" />
            {t("retake")}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full gap-2">
            <ImagePlus className="w-4 h-4" />
            {t("otherPhoto")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
