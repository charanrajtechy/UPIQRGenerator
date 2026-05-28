import { useRef, useState, useCallback, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, RotateCcw, ChevronDown, FileOutput, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";

import InputField from "@/components/upi/InputField";
import PresetAmounts from "@/components/upi/PresetAmounts";
import LogoUpload from "@/components/upi/LogoUpload";
import TemplateActions from "@/components/upi/TemplateActions";
import StyleSelector from "@/components/upi/StyleSelector";
import QRPreviewCard from "@/components/upi/QRPreviewCard";
import QRSizeSelector from "@/components/upi/QRSizeSelector";
import QRHistory, { addToHistory } from "@/components/upi/QRHistory";

import QRAppearanceCustomization from "@/components/upi/QRAppearanceCustomization";
import ExportQRModal from "@/components/upi/ExportQRModal";
import QRScanTestModal from "@/components/upi/QRScanTestModal";
import QRZoomModal from "@/components/upi/QRZoomModal";
import ResetAllDialog from "@/components/upi/ResetAllDialog";
import AppFooter from "@/components/upi/AppFooter";
import InstallPrompt from "@/components/upi/InstallPrompt";
import QRSafetyChecker from "@/components/upi/QRSafetyChecker";

import { buildUpiLink } from "@/components/upi/buildUpiLink";
import { shareQR, downloadQR } from "@/components/upi/shareQR";
import { renderCustomQR, type FinderStyle, type ModuleStyle } from "@/components/upi/renderCustomQR";
import { composeBrandedNote, isProUser, NOTE_MAX_LENGTH } from "@/lib/branding";
import type { FormData, QRData, CardStyle, QRSize, QRHistoryItem } from "@/components/upi/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Lock } from "lucide-react";

const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
const SIZE_MAP: Record<QRSize, number> = { small: 512, medium: 1024, large: 2048 };

function formatAmount(val: string): string {
  const num = Number(val);
  if (!val || isNaN(num)) return "";
  return `₹${num.toLocaleString("en-IN")}`;
}

function loadTemplate(): { upiId: string; name: string; logoDataUrl?: string } | null {
  try {
    const raw = localStorage.getItem("upi_template");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const UpiQrGenerator = () => {

  const savedTemplate = loadTemplate();

  const [form, setForm] = useState<FormData>({
    upiId: savedTemplate?.upiId || "",
    name: savedTemplate?.name || "",
    amount: "",
    note: "",
    label: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cardStyle, setCardStyle] = useState<CardStyle>("bold-amount");
  const [qrSize, setQrSize] = useState<QRSize>("medium");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(savedTemplate?.logoDataUrl || null);

  const [autoGenerate, setAutoGenerate] = useState(true);
  const [removeBranding, setRemoveBranding] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [finderStyle, setFinderStyle] = useState<FinderStyle>("square");
  const [moduleStyle, setModuleStyle] = useState<ModuleStyle>("square");

  // Modal states
  const [exportOpen, setExportOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  const isUpiValid = UPI_REGEX.test(form.upiId.trim());

  // QR Status indicator
  const getQrStatus = () => {
    if (!qrData) return null;
    if (!form.upiId.trim()) return { type: "warning" as const, msg: "⚠ UPI ID is required" };
    if (!UPI_REGEX.test(form.upiId.trim())) return { type: "warning" as const, msg: "⚠ Invalid UPI ID format" };
    return { type: "success" as const, msg: "✓ QR Ready for Payment" };
  };
  const qrStatus = getQrStatus();

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    const upiId = form.upiId.trim();
    const amount = form.amount.trim();
    if (!upiId) e.upiId = "UPI ID is required";
    else if (!UPI_REGEX.test(upiId)) e.upiId = "Invalid UPI ID (e.g. name@bank)";
    if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) e.amount = "Enter a valid positive amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const generateQR = useCallback(async (saveToHistory = true) => {
    if (!validate()) return;
    setGenerating(true);
    const upiId = form.upiId.trim();
    const name = form.name.trim();
    const amount = form.amount.trim();
    const note = form.note.trim();
    const label = form.label.trim();
    const finalNote = composeBrandedNote(note, removeBranding);
    const upiLink = buildUpiLink(upiId, name, amount, finalNote);
    try {
      const useCustomRenderer = finderStyle !== "square" || moduleStyle !== "square";
      let qrDataUrl: string;

      if (useCustomRenderer) {
        qrDataUrl = await renderCustomQR({
          data: upiLink,
          size: SIZE_MAP[qrSize],
          margin: 2,
          finderStyle,
          moduleStyle,
          fgColor: "#1a1a2e",
          bgColor: "#ffffff",
          errorCorrectionLevel: "H",
        });
      } else {
        qrDataUrl = await QRCode.toDataURL(upiLink, {
          width: SIZE_MAP[qrSize],
          margin: 2,
          color: { dark: "#1a1a2e", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
      }

      const newQrData: QRData = { upiLink, qrDataUrl, name, upiId, amount, note, label, logoDataUrl: logoDataUrl || undefined };
      setQrData(newQrData);
      if (saveToHistory && !autoGenerate) {
        addToHistory({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          qrDataUrl, upiId, name, amount, note, label, cardStyle,
          createdAt: new Date().toISOString(),
        });
      }
    } catch { console.error("QR generation failed"); }
    finally { setGenerating(false); }
  }, [form, logoDataUrl, cardStyle, qrSize, autoGenerate, finderStyle, moduleStyle, removeBranding]);

  const saveCurrentToHistory = useCallback(() => {
    if (!qrData) return;
    addToHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      qrDataUrl: qrData.qrDataUrl,
      upiId: qrData.upiId,
      name: qrData.name,
      amount: qrData.amount,
      note: qrData.note,
      label: qrData.label,
      cardStyle,
      createdAt: new Date().toISOString(),
    });
  }, [qrData, cardStyle]);

  useEffect(() => {
    if (!autoGenerate) return;
    if (!form.upiId.trim() || !UPI_REGEX.test(form.upiId.trim())) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { generateQR(false); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [autoGenerate, form, generateQR]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || !qrData) return;
    try {
      saveCurrentToHistory();
      const result = await shareQR(cardRef.current, qrData.name, qrData.upiId, qrData.amount, qrData.note);
      toast({ title: result === "shared" ? "QR shared successfully!" : "QR downloaded. You can share it manually.", duration: 3000 });
    } catch {
      toast({ title: "Failed to share QR", variant: "destructive", duration: 3000 });
    }
  }, [qrData, saveCurrentToHistory, toast]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !qrData) return;
    saveCurrentToHistory();
    try {
      await downloadQR(cardRef.current, qrData.name, qrData.upiId);
      toast({ title: "QR downloaded successfully!", duration: 3000 });
    } catch {
      toast({ title: "Download failed. Opening share instead…", variant: "destructive", duration: 3000 });
      try {
        await shareQR(cardRef.current, qrData.name, qrData.upiId, qrData.amount, qrData.note);
        toast({ title: "QR shared successfully!", duration: 3000 });
      } catch {
        toast({ title: "Failed to download or share QR", variant: "destructive", duration: 3000 });
      }
    }
  }, [qrData, saveCurrentToHistory, toast]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleStyleChange = (style: CardStyle) => { setCardStyle(style); localStorage.setItem("qr_card_style", style); };

  const handleTemplateLoad = useCallback((t: { upiId: string; name: string; logoDataUrl?: string }) => {
    setForm((prev) => ({ ...prev, upiId: t.upiId, name: t.name }));
    if (t.logoDataUrl) setLogoDataUrl(t.logoDataUrl);
  }, []);

  const handleHistorySelect = useCallback((item: QRHistoryItem) => {
    setForm({ upiId: item.upiId, name: item.name, amount: item.amount, note: item.note, label: item.label });
    setCardStyle(item.cardStyle);
    setQrData({
      upiLink: buildUpiLink(item.upiId, item.name, item.amount, item.note),
      qrDataUrl: item.qrDataUrl, name: item.name, upiId: item.upiId,
      amount: item.amount, note: item.note, label: item.label,
    });
  }, []);

  const handleReset = useCallback(() => {
    setForm({ upiId: "", name: "", amount: "", note: "", label: "" });
    setLogoDataUrl(null);
    setCardStyle("bold-amount");
    setQrData(null);
    setErrors({});
    setRemoveBranding(false);
    setFinderStyle("square");
    setModuleStyle("square");
  }, []);

  const handleResetAll = useCallback(() => {
    const keysToRemove = ["upi_template", "qr_card_style", "qr_history"];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    handleReset();
    setResetDialogOpen(false);
    toast({ title: "All settings have been reset successfully.", duration: 3000 });
  }, [handleReset, toast]);

  const handleCopyDetails = useCallback(async () => {
    if (!qrData) return;
    const lines: string[] = [];
    if (qrData.name) lines.push(`Payee: ${qrData.name}`);
    lines.push(`UPI ID: ${qrData.upiId}`);
    if (qrData.amount) lines.push(`Amount: ₹${Number(qrData.amount).toLocaleString("en-IN")}`);
    if (qrData.note) lines.push(`Note: ${qrData.note}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setDetailsCopied(true);
      setTimeout(() => setDetailsCopied(false), 2000);
    } catch {}
  }, [qrData]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 sm:py-12">
        <div className="text-center mb-8 space-y-3 w-full max-w-md">
          <Skeleton className="h-8 w-64 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-80 mx-auto rounded-xl" />
        </div>
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8 sm:py-12">
      <InstallPrompt />

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Open UPI QR Generator</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-md">
          Generate professional UPI QR codes for payments. No tracking, no storage — 100% private.
        </p>
      </div>

      <div className="w-full max-w-md bg-card rounded-2xl shadow-card p-6 sm:p-8 space-y-5">
        <InputField
          label="UPI ID"
          placeholder="yourname@paytm"
          value={form.upiId}
          error={errors.upiId}
          showCopy
          showValidation
          isValid={isUpiValid}
          onChange={(v) => handleChange("upiId", v)}
        />

        <InputField label="Payee Name" placeholder="Your full name" value={form.name} error={errors.name} optional onChange={(v) => handleChange("name", v)} />

        <div className="space-y-2">
          <InputField label="Amount (₹)" placeholder="500" type="number" value={form.amount} error={errors.amount} optional onChange={(v) => handleChange("amount", v)} />
          {form.amount && !isNaN(Number(form.amount)) && Number(form.amount) > 0 && (
            <p className="text-xs text-muted-foreground ml-1">{formatAmount(form.amount)}</p>
          )}
          <PresetAmounts currentAmount={form.amount} onSelect={(v) => handleChange("amount", v)} />
        </div>

        <InputField label="Payment Note" placeholder="Advance for project work" value={form.note} error={errors.note} optional maxLength={NOTE_MAX_LENGTH} onChange={(v) => handleChange("note", v)} />
        <InputField label="Payment Title / Label" placeholder="Invoice #1234" value={form.label} optional onChange={(v) => handleChange("label", v)} />

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span>Advanced Options</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-3">
            <TemplateActions upiId={form.upiId} name={form.name} logoDataUrl={logoDataUrl} onLoad={handleTemplateLoad} />
            <LogoUpload logoDataUrl={logoDataUrl} onLogoChange={setLogoDataUrl} />
            <StyleSelector value={cardStyle} onChange={handleStyleChange} />
            <QRSizeSelector value={qrSize} onChange={setQrSize} />

            <QRAppearanceCustomization
              finderStyle={finderStyle}
              moduleStyle={moduleStyle}
              onFinderChange={setFinderStyle}
              onModuleChange={setModuleStyle}
            />

            {/* Auto Generate Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Auto Generate QR</label>
              <button
                type="button"
                onClick={() => setAutoGenerate((p) => !p)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoGenerate ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoGenerate ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Remove Branding Toggle (Pro) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  Remove Branding
                  {!isProUser && <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-label="Pro only" />}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!isProUser) {
                      toast({ title: "This feature will be available in the Pro version soon.", duration: 3000 });
                      return;
                    }
                    setRemoveBranding((p) => !p);
                  }}
                  aria-disabled={!isProUser}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    isProUser && removeBranding ? "bg-primary" : "bg-muted"
                  } ${!isProUser ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      isProUser && removeBranding ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Branding is included to support free usage of this tool.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset All Fields
            </button>

            <button
              type="button"
              onClick={() => setResetDialogOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Reset All Settings
            </button>
          </CollapsibleContent>
        </Collapsible>

        {!autoGenerate && (
          <button
            onClick={() => generateQR(true)}
            disabled={generating}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {generating ? "Generating…" : "Generate QR Code"}
          </button>
        )}
      </div>

      <div className="w-full max-w-md mt-4">
        <QRHistory onSelect={handleHistorySelect} />
      </div>

      {qrData && (
        <div className="mt-8 w-full max-w-md space-y-4 animate-fade-in">
          {/* Clickable QR preview for zoom */}
          <div className="cursor-pointer" onClick={() => setZoomOpen(true)}>
            <QRPreviewCard ref={cardRef} qrData={qrData} cardStyle={cardStyle} showBranding={!(isProUser && removeBranding)} />
          </div>

          {/* QR Status Indicator */}
          {qrStatus && (
            <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${
              qrStatus.type === "success"
                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
            }`}>
              {qrStatus.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {qrStatus.msg}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleDownload} className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-sm">
              Download QR
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm border border-border transition-all hover:bg-accent active:scale-[0.98]"
            >
              Share QR
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setExportOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <FileOutput className="w-4 h-4" /> Export QR
            </button>
            <button
              onClick={() => setScanOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <ScanLine className="w-4 h-4" /> Test Scan
            </button>
          </div>


          <button
            type="button"
            onClick={handleCopyDetails}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {detailsCopied ? <><Check className="w-4 h-4 text-primary" /> Payment details copied</> : <><Copy className="w-4 h-4" /> Copy Payment Details</>}
          </button>

          {/* QR Safety Checker */}
          <QRSafetyChecker qrDataUrl={qrData.qrDataUrl} logoDataUrl={logoDataUrl} qrMargin={2} />
        </div>
      )}

      <AppFooter />

      

      {/* Modals */}
      {qrData && (
        <>
          <ExportQRModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            qrData={qrData}
            onSuccess={(msg) => toast({ title: msg, duration: 3000 })}
            onError={(msg) => toast({ title: msg, variant: "destructive", duration: 3000 })}
          />
          <QRScanTestModal
            open={scanOpen}
            onClose={() => setScanOpen(false)}
            qrDataUrl={qrData.qrDataUrl}
            logoDataUrl={logoDataUrl}
            expectedData={qrData.upiLink}
            onSuccess={(msg) => toast({ title: msg, duration: 3000 })}
            onError={(msg) => toast({ title: msg, variant: "destructive", duration: 3000 })}
          />
          <QRZoomModal
            open={zoomOpen}
            onClose={() => setZoomOpen(false)}
            qrData={qrData}
          />
        </>
      )}

      <ResetAllDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetAll}
      />
    </div>
  );
};

export default UpiQrGenerator;
