import { createCanvas } from "canvas";

export type RenderOptions = {
  size?: number;
  background?: string;
  fontFamily?: string;
  barPadding?: number;
};

export default async function renderVolumeImage(volume: number, muted: boolean, opts: RenderOptions = {}): Promise<string> {
  const size = opts.size ?? 240;
  const bg = opts.background ?? "#0b0b0b";
  const fontFamily = opts.fontFamily ?? "Sans";
  const barPaddingProp = opts.barPadding ?? 0.12;

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // bar geometry
  const barW = Math.round(size * (1 - 2 * barPaddingProp));
  const barH = Math.round(size * 0.12);
  const x = Math.round((size - barW) / 2);
  const y = Math.round(size * 0.5 - barH / 2);

  // track
  drawRoundedRect(ctx, x, y, barW, barH, barH / 2, "#2e2e2e");

  // fill portion
  const fillW = Math.round((Math.max(0, Math.min(100, volume)) / 100) * barW);
  if (fillW > 0) {
    const grad = ctx.createLinearGradient(x, y, x + barW, y);
    grad.addColorStop(0.0, "#4caf50");
    grad.addColorStop(0.6, "#ffeb3b");
    grad.addColorStop(1.0, "#f44336");
    drawRoundedRect(ctx, x, y, fillW, barH, barH / 2, grad);
  }

  // outline
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = Math.max(1, Math.round(size * 0.006));
  drawRoundedRectStroke(ctx, x, y, barW, barH, barH / 2);

  // percent text
  ctx.fillStyle = "#ffffff";
  const fontSize = Math.round(size * 0.14);
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${Math.round(volume)}%`, size / 2, y - Math.round(size * 0.04));

  // muted cross
  if (muted) {
    ctx.strokeStyle = "rgba(220,50,50,0.98)";
    ctx.lineWidth = Math.max(6, Math.round(size * 0.03));
    ctx.lineCap = "round";
    const pad = Math.round(barH * 0.4);
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + barW - pad, y + barH - pad);
    ctx.moveTo(x + barW - pad, y + pad);
    ctx.lineTo(x + pad, y + barH - pad);
    ctx.stroke();
  }

  const buffer = canvas.toBuffer("image/png");
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fillStyle: string | CanvasGradient) {
  const maxR = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + maxR, y);
  ctx.arcTo(x + w, y, x + w, y + h, maxR);
  ctx.arcTo(x + w, y + h, x, y + h, maxR);
  ctx.arcTo(x, y + h, x, y, maxR);
  ctx.arcTo(x, y, x + w, y, maxR);
  ctx.closePath();
  ctx.fillStyle = (fillStyle as string) ?? "#fff";
  ctx.fill();
}

function drawRoundedRectStroke(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const maxR = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + maxR, y);
  ctx.arcTo(x + w, y, x + w, y + h, maxR);
  ctx.arcTo(x + w, y + h, x, y + h, maxR);
  ctx.arcTo(x, y + h, x, y, maxR);
  ctx.arcTo(x, y, x + w, y, maxR);
  ctx.closePath();
  ctx.stroke();
}