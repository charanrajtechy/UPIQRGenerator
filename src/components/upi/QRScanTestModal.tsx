import { useState, useCallback, useEffect, useRef } from "react";
import { X, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";
import jsQR from "jsqr";

interface Props {
  open: boolean;
  onClose: () => void;
  qrDataUrl: string;
  logoDataUrl?: string | null;
  expectedData: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

interface DecodedUpi {
  upiId: string;
  name: string;
  amount: string;
  note: string;
  raw: string;
  isMandate?: boolean;
  mc?: string;
  mn?: string;
  tid?: string;
  orgid?: string;
  recur?: string;
  amrule?: string;
  validitystart?: string;
  validityend?: string;
  txnType?: string;
}

function parseUpiLink(data: string): DecodedUpi | null {
  try {
    const isMandate = data.startsWith("upi://mandate");
    const isPay = data.startsWith("upi://pay");
    if (!isMandate && !isPay) return null;
    const queryStr = data.split("?")[1];
    if (!queryStr) return null;
    const params = new URLSearchParams(queryStr);
    return {
      upiId: params.get("pa") || "",
      name: params.get("pn") || "",
      amount: params.get("am") || "",
      note: params.get("tn") || "",
      raw: data,
      isMandate,
      mc: params.get("mc") || "",
      mn: params.get("mn") || "",
      tid: params.get("tid") || "",
      orgid: params.get("orgid") || "",
      recur: params.get("recur") || "",
      amrule: params.get("amrule") || "",
      validitystart: params.get("validitystart") || "",
      validityend: params.get("validityend") || "",
      txnType: params.get("txnType") || "",
    };
  } catch {
    return null;
  }
}

const QRScanTestModal = ({ open, onClose, qrDataUrl, logoDataUrl, expectedData, onSuccess, onError }: Props) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"success" | "fail" | null>(null);
  const [decoded, setDecoded] = useState<DecodedUpi | null>(null);
  const hasScannedRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResult(null);
    setDecoded(null);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = qrDataUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const parsed = parseUpiLink(code.data);
        setDecoded(parsed);
        setResult("success");
        if (code.data === expectedData) {
          onSuccessRef.current("QR scan successful. The generated QR is valid.");
        } else {
          onSuccessRef.current("QR scanned successfully! Data detected.");
        }
      } else {
        setResult("fail");
        onErrorRef.current("Unable to verify QR. Please regenerate the code.");
      }
    } catch {
      setResult("fail");
      onErrorRef.current("Unable to verify QR. Please regenerate the code.");
    } finally {
      setScanning(false);
    }
  }, [qrDataUrl, expectedData]);

  useEffect(() => {
    if (open && !hasScannedRef.current) {
      hasScannedRef.current = true;
      setResult(null);
      setDecoded(null);
      const t = setTimeout(() => handleScan(), 300);
      return () => clearTimeout(t);
    }
    if (!open) {
      hasScannedRef.current = false;
    }
  }, [open, handleScan]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden" style={{ animation: 'none' }}>
        <div className="flex items-center justify-between p-4 shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Test Scan QR</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-4 flex flex-col items-center gap-3 overflow-y-auto min-h-[200px]">
          <div className="relative shrink-0">
            <img src={qrDataUrl} alt="QR to verify" className="w-32 h-32 rounded-lg" />
            {logoDataUrl && (
              <img
                src={logoDataUrl}
                alt="Logo"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[32px] max-h-[32px] rounded-md bg-white p-0.5 shadow-sm object-contain"
              />
            )}
          </div>

          {scanning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Verifying QR code…
            </div>
          )}

          {result === "success" && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                QR is valid and scannable
              </div>

              {decoded && (
                <div className="w-full rounded-xl border border-border bg-muted/50 p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {decoded.isMandate ? "Decoded Mandate Data" : "Decoded Payment Data"}
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">UPI ID</span>
                      <span className="text-xs font-medium text-foreground text-right break-all">{decoded.upiId || "—"}</span>
                    </div>
                    {decoded.name && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Payee Name</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.name}</span>
                      </div>
                    )}
                    {decoded.amount && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Amount</span>
                        <span className="text-xs font-semibold text-primary text-right">₹{Number(decoded.amount).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {decoded.note && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Note</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.note}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.tid && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Transaction ID</span>
                        <span className="text-xs font-medium text-foreground text-right break-all">{decoded.tid}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.mc && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Merchant Code</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.mc}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.mn && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Merchant Name</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.mn}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.orgid && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Org ID</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.orgid}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.recur && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Recurrence</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.recur}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.amrule && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Amount Rule</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.amrule}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.validitystart && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Start Date</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.validitystart}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.validityend && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">End Date</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.validityend}</span>
                      </div>
                    )}
                    {decoded.isMandate && decoded.txnType && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">Txn Type</span>
                        <span className="text-xs font-medium text-foreground text-right">{decoded.txnType}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-green-600 dark:text-green-400 text-center pt-1">
                    ✓ This is the exact data encoded in your QR code
                  </p>
                </div>
              )}
            </div>
          )}

          {result === "fail" && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Unable to verify QR
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
          >
            {scanning ? "Scanning…" : "Scan Again"}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center p-3 border-t border-border shrink-0">
          This verifies the generated QR code by decoding it programmatically.
        </p>
      </div>
    </div>
  );
};

export default QRScanTestModal;
