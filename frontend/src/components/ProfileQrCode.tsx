"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Renders a brand-styled "card" (orange gradient background, rounded frame, site name, the QR
// itself, the profile name and a caption) onto a single <canvas> — this doubles as both the
// on-screen preview and the exact image that gets downloaded, so what the user sees is what they
// save. Generation happens fully client-side via the `qrcode` package (no network calls).
export function ProfileQrCode({ name, url, onClose }: { name: string; url: string; onClose: () => void }) {
  const t = useTranslations("share");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const SIZE = 560;
    const HEADER_H = 70;
    const FOOTER_H = 110;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = SIZE;
      canvas.height = HEADER_H + SIZE + FOOTER_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const totalH = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, SIZE, totalH);
      grad.addColorStop(0, "#fff7ed");
      grad.addColorStop(1, "#ffedd5");
      roundRect(ctx, 0, 0, SIZE, totalH, 32);
      ctx.fillStyle = grad;
      ctx.fill();

      roundRect(ctx, 4, 4, SIZE - 8, totalH - 8, 28);
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#c2410c";
      ctx.font = "bold 30px Arial, sans-serif";
      ctx.fillText("Event Saman", SIZE / 2, 46);

      const qrDataUrl = await QRCode.toDataURL(url, {
        margin: 0,
        width: 1000,
        color: { dark: "#7c2d12", light: "#00000000" },
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("qr image load failed"));
        img.src = qrDataUrl;
      });
      if (cancelled) return;

      const pad = 40;
      const qrSize = SIZE - pad * 2;
      const qrY = HEADER_H + 10;
      roundRect(ctx, pad, qrY, qrSize, qrSize, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.drawImage(img, pad + 12, qrY + 12, qrSize - 24, qrSize - 24);

      ctx.fillStyle = "#1f2937";
      ctx.font = "600 24px Arial, sans-serif";
      const nameY = qrY + qrSize + 42;
      ctx.fillText(name.length > 28 ? `${name.slice(0, 27)}…` : name, SIZE / 2, nameY);

      ctx.fillStyle = "#9a3412";
      ctx.font = "15px Arial, sans-serif";
      ctx.fillText(t("scanToView"), SIZE / 2, nameY + 30);

      if (!cancelled) setReady(true);
    }

    draw().catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [url, name, t]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const link = document.createElement("a");
    const safeName = name.trim().replace(/\s+/g, "-").toLowerCase() || "profile";
    link.download = `${safeName}-qr-code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{t("myQrCode")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="relative w-full max-w-[280px]">
            <canvas ref={canvasRef} className="w-full rounded-2xl shadow-sm" />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-orange-50/70 text-center text-xs font-medium text-orange-600">
                {t("generatingQr")}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-center text-sm text-red-600">{t("qrError")}</p>}

        <button
          type="button"
          disabled={!ready}
          onClick={download}
          className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("downloadQr")}
        </button>
      </div>
    </div>
  );
}
