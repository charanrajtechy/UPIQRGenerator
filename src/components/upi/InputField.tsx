import { Copy, Check, CircleCheck, CircleAlert } from "lucide-react";
import { useState, useCallback } from "react";

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  type?: string;
  optional?: boolean;
  showCopy?: boolean;
  showValidation?: boolean;
  isValid?: boolean;
  maxLength?: number;
  onChange: (value: string) => void;
}

const InputField = ({
  label,
  placeholder,
  value,
  error,
  type = "text",
  optional = false,
  showCopy = false,
  showValidation = false,
  isValid,
  maxLength,
  onChange,
}: InputFieldProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {optional && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {showValidation && value.trim() && (
            isValid ? (
              <CircleCheck className="w-4 h-4 text-green-500" />
            ) : (
              <CircleAlert className="w-4 h-4 text-destructive" />
            )
          )}
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Copy UPI ID"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1 min-h-[1rem]">
        {error ? <p className="text-xs text-destructive">{error}</p> : <span />}
        {maxLength && (
          <p className="text-[10px] text-muted-foreground ml-auto">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default InputField;
