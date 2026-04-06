import { useState, useEffect, useCallback } from "react";
import { X, Bell, BellOff, FlaskConical } from "lucide-react";

function BetaToggle() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("beta_features") === "true");

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("beta_features", String(next));
    window.dispatchEvent(new Event("beta-toggle"));
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <FlaskConical className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Beta Features</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? "You can now test beta features." : "Access beta features before rolled out globally."}
            </p>
          </div>
        </div>
        <button type="button" onClick={toggle} className={`relative w-11 h-6 flex-shrink-0 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>
      {enabled && (
        <p className="text-[10px] text-yellow-600 dark:text-yellow-400">
          ⚠️ Beta features may not work properly. Submit your experience — we will fix them.
        </p>
      )}
    </div>
  );
}

interface SettingsPageProps {
  open: boolean;
  onClose: () => void;
}

const SettingsPage = ({ open, onClose }: SettingsPageProps) => {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  const isNotifSupported = typeof window !== "undefined" && "Notification" in window && typeof Notification.requestPermission === "function";

  useEffect(() => {
    if (!isNotifSupported) {
      setNotifStatus("unsupported");
      return;
    }
    setNotifStatus(Notification.permission as "default" | "granted" | "denied");
    setNotifEnabled(Notification.permission === "granted");
  }, [open, isNotifSupported]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", handleEsc); };
  }, [open, onClose]);

  const handleToggleNotif = useCallback(async () => {
    if (!isNotifSupported) return;

    if (Notification.permission === "granted") {
      setNotifEnabled(false);
      setNotifStatus("default");
      return;
    }

    if (Notification.permission === "denied") {
      setNotifStatus("denied");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifStatus(permission as "default" | "granted" | "denied");
      setNotifEnabled(permission === "granted");

      if (permission === "granted") {
        new Notification("Open UPI QR Generator", {
          body: "Notifications enabled! You'll receive updates about new features.",
          icon: "/favicon.ico",
        });
      }
    } catch {
      setNotifStatus("unsupported");
    }
  }, [isNotifSupported]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-6 animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Beta Features Toggle */}
          <BetaToggle />

          {/* Notifications */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-3 min-w-0">
              {notifEnabled ? <Bell className="w-5 h-5 text-primary flex-shrink-0" /> : <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {notifStatus === "unsupported"
                    ? "Not supported in this app. Use the website instead."
                    : notifStatus === "denied"
                    ? "Blocked by browser. Enable in browser settings."
                    : notifEnabled
                    ? "You'll receive update notifications"
                    : "Get notified about new features"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleNotif}
              disabled={notifStatus === "denied" || notifStatus === "unsupported"}
              className={`relative w-11 h-6 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                notifEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifEnabled ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          All settings are stored locally in your browser.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
