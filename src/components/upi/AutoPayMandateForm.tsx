import { useState, useCallback, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Copy, Check, FileOutput, ScanLine, AlertTriangle, RotateCcw, Save, FolderOpen, Trash2, History, Clock, Download, Share2 } from "lucide-react";
import InputField from "@/components/upi/InputField";
import QRPreviewCard from "@/components/upi/QRPreviewCard";
import QRSafetyChecker from "@/components/upi/QRSafetyChecker";
import ExportQRModal from "@/components/upi/ExportQRModal";
import QRScanTestModal from "@/components/upi/QRScanTestModal";
import QRZoomModal from "@/components/upi/QRZoomModal";
import { shareQR, downloadQR } from "@/components/upi/shareQR";
import type { QRData, CardStyle } from "@/components/upi/types";
import { useToast } from "@/hooks/use-toast";

const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

const RECUR_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY", "ASPRESENTED"];
const AMRULE_OPTIONS = ["EXACT", "MAX"];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";

function generateTid(): string {
  let result = "";
  for (let i = 0; i < 35; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
}

interface MandateForm {
  upiId: string;
  name: string;
  amount: string;
  note: string;
  mc: string;
  orgid: string;
  purpose: string;
  mode: string;
  mn: string;
  validitystart: string;
  validityend: string;
  recur: string;
  amrule: string;
}

interface MandateTemplate {
  upiId: string;
  name: string;
  mc: string;
  mn: string;
  orgid: string;
}

interface MandateHistoryItem {
  id: string;
  upiId: string;
  name: string;
  amount: string;
  note: string;
  mc: string;
  mn: string;
  recur: string;
  qrDataUrl: string;
  createdAt: string;
}

const MANDATE_TEMPLATE_KEY = "mandate_template";
const MANDATE_HISTORY_KEY = "mandate_history";
const MAX_HISTORY = 15;

function getMandateHistory(): MandateHistoryItem[] {
  try { return JSON.parse(localStorage.getItem(MANDATE_HISTORY_KEY) || "[]"); } catch { return []; }
}

function addMandateHistory(item: MandateHistoryItem) {
  const list = getMandateHistory();
  const dupeIdx = list.findIndex(h => h.upiId === item.upiId && h.amount === item.amount && h.note === item.note && h.name === item.name);
  if (dupeIdx !== -1) {
    list[dupeIdx].createdAt = item.createdAt;
    list[dupeIdx].qrDataUrl = item.qrDataUrl;
    const [updated] = list.splice(dupeIdx, 1);
    list.unshift(updated);
  } else {
    list.unshift(item);
  }
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
  localStorage.setItem(MANDATE_HISTORY_KEY, JSON.stringify(list));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins} ${ampm}`;
}

function buildMandateLink(form: MandateForm, tid: string): string {
  const params = new URLSearchParams();
  params.set("mode", form.mode || "04");
  params.set("purpose", form.purpose || "14");
  params.set("orgid", form.orgid || "000000");
  params.set("tid", tid);
  params.set("tr", tid);
  if (form.note) params.set("tn", form.note);
  params.set("pa", form.upiId);
  if (form.name) params.set("pn", form.name);
  if (form.mc) params.set("mc", form.mc);
  params.set("am", form.amount);
  if (form.mn) params.set("mn", form.mn);
  if (form.validitystart) params.set("validitystart", formatDateDDMMYYYY(form.validitystart));
  if (form.validityend) params.set("validityend", formatDateDDMMYYYY(form.validityend));
  params.set("amrule", form.amrule || "EXACT");
  params.set("recur", form.recur || "MONTHLY");
  params.set("txnType", "CREATE");
  params.set("cu", "INR");
  return `upi://mandate?${params.toString()}`;
}

const AutoPayMandateForm = () => {
  const savedTemplate = (() => {
    try {
      const raw = localStorage.getItem(MANDATE_TEMPLATE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as MandateTemplate;
    } catch { return null; }
  })();

  const [form, setForm] = useState<MandateForm>({
    upiId: savedTemplate?.upiId || "",
    name: savedTemplate?.name || "",
    amount: "",
    note: "",
    mc: savedTemplate?.mc || "",
    orgid: savedTemplate?.orgid || "000000",
    purpose: "14",
    mode: "04",
    mn: savedTemplate?.mn || "",
    validitystart: "",
    validityend: "",
    recur: "MONTHLY",
    amrule: "EXACT",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MandateForm, string>>>({});
  const [tid, setTid] = useState(generateTid);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [detailsCopied, setDetailsCopied] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<MandateHistoryItem[]>([]);
  const [templateMsg, setTemplateMsg] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  const isUpiValid = UPI_REGEX.test(form.upiId.trim());

  const validate = useCallback((): boolean => {
    const e: Partial<Record<keyof MandateForm, string>> = {};
    if (!form.upiId.trim()) e.upiId = "UPI ID is required";
    else if (!UPI_REGEX.test(form.upiId.trim())) e.upiId = "Invalid UPI ID format";
    if (!form.amount.trim() || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Valid amount required";
    if (!form.note.trim()) e.note = "Transaction note is required";
    if (!form.mc.trim()) e.mc = "Merchant Category Code is required";
    if (form.validitystart && form.validityend) {
      const start = new Date(form.validitystart);
      const end = new Date(form.validityend);
      if (end <= start) e.validityend = "End date must be after start date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const generateQR = useCallback(async () => {
    if (!validate()) return;
    setGenerating(true);
    // Generate new unique TID every time
    const currentTid = generateTid();
    setTid(currentTid);
    try {
      const mandateLink = buildMandateLink(form, currentTid);
      const qrDataUrl = await QRCode.toDataURL(mandateLink, {
        width: 1024,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setQrData({
        upiLink: mandateLink,
        qrDataUrl,
        name: form.name.trim(),
        upiId: form.upiId.trim(),
        amount: form.amount.trim(),
        note: form.note.trim(),
        label: "AutoPay Mandate",
      });
      // Add to history
      addMandateHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        upiId: form.upiId.trim(),
        name: form.name.trim(),
        amount: form.amount.trim(),
        note: form.note.trim(),
        mc: form.mc.trim(),
        mn: form.mn.trim(),
        recur: form.recur,
        qrDataUrl,
        createdAt: new Date().toISOString(),
      });
    } catch {
      toast({ title: "QR generation failed", variant: "destructive", duration: 3000 });
    } finally {
      setGenerating(false);
    }
  }, [form, validate, toast]);

  // Auto-generate with debounce
  useEffect(() => {
    if (!form.upiId.trim() || !UPI_REGEX.test(form.upiId.trim())) return;
    if (!form.amount.trim() || isNaN(Number(form.amount)) || Number(form.amount) <= 0) return;
    if (!form.note.trim() || !form.mc.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generateQR(), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form, generateQR]);

  const handleChange = (field: keyof MandateForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleReset = () => {
    setForm({ upiId: "", name: "", amount: "", note: "", mc: "", orgid: "000000", purpose: "14", mode: "04", mn: "", validitystart: "", validityend: "", recur: "MONTHLY", amrule: "EXACT" });
    setTid(generateTid());
    setQrData(null);
    setErrors({});
  };

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || !qrData) return;
    try {
      await downloadQR(cardRef.current, qrData.name, qrData.upiId);
      toast({ title: "QR downloaded!", duration: 3000 });
    } catch {
      toast({ title: "Download failed", variant: "destructive", duration: 3000 });
    }
  }, [qrData, toast]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || !qrData) return;
    try {
      await shareQR(cardRef.current, qrData.name, qrData.upiId, qrData.amount, qrData.note);
      toast({ title: "QR shared!", duration: 3000 });
    } catch {
      toast({ title: "Share failed", variant: "destructive", duration: 3000 });
    }
  }, [qrData, toast]);

  const handleCopyDetails = useCallback(async () => {
    if (!qrData) return;
    const lines = [`Payee: ${qrData.name}`, `UPI: ${qrData.upiId}`, `Amount: ₹${Number(qrData.amount).toLocaleString("en-IN")}`, `Note: ${qrData.note}`, `TID: ${tid}`, `Recurrence: ${form.recur}`];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setDetailsCopied(true);
      setTimeout(() => setDetailsCopied(false), 2000);
    } catch {}
  }, [qrData, tid, form.recur]);

  // Template actions
  const handleSaveTemplate = () => {
    if (!form.upiId.trim()) { setTemplateMsg("Enter UPI ID first"); setTimeout(() => setTemplateMsg(""), 2500); return; }
    const t: MandateTemplate = { upiId: form.upiId.trim(), name: form.name.trim(), mc: form.mc.trim(), mn: form.mn.trim(), orgid: form.orgid.trim() };
    localStorage.setItem(MANDATE_TEMPLATE_KEY, JSON.stringify(t));
    setTemplateMsg("Template saved!");
    setTimeout(() => setTemplateMsg(""), 2500);
  };

  const handleLoadTemplate = () => {
    try {
      const raw = localStorage.getItem(MANDATE_TEMPLATE_KEY);
      if (!raw) { setTemplateMsg("No template saved yet"); setTimeout(() => setTemplateMsg(""), 2500); return; }
      const t: MandateTemplate = JSON.parse(raw);
      setForm(prev => ({ ...prev, upiId: t.upiId, name: t.name, mc: t.mc, mn: t.mn, orgid: t.orgid }));
      setTemplateMsg("Template loaded!");
      setTimeout(() => setTemplateMsg(""), 2500);
    } catch { setTemplateMsg("Invalid template"); setTimeout(() => setTemplateMsg(""), 2500); }
  };

  const handleDeleteTemplate = () => {
    if (!localStorage.getItem(MANDATE_TEMPLATE_KEY)) { setTemplateMsg("No template to delete"); setTimeout(() => setTemplateMsg(""), 2500); return; }
    localStorage.removeItem(MANDATE_TEMPLATE_KEY);
    setTemplateMsg("Template deleted!");
    setTimeout(() => setTemplateMsg(""), 2500);
  };

  const handleDeleteHistory = (id: string) => {
    const updated = getMandateHistory().filter(h => h.id !== id);
    localStorage.setItem(MANDATE_HISTORY_KEY, JSON.stringify(updated));
    setHistoryItems(updated);
  };

  const handleClearHistory = () => {
    localStorage.removeItem(MANDATE_HISTORY_KEY);
    setHistoryItems([]);
  };

  return (
    <div className="space-y-6">
      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          AutoPay mandates are supported only by select UPI apps and banks. Test before sharing.
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Beta</span>
          <h2 className="text-lg font-bold text-foreground">Recurring Payment Setup</h2>
        </div>

        {/* Required Fields */}
        <InputField label="UPI ID" placeholder="merchant@bank" value={form.upiId} error={errors.upiId} showValidation isValid={isUpiValid} onChange={(v) => handleChange("upiId", v)} />
        <InputField label="Payee Name" placeholder="Business Name" value={form.name} onChange={(v) => handleChange("name", v)} />
        <InputField label="Amount (₹)" placeholder="499" type="number" value={form.amount} error={errors.amount} onChange={(v) => handleChange("amount", v)} />
        <InputField label="Transaction Note" placeholder="Monthly subscription" value={form.note} error={errors.note} onChange={(v) => handleChange("note", v)} />
        <InputField label="Merchant Category Code" placeholder="5411" value={form.mc} error={errors.mc} onChange={(v) => handleChange("mc", v)} />

        {/* Auto-generated TID */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Transaction ID (auto-generated, 35 chars)</label>
          <div className="px-4 py-3 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground font-mono break-all">{tid}</div>
        </div>

        {/* Mandate Settings */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-foreground">Mandate Settings</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Start Date</label>
              <input type="date" value={form.validitystart} onChange={(e) => handleChange("validitystart", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">End Date</label>
              <input type="date" value={form.validityend} onChange={(e) => handleChange("validityend", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              {errors.validityend && <p className="mt-1 text-xs text-destructive">{errors.validityend}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Recurrence</label>
              <select value={form.recur} onChange={(e) => handleChange("recur", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {RECUR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Amount Rule</label>
              <select value={form.amrule} onChange={(e) => handleChange("amrule", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {AMRULE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Optional fields */}
          <InputField label="Merchant Name" placeholder="My Store" value={form.mn} optional onChange={(v) => handleChange("mn", v)} />
          <InputField label="Organization ID" placeholder="000000" value={form.orgid} optional onChange={(v) => handleChange("orgid", v)} />
        </div>

        {/* Template Actions */}
        <div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-accent transition-all">
              <Save className="w-3.5 h-3.5" /> Save Template
            </button>
            <button type="button" onClick={handleLoadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-accent transition-all">
              <FolderOpen className="w-3.5 h-3.5" /> Load
            </button>
            <button type="button" onClick={handleDeleteTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
          {templateMsg && <p className="text-xs text-primary mt-1.5">{templateMsg}</p>}
        </div>

        <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          <RotateCcw className="w-4 h-4" /> Reset Mandate Form
        </button>
      </div>

      {/* History */}
      <div>
        {!historyOpen ? (
          <button type="button" onClick={() => { setHistoryOpen(true); setHistoryItems(getMandateHistory()); }} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <History className="w-3.5 h-3.5" /> Mandate History ({getMandateHistory().length})
          </button>
        ) : (
          <div className="w-full bg-card rounded-xl shadow-card p-4 space-y-3 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <History className="w-4 h-4" /> Mandate History
              </h3>
              <div className="flex gap-2 items-center">
                {historyItems.length > 0 && (
                  <button type="button" onClick={handleClearHistory} className="text-xs text-destructive hover:underline">Clear All</button>
                )}
                <button type="button" onClick={() => setHistoryOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
            {historyItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No mandate QR codes generated yet.</p>
            ) : (
              <div className="space-y-0 max-h-72 overflow-y-auto scroll-smooth">
                {historyItems.map((item, idx) => (
                  <div key={item.id}>
                    {idx > 0 && <div className="border-t border-border" />}
                    <div className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-all rounded-lg">
                      <img src={item.qrDataUrl} alt="QR" className="w-10 h-10 rounded-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name || item.upiId}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.upiId}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {item.amount && <span className="text-xs font-semibold text-primary">₹{Number(item.amount).toLocaleString("en-IN")}</span>}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleDeleteHistory(item.id)} className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Output */}
      {qrData && (
        <div className="space-y-4 animate-fade-in">
          <div className="cursor-pointer" onClick={() => setZoomOpen(true)}>
            <QRPreviewCard ref={cardRef} qrData={qrData} cardStyle="bold-amount" showBranding />
          </div>

          <div className="flex gap-3">
            <button onClick={handleDownload} className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] shadow-sm">Download QR</button>
            <button onClick={handleShare} className="flex-1 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm border border-border transition-all hover:bg-accent active:scale-[0.98]">Share QR</button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setExportOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <FileOutput className="w-4 h-4" /> Export QR
            </button>
            <button onClick={() => setScanOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <ScanLine className="w-4 h-4" /> Test Scan
            </button>
          </div>

          <button type="button" onClick={handleCopyDetails} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            {detailsCopied ? <><Check className="w-4 h-4 text-primary" /> Details copied</> : <><Copy className="w-4 h-4" /> Copy Mandate Details</>}
          </button>

          <QRSafetyChecker qrDataUrl={qrData.qrDataUrl} logoDataUrl={null} qrMargin={2} />

          <ExportQRModal open={exportOpen} onClose={() => setExportOpen(false)} qrData={qrData} onSuccess={(msg) => toast({ title: msg, duration: 3000 })} onError={(msg) => toast({ title: msg, variant: "destructive", duration: 3000 })} />
          <QRScanTestModal open={scanOpen} onClose={() => setScanOpen(false)} qrDataUrl={qrData.qrDataUrl} logoDataUrl={null} expectedData={qrData.upiLink} onSuccess={(msg) => toast({ title: msg, duration: 3000 })} onError={(msg) => toast({ title: msg, variant: "destructive", duration: 3000 })} />
          <QRZoomModal open={zoomOpen} onClose={() => setZoomOpen(false)} qrData={qrData} />
        </div>
      )}
    </div>
  );
};

export default AutoPayMandateForm;
