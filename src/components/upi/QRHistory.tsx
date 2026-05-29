import { useState, useEffect, useCallback, useRef } from "react";
import { History, Trash2, Clock, Download, Share2, Upload, FileDown } from "lucide-react";
import type { QRHistoryItem } from "./types";
import { shareQR, downloadQR } from "./shareQR";
import QRPreviewCard from "./QRPreviewCard";
import { buildUpiLink } from "./buildUpiLink";

const STORAGE_KEY = "qr_history";
const MAX_ITEMS = 15;

export function getHistory(): QRHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToHistory(item: QRHistoryItem) {
  const list = getHistory();
  // Duplicate check: same upiId, amount, note, name
  const dupeIndex = list.findIndex(
    (h) =>
      h.upiId === item.upiId &&
      h.amount === item.amount &&
      h.note === item.note &&
      h.name === item.name
  );
  if (dupeIndex !== -1) {
    // Update timestamp and move to top
    list[dupeIndex].createdAt = item.createdAt;
    list[dupeIndex].qrDataUrl = item.qrDataUrl;
    list[dupeIndex].label = item.label;
    list[dupeIndex].cardStyle = item.cardStyle;
    const [updated] = list.splice(dupeIndex, 1);
    list.unshift(updated);
  } else {
    list.unshift(item);
  }
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
}

interface QRHistoryProps {
  onSelect: (item: QRHistoryItem) => void;
}

const QRHistory = ({ onSelect }: QRHistoryProps) => {
  const [items, setItems] = useState<QRHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<QRHistoryItem | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(getHistory());
  }, [open]);

  const handleClear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    const updated = getHistory().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setItems(updated);
  }, []);

  const performAction = useCallback(async (item: QRHistoryItem, action: "download" | "share") => {
    setActiveItem(item);
    await new Promise((r) => setTimeout(r, 100));
    const el = hiddenCardRef.current;
    if (!el) return;
    try {
      if (action === "download") {
        await downloadQR(el, item.name, item.upiId);
      } else {
        const result = await shareQR(el, item.name, item.upiId, item.amount, item.note);
        if (result === "downloaded") {
          setShareMsg("QR downloaded. You can share it manually.");
          setTimeout(() => setShareMsg(null), 4000);
        }
      }
    } catch {
      // cancelled
    } finally {
      setActiveItem(null);
    }
  }, []);

  const handleExport = useCallback(() => {
    const data = getHistory();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-history-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        if (!Array.isArray(imported)) throw new Error("Invalid");
        // Validate structure
        const valid = imported.filter(
          (item: any) => item.upiId && item.createdAt && typeof item.id === "string"
        ) as QRHistoryItem[];

        const existing = getHistory();
        // Merge without duplicates
        for (const item of valid) {
          const dupeIndex = existing.findIndex(
            (h) => h.upiId === item.upiId && h.amount === item.amount && h.note === item.note && h.name === item.name
          );
          if (dupeIndex === -1) {
            existing.push(item);
          }
        }
        // Sort by date desc, cap
        existing.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (existing.length > MAX_ITEMS) existing.length = MAX_ITEMS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        setItems(existing);
        setShareMsg("Imported! Data stays only in your browser.");
        setTimeout(() => setShareMsg(null), 4000);
      } catch {
        setShareMsg("Invalid file format.");
        setTimeout(() => setShareMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <History className="w-3.5 h-3.5" /> QR History ({getHistory().length})
      </button>
    );
  }

  return (
    <div className="w-full bg-card rounded-xl shadow-card p-4 space-y-3 border border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <History className="w-4 h-4" /> Recent QR Codes
        </h3>
        <div className="flex gap-2 items-center">
          {items.length > 0 && (
            <>
              <button type="button" onClick={handleExport} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Export history" title="Export">
                <FileDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleClear} className="text-xs text-destructive hover:underline">Clear All</button>
            </>
          )}
          <button type="button" onClick={() => importRef.current?.click()} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" aria-label="Import history" title="Import">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
        </div>
      </div>

      {shareMsg && <p className="text-xs text-primary text-center">{shareMsg}</p>}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No QR codes generated yet.</p>
      ) : (
        <div className="space-y-0 max-h-72 overflow-y-auto scroll-smooth">
          {items.map((item, idx) => (
            <div key={item.id}>
              {idx > 0 && <div className="border-t border-border" />}
              <div className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-all rounded-lg">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <img src={item.qrDataUrl} alt="QR" className="w-10 h-10 rounded-sm flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name || item.upiId}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.upiId}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.amount && (
                        <span className="text-xs font-semibold text-amount">
                          ₹{Number(item.amount).toLocaleString("en-IN")}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => performAction(item, "download")} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" aria-label="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => performAction(item, "share")} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" aria-label="Share">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(item.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" aria-label="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeItem && (
        <div className="fixed left-[-9999px] top-0">
          <QRPreviewCard
            ref={hiddenCardRef}
            qrData={{
              upiLink: buildUpiLink(activeItem.upiId, activeItem.name, activeItem.amount, activeItem.note),
              qrDataUrl: activeItem.qrDataUrl,
              name: activeItem.name,
              upiId: activeItem.upiId,
              amount: activeItem.amount,
              note: activeItem.note,
              label: activeItem.label,
            }}
            cardStyle={activeItem.cardStyle}
          />
        </div>
      )}
    </div>
  );
};

export default QRHistory;
