"use client";

import { useEffect, useMemo, useState } from "react";
import { PayoutTier, SpecInput, SpecResult } from "@/lib/calculator";

interface Props {
  input: SpecInput;
  result: SpecResult;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

const THEMES = [
  {
    name: "幻耀",
    bgA: "#160820",
    bgB: "#3c0d66",
    main: "#8a2cff",
    sub: "#13b7ff",
    hot: "#ff315d",
    gold: "#ffd866",
  },
  {
    name: "蒼穹",
    bgA: "#07182d",
    bgB: "#0c4d82",
    main: "#00b8ff",
    sub: "#77e4ff",
    hot: "#ff3a57",
    gold: "#f7d66a",
  },
  {
    name: "烈焔",
    bgA: "#220704",
    bgB: "#7a1008",
    main: "#ff3d22",
    sub: "#ff8b1a",
    hot: "#ff004c",
    gold: "#ffd64d",
  },
  {
    name: "翠嵐",
    bgA: "#061c12",
    bgB: "#0b5a3d",
    main: "#14d47d",
    sub: "#96ffd4",
    hot: "#f4366d",
    gold: "#f2d66d",
  },
];

const ENTRY_COLORS = ["#0095e8", "#f00035"];
const RUSH_COLORS = {
  blue: "#0095e8",
  yellow: "#ffd400",
  green: "#18c56e",
  red: "#f00035",
  orange: "#ff8a00",
  purple: "#a855f7",
};

function hashText(text: string): number {
  return text.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}

function escapeXml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, -startAngle);
  const end = polarToCartesian(cx, cy, r, -endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function sanitizeTiers(tiers: PayoutTier[]): PayoutTier[] {
  return tiers
    .filter((tier) => tier.rate > 0)
    .slice()
    .sort((a, b) => a.payout - b.payout);
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function tierLabel(tier: PayoutTier): string {
  const payout = tier.payout === 0 ? "0発" : `${tier.payout.toLocaleString()}発`;
  return `${tier.label} ${payout}`;
}

function clipText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function pickRushColors(tiers: PayoutTier[]): string[] {
  if (tiers.length === 1) {
    return tiers[0].payout === 0 ? [RUSH_COLORS.blue] : ["url(#rainbowSlice)"];
  }

  const hasReset = tiers.some((tier) => tier.payout === 0);
  const paidTiers = tiers.filter((tier) => tier.payout > 0);
  const paidColors = paidTiers.length === 1
    ? [RUSH_COLORS.red]
    : paidTiers.length === 2
      ? [RUSH_COLORS.yellow, RUSH_COLORS.red]
      : paidTiers.length === 3
        ? [RUSH_COLORS.yellow, RUSH_COLORS.red, "url(#rainbowSlice)"]
        : [RUSH_COLORS.yellow, RUSH_COLORS.green, RUSH_COLORS.red, "url(#rainbowSlice)"];

  let paidIndex = 0;
  return tiers.map((tier) => {
    if (tier.payout === 0) return RUSH_COLORS.blue;
    const color = paidColors[Math.min(paidIndex, paidColors.length - 1)];
    paidIndex += 1;
    return color;
  }).map((color, index) => {
    if (hasReset && tiers[index].payout === 0) return RUSH_COLORS.blue;
    return color;
  });
}

function pickEntryColors(tiers: PayoutTier[]): string[] {
  return tiers.map((tier, index) => {
    if (tier.label.includes("通常")) return ENTRY_COLORS[0];
    if (tier.label.includes("時短")) return RUSH_COLORS.yellow;
    if (tier.label.includes("RUSH") || tier.label.includes("LT")) return ENTRY_COLORS[1];
    if (tiers.length <= 1) return ENTRY_COLORS[1];
    if (index === 0) return ENTRY_COLORS[0];
    if (index === tiers.length - 1) return ENTRY_COLORS[1];
    return RUSH_COLORS.yellow;
  });
}

function pieChartSvg(params: {
  title: string;
  tiers: PayoutTier[];
  x: number;
  y: number;
  r: number;
  compact?: boolean;
  variant: "entry" | "rush";
}) {
  const tiers = sanitizeTiers(params.tiers);
  const colors = params.variant === "entry" ? pickEntryColors(tiers) : pickRushColors(tiers);
  const total = Math.max(1, tiers.reduce((sum, tier) => sum + tier.rate, 0));
  let currentAngle = 0;

  const slices = tiers.map((tier, index) => {
    const angle = (tier.rate / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    const mid = start + angle / 2;
    const labelRadius = params.r * 0.58;
    const labelPoint = polarToCartesian(params.x, params.y, labelRadius, mid);
    const rate = escapeXml(`${formatPercent(tier.rate)}`);
    const fill = colors[index] ?? RUSH_COLORS.red;

    if (tier.rate >= 99.9) {
      return `
        <circle cx="${params.x}" cy="${params.y}" r="${params.r}" fill="${fill}" stroke="#ffffff" stroke-width="4"/>
        <text x="${params.x}" y="${params.y + 16}" text-anchor="middle" class="pieRate">${rate}</text>
      `;
    }

    return `
      <path d="${describeArc(params.x, params.y, params.r, start, end)}" fill="${fill}" stroke="#ffffff" stroke-width="4"/>
      ${
        angle >= 22
          ? `<text x="${labelPoint.x}" y="${labelPoint.y + 16}" text-anchor="middle" class="${params.compact ? "pieRateSmall" : "pieRate"}">${rate}</text>`
          : ""
      }
    `;
  }).join("");

  const legend = tiers.map((tier, index) => {
    const column = Math.floor(index / 3);
    const row = index % 3;
    const legendX = params.x - params.r - 44 + column * (params.r + 66);
    const legendY = params.y + params.r + 28 + row * 28;
    return `
    <g transform="translate(${legendX}, ${legendY})">
      <rect x="0" y="0" width="18" height="18" rx="5" fill="${colors[index] ?? RUSH_COLORS.red}"/>
      <text x="28" y="15" class="legendText">${escapeXml(clipText(tierLabel(tier), 13))} / ${escapeXml(formatPercent(tier.rate))}</text>
    </g>
  `;
  }).join("");

  return `
    <g>
      <rect x="${params.x - params.r - 72}" y="${params.y - params.r - 76}" width="${params.r * 2 + 144}" height="${params.r * 2 + 150}" rx="18" fill="rgba(0,0,0,0.48)" stroke="#ffd866" stroke-width="4"/>
      <rect x="${params.x - params.r - 52}" y="${params.y - params.r - 56}" width="${params.r * 2 + 104}" height="48" rx="12" fill="rgba(240,0,53,0.88)" stroke="#ffffff" stroke-width="2"/>
      <text x="${params.x}" y="${params.y - params.r - 21}" text-anchor="middle" class="chartTitle">${escapeXml(params.title)}</text>
      ${slices}
      ${legend}
    </g>
  `;
}

function heroStatBox(label: string, value: string, subLabel: string, x: number, y: number, width: number, height: number, accent: string) {
  const fontSize = value.length >= 8 ? 76 : 88;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="rgba(0,0,0,0.76)" stroke="${accent}" stroke-width="5"/>
      <rect x="${x + 7}" y="${y + 7}" width="${width - 14}" height="46" rx="8" fill="rgba(255,255,255,0.16)"/>
      <text x="${x + width / 2}" y="${y + 40}" text-anchor="middle" class="statLabelLarge">${escapeXml(label)}</text>
      <text x="${x + width / 2}" y="${y + 128}" text-anchor="middle" class="statValueHero" style="font-size:${fontSize}px">${escapeXml(value)}</text>
      ${subLabel ? `<text x="${x + width / 2}" y="${y + height - 20}" text-anchor="middle" class="statSub">${escapeXml(subLabel)}</text>` : ""}
    </g>
  `;
}

function miniStatBox(label: string, value: string, x: number, y: number, width: number, height: number, accent: string) {
  const fontSize = value.length >= 8 ? 43 : 50;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="10" fill="rgba(0,0,0,0.68)" stroke="${accent}" stroke-width="4"/>
      <rect x="${x + 5}" y="${y + 5}" width="${width - 10}" height="38" rx="8" fill="rgba(255,255,255,0.16)"/>
      <text x="${x + width / 2}" y="${y + 32}" text-anchor="middle" class="statLabel">${escapeXml(label)}</text>
      <text x="${x + width / 2}" y="${y + 86}" text-anchor="middle" class="statValue" style="font-size:${fontSize}px">${escapeXml(value)}</text>
    </g>
  `;
}

function buildSpecShareSvg(input: SpecInput, result: SpecResult, machineImageDataUrl?: string): string {
  const theme = THEMES[Math.abs(hashText(input.name)) % THEMES.length];
  const displayName = clipText(input.name || "オリジナルスペック", 20);
  const machineDisplayName = clipText(input.name || "オリパチ", 8);
  const effectiveEntry = Math.round(result.effectiveRushEntryRate * 100);
  const rushContinuation = result.rushMode === "directLt"
    ? result.actualLtContinuationRate
    : result.actualRushContinuationRate;
  const showLt = result.regulation.supportsLt;
  const stCount = showLt && result.rushMode === "directLt" ? result.ltStCount : result.stCount;
  const lowerTitle = result.rushMode === "twoStage" ? "下位RUSH" : "電チュー";
  const upperTitle = showLt ? "上位/LT" : "上位RUSH";

  const charts = result.rushMode === "twoStage"
    ? `
      ${pieChartSvg({ title: "通常時", tiers: result.entryChartTiers, x: 250, y: 648, r: 104, compact: true, variant: "entry" })}
      ${pieChartSvg({ title: `${lowerTitle}`, tiers: result.payoutTiers, x: 585, y: 648, r: 104, compact: true, variant: "rush" })}
      ${pieChartSvg({ title: `${upperTitle}`, tiers: result.payoutTiers, x: 920, y: 648, r: 104, compact: true, variant: "rush" })}
    `
    : `
      ${pieChartSvg({ title: "通常時", tiers: result.entryChartTiers, x: 320, y: 635, r: 122, variant: "entry" })}
      ${pieChartSvg({ title: "RUSH中", tiers: result.payoutTiers, x: 820, y: 635, r: 122, variant: "rush" })}
    `;
  const machineVisual = machineImageDataUrl
    ? `
      <svg x="1132" y="186" width="396" height="548" viewBox="130 128 610 910" preserveAspectRatio="xMidYMid meet">
        <image href="${machineImageDataUrl}" x="0" y="0" width="1600" height="1200"/>
      </svg>
    `
    : `
      <rect x="1182" y="188" width="296" height="540" rx="32" fill="rgba(255,255,255,0.12)" stroke="${theme.gold}" stroke-width="7"/>
      <rect x="1210" y="220" width="240" height="476" rx="44" fill="#0b0d18" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
      <circle cx="1330" cy="458" r="168" fill="url(#machineGlow)" stroke="${theme.gold}" stroke-width="8"/>
      <circle cx="1330" cy="458" r="110" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="8"/>
      <path d="M1330 300 L1370 420 L1492 420 L1392 490 L1430 610 L1330 538 L1230 610 L1268 490 L1168 420 L1290 420 Z" fill="${theme.gold}" opacity="0.78"/>
      <circle cx="1330" cy="458" r="60" fill="#ffffff" opacity="0.92"/>
      <text x="1330" y="450" text-anchor="middle" class="machineName">P</text>
      <text x="1330" y="492" text-anchor="middle" class="machineName">${escapeXml(input.machineType === "e" ? "e" : "幻")}</text>
    `;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${theme.bgA}"/>
      <stop offset="0.55" stop-color="${theme.bgB}"/>
      <stop offset="1" stop-color="#050509"/>
    </linearGradient>
    <radialGradient id="machineGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0" stop-color="${theme.sub}" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="${theme.main}" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.25"/>
    </radialGradient>
    <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff6b0"/>
      <stop offset="0.45" stop-color="#f0b83a"/>
      <stop offset="1" stop-color="#fff6b0"/>
    </linearGradient>
    <linearGradient id="rainbowSlice" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff004c"/>
      <stop offset="0.24" stop-color="#ff8a00"/>
      <stop offset="0.42" stop-color="#ffd400"/>
      <stop offset="0.62" stop-color="#18c56e"/>
      <stop offset="0.82" stop-color="#0095e8"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${theme.gold}" flood-opacity="0.9"/>
      <feDropShadow dx="3" dy="3" stdDeviation="1" flood-color="#05101a" flood-opacity="0.9"/>
    </filter>
    <style>
      .title { font: 900 64px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #05070d; stroke-width: 10; paint-order: stroke; letter-spacing: 0; filter: url(#textGlow); }
      .subtitle { font: 900 22px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; opacity: .9; }
      .statLabel { font: 900 23px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #05070d; stroke-width: 4; paint-order: stroke; }
      .statLabelLarge { font: 900 26px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #05070d; stroke-width: 5; paint-order: stroke; }
      .statValue { font-family: "Arial Black", Impact, "Arial", sans-serif; font-weight: 900; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; fill: #ffffff; stroke: #161000; stroke-width: 5; paint-order: stroke; filter: url(#textGlow); }
      .statValueHero { font-family: "Arial Black", Impact, "Arial", sans-serif; font-weight: 900; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; fill: #ffffff; stroke: #161000; stroke-width: 7; paint-order: stroke; filter: url(#textGlow); }
      .statSub { font: 900 24px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #05070d; stroke-width: 4; paint-order: stroke; }
      .chartTitle { font: 900 27px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #061018; stroke-width: 5; paint-order: stroke; }
      .pieRate { font-family: "Arial Black", Impact, "Arial", sans-serif; font-size: 46px; font-weight: 900; font-variant-numeric: tabular-nums; fill: #ffffff; stroke: #07111d; stroke-width: 8; paint-order: stroke; }
      .pieRateSmall { font-family: "Arial Black", Impact, "Arial", sans-serif; font-size: 34px; font-weight: 900; font-variant-numeric: tabular-nums; fill: #ffffff; stroke: #07111d; stroke-width: 7; paint-order: stroke; }
      .legendText { font: 900 16px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 3; paint-order: stroke; }
      .note { font: 800 18px "Hiragino Sans", "Yu Gothic", sans-serif; fill: rgba(255,255,255,.86); }
      .brand { font: 900 36px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #061018; stroke-width: 5; paint-order: stroke; }
      .machineName { font: 900 35px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #061018; stroke-width: 7; paint-order: stroke; }
    </style>
  </defs>

  <rect width="1600" height="900" fill="url(#bg)"/>
  <g opacity="0.35">
    <circle cx="210" cy="130" r="290" fill="${theme.main}"/>
    <circle cx="1160" cy="730" r="360" fill="${theme.sub}"/>
    <path d="M0 710 C300 590 480 920 780 760 C1060 610 1230 420 1600 500 L1600 900 L0 900 Z" fill="#ffffff" opacity="0.06"/>
  </g>

  <rect x="18" y="18" width="1564" height="864" rx="18" fill="none" stroke="${theme.gold}" stroke-width="7"/>
  <rect x="34" y="34" width="1532" height="832" rx="14" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
  <rect x="50" y="142" width="1015" height="715" rx="20" fill="rgba(0,0,0,0.24)" stroke="url(#goldLine)" stroke-width="3"/>

  <text x="64" y="92" class="title">${escapeXml(displayName)}</text>
  <text x="68" y="126" class="subtitle">ORIPACHI ORIGINAL SPEC SHOWCASE / ${escapeXml(theme.name)} MODEL</text>
  <text x="1414" y="88" text-anchor="middle" class="brand">オリパチ</text>

  <g filter="url(#shadow)">
    ${heroStatBox("大当り確率", `1/${input.hitProbability}`, "", 76, 168, 300, 178, theme.gold)}
    ${heroStatBox("RUSH突入率", `${input.rushEntryRate}%`, `実質RUSH突入率 約${effectiveEntry}%`, 392, 168, 300, 178, theme.hot)}
    ${heroStatBox("RUSH継続率", `${rushContinuation}%`, "", 708, 168, 300, 178, theme.gold)}
    ${miniStatBox("RUSH中確率", `1/${result.rushProbability}`, 180, 374, 330, 104, theme.sub)}
    ${miniStatBox("ST/時短回数", `${stCount}回`, 574, 374, 330, 104, theme.gold)}
  </g>

  <g filter="url(#shadow)">
    <rect x="1108" y="142" width="444" height="715" rx="28" fill="rgba(0,0,0,0.38)" stroke="url(#goldLine)" stroke-width="5"/>
    ${machineVisual}
    <rect x="1160" y="754" width="340" height="64" rx="14" fill="rgba(0,0,0,0.65)" stroke="${theme.gold}" stroke-width="3"/>
    <text x="1330" y="797" text-anchor="middle" class="machineName">${escapeXml(machineDisplayName)}</text>
  </g>

  <g filter="url(#shadow)">
    ${charts}
  </g>

  <text x="70" y="875" class="note">※この画像はオリパチで作成したオリジナルスペックの紹介画像です。実機性能・勝敗を保証するものではありません。</text>
</svg>
  `.trim();
}

export default function SpecShareCard({ input, result }: Props) {
  const [created, setCreated] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [machineImageDataUrl, setMachineImageDataUrl] = useState<string>();
  const svg = useMemo(() => buildSpecShareSvg(input, result, machineImageDataUrl), [input, machineImageDataUrl, result]);
  const previewUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

  useEffect(() => {
    let ignore = false;
    async function loadMachineImage() {
      try {
        const response = await fetch("/assets/pachinko-free-machine.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!ignore && typeof reader.result === "string") {
            setMachineImageDataUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!ignore) setMachineImageDataUrl(undefined);
      }
    }
    loadMachineImage();
    return () => {
      ignore = true;
    };
  }, []);

  async function saveImage() {
    setDownloadMessage("");
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) {
        setDownloadMessage("画像の保存に失敗しました。");
        return;
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          setDownloadMessage("画像の保存に失敗しました。");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${input.name || "oripachi"}-spec.png`;
        link.click();
        URL.revokeObjectURL(url);
        setDownloadMessage("画像を保存しました。X投稿ではこの画像を添付してください。");
      }, "image/png");
    };
    image.onerror = () => setDownloadMessage("画像の作成に失敗しました。");
    image.src = previewUrl;
  }

  function shareToX() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ori-pachi.vercel.app";
    const text = [
      `オリパチで「${input.name}」を作りました！`,
      `大当り確率 1/${input.hitProbability}`,
      `RUSH突入率 ${input.rushEntryRate}%`,
      `RUSH継続率 ${result.rushMode === "directLt" ? result.actualLtContinuationRate : result.actualRushContinuationRate}%`,
      "スペック紹介画像も作成できます。",
    ].join("\n");
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="share-card-panel">
      <div className="share-card-header">
        <div>
          <p className="result-kicker">スペック紹介画像</p>
          <h3>公式風の紹介画像を作成</h3>
        </div>
        <button className="primary-action" onClick={() => setCreated(true)}>
          スペック紹介画像を作成
        </button>
      </div>

      <p className="share-card-lead">
        通常画像は無料で保存できます。将来的には広告を見ると高画質版や豪華テンプレートを追加で使える形にします。
      </p>

      {created && (
        <>
          <div className="share-card-preview">
            {/* The preview is a generated data URL, so Next/Image optimization is not useful here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`${input.name}のスペック紹介画像`} />
          </div>
          <div className="share-card-actions">
            <button className="secondary-action" onClick={saveImage}>
              画像を保存
            </button>
            <button className="primary-action" onClick={shareToX}>
              Xで共有
            </button>
          </div>
          <div className="share-card-upgrades">
            <span>今後追加予定</span>
            <button type="button" disabled>高画質保存</button>
            <button type="button" disabled>豪華テンプレート</button>
            <button type="button" disabled>AI台枠生成</button>
          </div>
          {downloadMessage && <p className="share-card-message">{downloadMessage}</p>}
        </>
      )}
    </section>
  );
}
