import { useState } from "react";
import { Info, Heart } from "lucide-react";
import AboutModal from "./AboutModal";

const AppFooter = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const version = "v5.2.78";

  return (
    <>
      <footer className="w-full max-w-md mx-auto mt-12 pb-8 space-y-6">
        <div className="border-t border-border pt-6 text-center space-y-2">
          <h2 className="text-sm font-bold text-foreground">Open UPI QR Generator</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Privacy-first UPI QR generator that runs entirely in your browser.<br />
            No login. No tracking. No server storage.
          </p>
        </div>

        <div className="text-center space-y-2">
          <a
            href="https://rzp.io/rzp/pBwC89T"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border border-border hover:bg-muted hover:border-muted-foreground/30 transition-all text-muted-foreground hover:text-foreground"
          >
            <Heart className="w-3.5 h-3.5" />
            Support or Request a Custom Build
          </a>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setAboutOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            About This Tool
          </button>
        </div>

        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            Built to Learn Coding
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Version {version}
          </p>
        </div>
      </footer>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};

export default AppFooter;
