import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { FinderStyle, ModuleStyle } from "./renderCustomQR";

interface Props {
  finderStyle: FinderStyle;
  moduleStyle: ModuleStyle;
  onFinderChange: (s: FinderStyle) => void;
  onModuleChange: (s: ModuleStyle) => void;
}

// --- SVG Preview Components ---

function FinderPreview({ style, selected }: { style: FinderStyle; selected: boolean }) {
  const size = 64;
  const cell = size / 9; // 7 cells + 1 margin each side

  const r = style === "rounded" ? cell * 1.2 : style === "smooth" ? cell * 0.6 : 0;
  const ir = style === "rounded" ? cell * 0.8 : style === "smooth" ? cell * 0.4 : 0;
  const dr = style === "rounded" ? cell * 0.5 : style === "smooth" ? cell * 0.2 : 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <rect x={cell} y={cell} width={cell * 7} height={cell * 7} rx={r} className="fill-foreground" />
      <rect x={cell * 2} y={cell * 2} width={cell * 5} height={cell * 5} rx={ir} className="fill-background" />
      <rect x={cell * 3} y={cell * 3} width={cell * 3} height={cell * 3} rx={dr} className="fill-foreground" />
    </svg>
  );
}

function ModulePreview({ style }: { style: ModuleStyle }) {
  const size = 64;
  const grid = 5;
  const cell = size / (grid + 2);
  const offset = cell;

  // Simple 5x5 pattern
  const pattern = [
    [1, 0, 1, 1, 0],
    [1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0],
    [0, 1, 0, 1, 1],
  ];

  const modules: JSX.Element[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if (!pattern[r][c]) continue;
      const x = offset + c * cell;
      const y = offset + r * cell;

      switch (style) {
        case "square":
          modules.push(<rect key={`${r}-${c}`} x={x} y={y} width={cell * 0.9} height={cell * 0.9} className="fill-foreground" />);
          break;
        case "dots":
          modules.push(<circle key={`${r}-${c}`} cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.4} className="fill-foreground" />);
          break;
        case "rounded-square":
          modules.push(<rect key={`${r}-${c}`} x={x} y={y} width={cell * 0.9} height={cell * 0.9} rx={cell * 0.25} className="fill-foreground" />);
          break;
        case "soft-rounded":
          modules.push(<rect key={`${r}-${c}`} x={x} y={y} width={cell * 0.9} height={cell * 0.9} rx={cell * 0.4} className="fill-foreground" />);
          break;
        case "diamond": {
          const cx = x + cell * 0.45;
          const cy = y + cell * 0.45;
          const h = cell * 0.45;
          modules.push(
            <polygon
              key={`${r}-${c}`}
              points={`${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}`}
              className="fill-foreground"
            />
          );
          break;
        }
        case "inset-square": {
          const inset = cell * 0.13;
          modules.push(
            <rect
              key={`${r}-${c}`}
              x={x + inset}
              y={y + inset}
              width={cell * 0.9 - inset * 2}
              height={cell * 0.9 - inset * 2}
              className="fill-foreground"
            />
          );
          break;
        }
        case "horizontal-pill": {
          const height = cell * 0.56;
          modules.push(
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y + (cell * 0.9 - height) / 2}
              width={cell * 0.9}
              height={height}
              rx={height / 2}
              className="fill-foreground"
            />
          );
          break;
        }
        case "vertical-pill": {
          const width = cell * 0.56;
          modules.push(
            <rect
              key={`${r}-${c}`}
              x={x + (cell * 0.9 - width) / 2}
              y={y}
              width={width}
              height={cell * 0.9}
              rx={width / 2}
              className="fill-foreground"
            />
          );
          break;
        }
        case "hexagon": {
          const width = cell * 0.9;
          const height = cell * 0.9;
          const inset = width * 0.18;
          modules.push(
            <polygon
              key={`${r}-${c}`}
              points={`${x + inset},${y} ${x + width - inset},${y} ${x + width},${y + height / 2} ${x + width - inset},${y + height} ${x + inset},${y + height} ${x},${y + height / 2}`}
              className="fill-foreground"
            />
          );
          break;
        }
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      {modules}
    </svg>
  );
}

const FINDER_OPTIONS: { value: FinderStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "smooth", label: "Smooth" },
  { value: "rounded", label: "Rounded" },
];

const MODULE_OPTIONS: { value: ModuleStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded-square", label: "Rounded" },
  { value: "soft-rounded", label: "Soft" },
  { value: "diamond", label: "Diamond" },
  { value: "inset-square", label: "Inset" },
  { value: "horizontal-pill", label: "Horizontal" },
  { value: "vertical-pill", label: "Vertical" },
  { value: "hexagon", label: "Hexagon" },
];

const QRAppearanceCustomization = ({ finderStyle, moduleStyle, onFinderChange, onModuleChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <span className="flex items-center gap-2">
          QR Appearance Customization
        </span>
        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 pt-3">
        {/* Finder Pattern */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Corner Style (Finder Pattern)</p>
          <div className="grid grid-cols-3 gap-2">
            {FINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFinderChange(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                  finderStyle === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <FinderPreview style={opt.value} selected={finderStyle === opt.value} />
                <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module Style */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">QR Module Style (Data Blocks)</p>
          <div className="grid grid-cols-3 gap-2">
            {MODULE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onModuleChange(opt.value)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                  moduleStyle === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <ModulePreview style={opt.value} />
                <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default QRAppearanceCustomization;
