import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const AboutModal = ({ open, onClose }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-scale-in max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">About Open UPI QR Generator</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Open UPI QR Generator is a privacy-focused tool designed to help freelancers, creators, and businesses generate professional UPI QR codes instantly.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Key Principles</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Runs completely in your browser</li>
            <li>No login required</li>
            <li>No tracking or analytics</li>
            <li>No data stored on servers</li>
            <li>All QR history stays in your local browser storage</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This project is built with the goal of providing a simple and transparent way to create UPI payment QR codes while respecting user privacy.
        </p>


        <p className="text-[11px] text-muted-foreground text-center pt-2 border-t border-border">
          Built by Charan Raj – CLP Studio
        </p>
      </div>
    </div>
  );
};

export default AboutModal;
