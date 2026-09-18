import QRCode from "qrcode";

export type FinderStyle = "square" | "smooth" | "rounded";
export type ModuleStyle =
  | "square"
  | "dots"
  | "rounded-square"
  | "soft-rounded"
  | "diamond"
  | "inset-square"
  | "horizontal-pill"
  | "vertical-pill"
  | "hexagon";

interface RenderOptions {
  data: string;
  size: number;
  margin?: number;
  finderStyle: FinderStyle;
  moduleStyle: ModuleStyle;
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

// Check if a module at (row, col) is part of a finder pattern
function isFinderPattern(row: number, col: number, moduleCount: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

// Check if module is the outer border of a finder pattern
function isFinderOuter(row: number, col: number, moduleCount: number): boolean {
  // Top-left finder outer
  if ((row === 0 || row === 6) && col >= 0 && col <= 6) return true;
  if ((col === 0 || col === 6) && row >= 0 && row <= 6) return true;
  // Top-right finder outer
  const rOff = moduleCount - 7;
  if ((row === 0 || row === 6) && col >= rOff && col <= rOff + 6) return true;
  if ((col === rOff || col === rOff + 6) && row >= 0 && row <= 6) return true;
  // Bottom-left finder outer
  const bOff = moduleCount - 7;
  if ((row === bOff || row === bOff + 6) && col >= 0 && col <= 6) return true;
  if ((col === 0 || col === 6) && row >= bOff && row <= bOff + 6) return true;
  return false;
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  style: FinderStyle,
  fgColor: string,
  bgColor: string
) {
  const s = cellSize * 7;
  const r = style === "rounded" ? cellSize * 1.5 : style === "smooth" ? cellSize * 0.8 : 0;

  // Outer border
  ctx.fillStyle = fgColor;
  drawRoundedRect(ctx, x, y, s, s, r);
  ctx.fill();

  // White inner
  const innerR = style === "rounded" ? cellSize * 1.0 : style === "smooth" ? cellSize * 0.5 : 0;
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, x + cellSize, y + cellSize, s - cellSize * 2, s - cellSize * 2, innerR);
  ctx.fill();

  // Center dot
  const dotR = style === "rounded" ? cellSize * 0.6 : style === "smooth" ? cellSize * 0.3 : 0;
  ctx.fillStyle = fgColor;
  drawRoundedRect(ctx, x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3, dotR);
  ctx.fill();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: ModuleStyle,
  color: string
) {
  ctx.fillStyle = color;

  switch (style) {
    case "square":
      ctx.fillRect(x, y, size, size);
      break;
    case "dots": {
      const radius = size * 0.45;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rounded-square": {
      const r = size * 0.3;
      drawRoundedRect(ctx, x, y, size, size, r);
      ctx.fill();
      break;
    }
    case "soft-rounded": {
      const r2 = size * 0.45;
      drawRoundedRect(ctx, x, y, size, size, r2);
      ctx.fill();
      break;
    }
    case "diamond": {
      ctx.beginPath();
      ctx.moveTo(x + size / 2, y);
      ctx.lineTo(x + size, y + size / 2);
      ctx.lineTo(x + size / 2, y + size);
      ctx.lineTo(x, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "inset-square": {
      const inset = size * 0.14;
      ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
      break;
    }
    case "horizontal-pill": {
      const height = size * 0.62;
      drawRoundedRect(ctx, x, y + (size - height) / 2, size, height, height / 2);
      ctx.fill();
      break;
    }
    case "vertical-pill": {
      const width = size * 0.62;
      drawRoundedRect(ctx, x + (size - width) / 2, y, width, size, width / 2);
      ctx.fill();
      break;
    }
    case "hexagon": {
      const inset = size * 0.18;
      ctx.beginPath();
      ctx.moveTo(x + inset, y);
      ctx.lineTo(x + size - inset, y);
      ctx.lineTo(x + size, y + size / 2);
      ctx.lineTo(x + size - inset, y + size);
      ctx.lineTo(x + inset, y + size);
      ctx.lineTo(x, y + size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

export async function renderCustomQR(options: RenderOptions): Promise<string> {
  const {
    data,
    size,
    margin = 2,
    finderStyle,
    moduleStyle,
    fgColor = "#1a1a2e",
    bgColor = "#ffffff",
    errorCorrectionLevel = "H",
  } = options;

  // @ts-ignore - create exists on qrcode
  const qrObj = QRCode.create(data, { errorCorrectionLevel });
  const modules = qrObj.modules;
  const moduleCount = modules.size;
  const dataArr: boolean[][] = [];

  for (let row = 0; row < moduleCount; row++) {
    dataArr[row] = [];
    for (let col = 0; col < moduleCount; col++) {
      dataArr[row][col] = modules.get(row, col) === 1;
    }
  }

  const cellSize = (size - margin * 2) / moduleCount;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Draw data modules (skip finder pattern areas)
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (isFinderPattern(row, col, moduleCount)) continue;
      if (!dataArr[row][col]) continue;

      const x = margin + col * cellSize;
      const y = margin + row * cellSize;
      drawModule(ctx, x, y, cellSize, moduleStyle, fgColor);
    }
  }

  // Draw finder patterns
  // Top-left
  drawFinderPattern(ctx, margin, margin, cellSize, finderStyle, fgColor, bgColor);
  // Top-right
  drawFinderPattern(ctx, margin + (moduleCount - 7) * cellSize, margin, cellSize, finderStyle, fgColor, bgColor);
  // Bottom-left
  drawFinderPattern(ctx, margin, margin + (moduleCount - 7) * cellSize, cellSize, finderStyle, fgColor, bgColor);

  return canvas.toDataURL("image/png");
}
