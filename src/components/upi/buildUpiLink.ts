/**
 * Build a strict, UPI-spec-compliant deep link.
 *
 * Rules:
 *  - pa (UPI ID) is NEVER URL-encoded (apps reject %40 in pa)
 *  - pn (Payee Name) and tn (Transaction Note) are encoded with encodeURIComponent
 *  - Newlines are stripped from tn (some apps reject %0A)
 *  - am is numeric and not encoded; cu defaults to INR when am is present
 *  - Throws on invalid pa / missing pn so callers can surface validation errors
 */
export function buildUpiLink(
  upiId: string,
  name: string,
  amount: string,
  note: string
): string {
  const pa = (upiId || "").trim();
  const pn = (name || "").trim();
  const am = (amount || "").trim();
  // Strip newlines/carriage returns to avoid %0A in tn
  const tn = (note || "").replace(/[\r\n]+/g, " ").trim();

  if (!pa || !pa.includes("@")) {
    throw new Error("Invalid UPI ID");
  }
  if (!pn) {
    throw new Error("Payee name is required");
  }

  const parts: string[] = [`pa=${pa}`, `pn=${encodeURIComponent(pn)}`];

  if (am) {
    parts.push(`am=${encodeURIComponent(am)}`);
    parts.push(`cu=INR`);
  } else {
    parts.push(`cu=INR`);
  }

  if (tn) {
    parts.push(`tn=${encodeURIComponent(tn)}`);
  }

  return `upi://pay?${parts.join("&")}`;
}
