import { forwardRef } from "react";
import type { QRData, CardStyle } from "./types";
import { BRANDING_PREVIEW_TEXT } from "@/lib/branding";

interface QRPreviewCardProps {
  qrData: QRData;
  cardStyle: CardStyle;
  showBranding?: boolean;
}

const QRPreviewCard = forwardRef<HTMLDivElement, QRPreviewCardProps>(({ qrData, cardStyle, showBranding = true }, ref) => {
  const hasAmount = !!qrData.amount;
  const hasName = !!qrData.name;
  const hasNote = !!qrData.note;
  const hasLabel = !!qrData.label;

  const cardClasses: Record<CardStyle, string> = {
    minimal: "bg-white rounded-xl shadow-card p-8",
    "bold-amount": "bg-white rounded-xl shadow-card p-8 border-2 border-blue-200",
    boxed: "bg-white rounded-2xl shadow-card p-10 border border-gray-200",
    centered: "bg-white rounded-xl shadow-card p-8",
  };

  const amountClasses: Record<CardStyle, string> = {
    minimal: "text-2xl font-extrabold text-blue-600 mt-2",
    "bold-amount": "text-4xl font-black text-blue-600 mt-3",
    boxed: "text-2xl font-extrabold text-blue-600 mt-2 bg-blue-50 px-4 py-1 rounded-lg inline-block",
    centered: "text-3xl font-extrabold text-blue-600 mt-2",
  };

  return (
    <div ref={ref} className={`${cardClasses[cardStyle]} flex flex-col items-center`}>
      {hasLabel && (
        <p className="text-base font-bold text-gray-900 mb-4">{qrData.label}</p>
      )}
      <div className="relative">
        <img
          src={qrData.qrDataUrl}
          alt="UPI QR Code"
          className="w-56 h-56 sm:w-64 sm:h-64"
        />
        {qrData.logoDataUrl && (
          <img
            src={qrData.logoDataUrl}
            alt="Logo"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[56px] max-h-[56px] sm:max-w-[64px] sm:max-h-[64px] rounded-md bg-white p-1 shadow-sm object-contain"
          />
        )}
      </div>
      <div className="mt-5 text-center space-y-1">
        {hasName && <p className="text-lg font-bold text-gray-900">{qrData.name}</p>}
        <p className="text-sm text-gray-500">{qrData.upiId}</p>
        {hasAmount && (
          <p className={amountClasses[cardStyle]}>
            ₹{Number(qrData.amount).toLocaleString("en-IN")}
          </p>
        )}
        {hasNote && <p className="text-xs text-gray-500 mt-1">{qrData.note}</p>}
      </div>
      {showBranding && (
        <p className="mt-4 text-[10px] text-gray-500 font-medium tracking-wide text-center">
          {BRANDING_PREVIEW_TEXT}
        </p>
      )}
    </div>
  );
});

QRPreviewCard.displayName = "QRPreviewCard";
export default QRPreviewCard;
