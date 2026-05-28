import { useEffect, useState } from "react";
import { Info, Download } from "lucide-react";
import AboutModal from "./AboutModal";
import { onInstallAvailabilityChange, promptInstall, isStandalone } from "@/lib/pwa";

const SOCIAL_LINKS = [
  
  { href: "https://www.instagram.com/charanrajtechy", label: "Instagram", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { href: "https://www.facebook.com/charanrajtechy", label: "Facebook", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { href: "https://www.linkedin.com/in/charanrajtechy", label: "LinkedIn", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { href: "https://youtube.com/@clpstudiobycharanraj", label: "YouTube", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { href: "https://x.com/CharanRajTechy", label: "X (Twitter)", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z"/></svg> },
  { href: "https://t.me/CLPStudio", label: "Telegram", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { href: "https://www.threads.com/@charan_raj_panthula", label: "Threads", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.228 1.33-2.93.88-.67 2.062-1.04 3.528-1.098 1.076-.042 2.06.042 2.944.244-.028-1.14-.335-2.016-.94-2.606-.7-.682-1.764-1.025-3.164-1.022l-.07.002c-1.065.013-1.95.306-2.632.873l-1.32-1.544c.96-.822 2.163-1.262 3.58-1.312l.093-.001h.009c1.87 0 3.327.546 4.33 1.622.9.963 1.378 2.282 1.42 3.922.524.14 1.002.32 1.437.548 1.076.566 1.907 1.39 2.4 2.388.8 1.62.886 4.351-1.228 6.432-1.768 1.742-3.9 2.512-6.907 2.535zM10.87 15.86c-.36.022-.688.076-.982.16.304.73.948 1.128 1.824 1.128l.13-.004c1.064-.058 1.86-.46 2.428-1.228.348-.47.596-1.058.745-1.76-.856-.186-1.812-.268-2.845-.223-1.122.044-1.957.37-2.493.876-.37.35-.546.755-.52 1.202.03.53.352.97.908 1.24.524.254 1.18.368 1.85.336z"/></svg> },
  { href: "https://www.snapchat.com/add/charanrajtechy", label: "Snapchat", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.922-.256.199-.104.414-.155.629-.155.245 0 .474.073.665.21a.89.89 0 01.372.716.94.94 0 01-.502.849c-.389.201-.986.396-1.727.586a1.3 1.3 0 00-.079.03c-.16.067-.378.161-.391.394 0 .037.009.075.02.112.33.762.795 1.455 1.383 2.06.401.413.853.774 1.346 1.08.374.229.757.39 1.14.492.287.074.564.221.564.5.013.394-.396.706-.665.84a6.254 6.254 0 01-1.327.438c-.064.013-.19.045-.22.108-.03.075-.01.18 0 .251l.009.052c.063.267.125.534.087.726-.044.218-.269.37-.502.37a3.17 3.17 0 01-.503-.064 7.848 7.848 0 00-1.649-.181c-.41 0-.794.042-1.14.126-.465.112-.897.36-1.381.634-.741.42-1.581.893-2.84.893h-.037c-1.26 0-2.099-.474-2.842-.894-.483-.274-.916-.521-1.379-.634-.347-.083-.73-.126-1.14-.126-.571 0-1.127.069-1.648.182-.17.039-.336.063-.503.063-.233 0-.458-.152-.502-.37-.038-.191.024-.459.087-.726l.009-.052c.011-.07.029-.177 0-.251-.03-.063-.157-.095-.22-.108a6.244 6.244 0 01-1.328-.438c-.27-.135-.678-.446-.665-.84.001-.28.277-.426.564-.5.383-.103.766-.263 1.14-.493a7.46 7.46 0 001.347-1.08c.588-.604 1.052-1.298 1.383-2.06.011-.037.02-.075.02-.112-.014-.233-.232-.327-.39-.394a1.07 1.07 0 00-.08-.03c-.741-.19-1.337-.385-1.727-.586a.936.936 0 01-.501-.849.89.89 0 01.372-.716c.19-.137.42-.21.664-.21.215 0 .43.051.629.155.263.135.621.24.922.256.197 0 .325-.045.401-.09a73.03 73.03 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg> },
  { href: "https://aratt.ai/@clpstudio", label: "Arattai", svg: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg> },
];

const AppFooter = () => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const version = "v3.9.1";

  useEffect(() => {
    setInstalled(isStandalone());
    const off = onInstallAvailabilityChange(setCanInstall);
    return () => { off(); };
  }, []);

  const handleInstall = async () => {
    await promptInstall();
  };

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

        <div className="text-center space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Connect with the Developer</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${link.label} (opens in new tab)`}
                title={link.label}
                className="p-2 rounded-xl border border-border hover:bg-muted hover:border-muted-foreground/30 transition-all text-muted-foreground hover:text-foreground"
              >
                {link.svg}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setAboutOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            About This Tool
          </button>
          {canInstall && !installed && (
            <button
              id="installBtn"
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-[11px] text-muted-foreground">
            Built by Charan Raj – CLP Studio
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
