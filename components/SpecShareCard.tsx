"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PayoutTier, SpecInput, SpecResult } from "@/lib/calculator";

interface Props {
  input: SpecInput;
  result: SpecResult;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1320;
const EXPORT_SCALE = 2;

type NavigatorWithFileShare = Navigator & {
  canShare?: (data: ShareData & { files?: File[] }) => boolean;
  share?: (data: ShareData & { files?: File[] }) => Promise<void>;
};

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

const ENTRY_COLORS = ["#0095e8", "#ffd400"];
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

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function sanitizeFileName(value: string): string {
  const cleanName = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");

  return cleanName || "oripachi";
}

function isMobileSaveTarget(): boolean {
  if (typeof navigator === "undefined") return false;

  return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function renderSvgToPng(svg: string, scale = EXPORT_SCALE): Promise<Blob> {
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    image.src = svgToDataUrl(svg);
  });

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("画像の作成に失敗しました。");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("画像の保存に失敗しました。"));
      }
    }, "image/png");
  });
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

function sanitizeTiers(tiers: PayoutTier[], variant: "entry" | "rush" = "rush"): PayoutTier[] {
  return tiers
    .filter((tier) => tier.rate > 0)
    .slice()
    .sort((a, b) => {
      if (variant === "entry") {
        const score = (tier: PayoutTier) => {
          if (tier.label.includes("通常")) return 0;
          if (tier.label.includes("時短")) return 1;
          if (tier.label.includes("RUSH") || tier.label.includes("LT")) return 2;
          return 3;
        };
        return score(a) - score(b);
      }
      return a.payout - b.payout;
    });
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function tierLabel(tier: PayoutTier): string {
  const payout = tier.payout === 0 ? "0発" : `${tier.payout.toLocaleString()}発`;
  return `${tier.label} ${payout}`;
}

function payoutText(tier: PayoutTier): string {
  if (tier.payout === 0) return "0発";
  return `${tier.payout.toLocaleString()}発`;
}

function clipText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function titleFontSize(text: string): number {
  if (text.length >= 18) return 44;
  if (text.length >= 14) return 52;
  return 64;
}

function isMultiStageRush(rushMode: SpecResult["rushMode"]) {
  return rushMode === "twoStage" || rushMode === "threeStage";
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
    if (tier.label.includes("時短")) return RUSH_COLORS.orange;
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
  const tiers = sanitizeTiers(params.tiers, params.variant);
  const colors = params.variant === "entry" ? pickEntryColors(tiers) : pickRushColors(tiers);
  const total = Math.max(1, tiers.reduce((sum, tier) => sum + tier.rate, 0));
  let currentAngle = 0;

  const slices = tiers.map((tier, index) => {
    const angle = (tier.rate / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    const mid = start + angle / 2;
    const entryFixedX = tier.label.includes("通常") ? params.x - params.r * 0.5 : params.x + params.r * 0.5;
    const entryFixedY = params.y + 14;
    const labelRadius = params.r * 0.54;
    const labelPoint = params.variant === "entry"
      ? { x: entryFixedX, y: entryFixedY }
      : polarToCartesian(params.x, params.y, labelRadius, mid);
    const rate = escapeXml(`約${formatPercent(tier.rate)}`);
    const payout = escapeXml(payoutText(tier));
    const label = escapeXml(clipText(tier.label, params.compact ? 9 : 11));
    const fill = colors[index] ?? RUSH_COLORS.red;

    if (tier.rate >= 99.9) {
      return `
        <circle cx="${params.x}" cy="${params.y}" r="${params.r}" fill="${fill}" stroke="#ffffff" stroke-width="4"/>
        <text x="${params.x}" y="${params.y - 46}" text-anchor="middle" class="${params.compact ? "pieLabelSmall" : "pieLabel"}">${label}</text>
        <text x="${params.x}" y="${params.y - 12}" text-anchor="middle" class="${params.compact ? "piePayoutSmall" : "piePayout"}">${payout}</text>
        <text x="${params.x}" y="${params.y + 38}" text-anchor="middle" class="${params.compact ? "pieRateSmall" : "pieRate"}">${rate}</text>
      `;
    }

    return `
      <path d="${describeArc(params.x, params.y, params.r, start, end)}" fill="${fill}" stroke="#ffffff" stroke-width="4"/>
      ${
        angle >= 22
          ? `<text x="${labelPoint.x}" y="${labelPoint.y - 36}" text-anchor="middle" class="${params.compact ? "pieLabelSmall" : "pieLabel"}">${label}</text>
             <text x="${labelPoint.x}" y="${labelPoint.y - 8}" text-anchor="middle" class="${params.compact ? "piePayoutSmall" : "piePayout"}">${payout}</text>
             <text x="${labelPoint.x}" y="${labelPoint.y + 34}" text-anchor="middle" class="${params.compact ? "pieRateSmall" : "pieRate"}">${rate}</text>`
          : ""
      }
    `;
  }).join("");

  const legend = tiers.map((tier, index) => {
    const legendX = params.x - params.r - 44;
    const legendY = params.y + params.r + 32 + index * (params.compact ? 24 : 27);
    const labelLimit = params.compact ? 18 : 22;
    return `
    <g transform="translate(${legendX}, ${legendY})">
      <rect x="0" y="0" width="18" height="18" rx="5" fill="${colors[index] ?? RUSH_COLORS.red}"/>
      <text x="28" y="15" class="legendText">${escapeXml(clipText(tierLabel(tier), labelLimit))} / ${escapeXml(formatPercent(tier.rate))}</text>
    </g>
  `;
  }).join("");

  return `
    <g>
      <rect x="${params.x - params.r - 72}" y="${params.y - params.r - 76}" width="${params.r * 2 + 144}" height="${params.r * 2 + 240}" rx="18" fill="rgba(0,0,0,0.48)" stroke="#ffd866" stroke-width="4"/>
      <rect x="${params.x - params.r - 52}" y="${params.y - params.r - 56}" width="${params.r * 2 + 104}" height="48" rx="12" fill="rgba(240,0,53,0.88)" stroke="#ffffff" stroke-width="2"/>
      <text x="${params.x}" y="${params.y - params.r - 21}" text-anchor="middle" class="chartTitle">${escapeXml(params.title)}</text>
      ${slices}
      ${legend}
    </g>
  `;
}

function majorSpecRow(label: string, value: string, x: number, y: number, width: number, height: number, accent: string, subValue = "") {
  const labelWidth = 250;
  const fontSize = 54;
  const valueY = subValue ? y + 43 : y + height / 2 + 19;
  const subY = y + height - 10;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="rgba(255,246,210,0.9)" stroke="${accent}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${labelWidth}" height="${height}" rx="6" fill="rgba(14,8,28,0.92)" stroke="${accent}" stroke-width="3"/>
      <text x="${x + labelWidth / 2}" y="${y + height / 2 + 10}" text-anchor="middle" class="tableLabel">${escapeXml(label)}</text>
      <text x="${x + labelWidth + (width - labelWidth) / 2}" y="${valueY}" text-anchor="middle" class="tableValue" style="font-size:${fontSize}px">${escapeXml(value)}</text>
      ${subValue ? `<text x="${x + labelWidth + (width - labelWidth) / 2}" y="${subY}" text-anchor="middle" class="tableSub">${escapeXml(subValue)}</text>` : ""}
    </g>
  `;
}

function miniStatBox(label: string, value: string, x: number, y: number, width: number, height: number, accent: string) {
  const fontSize = value.length >= 8 ? 31 : 38;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="rgba(6,10,18,0.8)" stroke="${accent}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${width}" height="38" rx="6" fill="rgba(255,255,255,0.13)"/>
      <text x="${x + width / 2}" y="${y + 28}" text-anchor="middle" class="statLabel">${escapeXml(label)}</text>
      <text x="${x + width / 2}" y="${y + height - 16}" text-anchor="middle" class="statValue" style="font-size:${fontSize}px">${escapeXml(value)}</text>
    </g>
  `;
}

function buildSpecShareSvg(input: SpecInput, result: SpecResult, machineImageDataUrl?: string): string {
  const theme = THEMES[Math.abs(hashText(input.name)) % THEMES.length];
  const displayName = clipText(input.name || "オリジナルスペック", 22);
  const machineDisplayName = clipText(input.name || "オリパチ", 8);
  const headingSize = titleFontSize(displayName);
  const effectiveEntry = Math.round(result.effectiveRushEntryRate * 100);
  const rushContinuation = result.rushMode === "directLt"
    ? result.actualLtContinuationRate
    : result.actualRushContinuationRate;
  const showLt = result.regulation.supportsLt;
  const stCount = showLt && result.rushMode === "directLt" ? result.ltStCount : result.stCount;
  const lowerTitle = isMultiStageRush(result.rushMode) ? "下位RUSH" : "大当たり中";
  const upperTitle = showLt ? "上位/LT" : "上位RUSH";

  const charts = result.rushMode === "threeStage"
    ? `
      ${pieChartSvg({ title: "通常時", tiers: result.entryChartTiers, x: 220, y: 860, r: 108, compact: true, variant: "entry" })}
      ${pieChartSvg({ title: "中位RUSH", tiers: result.payoutTiers, x: 540, y: 860, r: 108, compact: true, variant: "rush" })}
      ${pieChartSvg({ title: `${upperTitle}`, tiers: result.payoutTiers, x: 860, y: 860, r: 108, compact: true, variant: "rush" })}
    `
    : result.rushMode === "twoStage"
      ? `
      ${pieChartSvg({ title: "通常時", tiers: result.entryChartTiers, x: 220, y: 860, r: 108, compact: true, variant: "entry" })}
      ${pieChartSvg({ title: `${lowerTitle}`, tiers: result.payoutTiers, x: 540, y: 860, r: 108, compact: true, variant: "rush" })}
      ${pieChartSvg({ title: `${upperTitle}`, tiers: result.payoutTiers, x: 860, y: 860, r: 108, compact: true, variant: "rush" })}
    `
      : `
      ${pieChartSvg({ title: "通常時", tiers: result.entryChartTiers, x: 300, y: 860, r: 136, variant: "entry" })}
      ${pieChartSvg({ title: "大当たり中", tiers: result.payoutTiers, x: 780, y: 860, r: 136, variant: "rush" })}
    `;
  const machineVisual = machineImageDataUrl
    ? `
      <svg x="1138" y="254" width="372" height="620" viewBox="130 128 610 910" preserveAspectRatio="xMidYMid meet">
        <image href="${machineImageDataUrl}" x="0" y="0" width="1600" height="1200"/>
      </svg>
    `
    : `
      <rect x="1182" y="254" width="296" height="620" rx="32" fill="rgba(255,255,255,0.12)" stroke="${theme.gold}" stroke-width="7"/>
      <rect x="1210" y="286" width="240" height="556" rx="44" fill="#0b0d18" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
      <circle cx="1330" cy="560" r="150" fill="url(#machineGlow)" stroke="${theme.gold}" stroke-width="8"/>
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
      .statLabel { font: 900 22px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #05070d; stroke-width: 4; paint-order: stroke; }
      .tableLabel { font: 900 28px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #05070d; stroke-width: 5; paint-order: stroke; }
      .tableValue { font-family: "Arial Black", Impact, "Hiragino Sans", "Yu Gothic", sans-serif; font-weight: 900; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; fill: #5b1010; stroke: rgba(255,255,255,0.62); stroke-width: 2; paint-order: stroke; }
      .tableSub { font: 900 17px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #7b1313; }
      .statValue { font-family: "Arial Black", Impact, "Arial", sans-serif; font-weight: 900; font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; fill: #ffffff; stroke: #161000; stroke-width: 5; paint-order: stroke; filter: url(#textGlow); }
      .chartTitle { font: 900 27px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #061018; stroke-width: 5; paint-order: stroke; }
      .pieLabel { font: 900 28px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 6; paint-order: stroke; }
      .pieLabelSmall { font: 900 21px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 5; paint-order: stroke; }
      .pieRate { font-family: "Arial Black", Impact, "Arial", sans-serif; font-size: 42px; font-weight: 900; font-variant-numeric: tabular-nums; fill: #ffffff; stroke: #07111d; stroke-width: 8; paint-order: stroke; }
      .pieRateSmall { font-family: "Arial Black", Impact, "Arial", sans-serif; font-size: 30px; font-weight: 900; font-variant-numeric: tabular-nums; fill: #ffffff; stroke: #07111d; stroke-width: 7; paint-order: stroke; }
      .piePayout { font: 900 21px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 5; paint-order: stroke; }
      .piePayoutSmall { font: 900 15px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 4; paint-order: stroke; }
      .legendText { font: 900 15px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 3; paint-order: stroke; }
      .note { font: 800 18px "Hiragino Sans", "Yu Gothic", sans-serif; fill: rgba(255,255,255,.9); }
      .brand { font: 900 36px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #061018; stroke-width: 5; paint-order: stroke; }
      .machineName { font: 900 35px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #061018; stroke-width: 7; paint-order: stroke; }
    </style>
  </defs>

  <rect width="1600" height="1320" fill="url(#bg)"/>
  <g opacity="0.35">
    <circle cx="210" cy="130" r="290" fill="${theme.main}"/>
    <circle cx="1160" cy="730" r="360" fill="${theme.sub}"/>
    <path d="M0 1030 C300 860 480 1250 780 1060 C1060 860 1230 670 1600 790 L1600 1320 L0 1320 Z" fill="#ffffff" opacity="0.06"/>
  </g>

  <rect x="18" y="18" width="1564" height="1284" rx="18" fill="none" stroke="${theme.gold}" stroke-width="7"/>
  <rect x="34" y="34" width="1532" height="1252" rx="14" fill="none" stroke="rgba(255,255,255,0.48)" stroke-width="2"/>
  <rect x="50" y="142" width="1015" height="1115" rx="20" fill="rgba(0,0,0,0.24)" stroke="url(#goldLine)" stroke-width="3"/>

  <text x="64" y="92" class="title" style="font-size:${headingSize}px">${escapeXml(displayName)}</text>
  <text x="68" y="126" class="subtitle">ORIPACHI ORIGINAL SPEC SHOWCASE / ${escapeXml(theme.name)} MODEL</text>
  <text x="1414" y="88" text-anchor="middle" class="brand">オリパチ</text>

  <g filter="url(#shadow)">
    <rect x="82" y="166" width="625" height="258" rx="12" fill="rgba(8,7,18,0.72)" stroke="url(#goldLine)" stroke-width="4"/>
    ${majorSpecRow("大当り確率", `1/${input.hitProbability}`, 102, 190, 585, 62, theme.gold)}
    ${majorSpecRow("RUSH突入率", `${input.rushEntryRate}%`, 102, 263, 585, 82, theme.hot, `実質RUSH突入率 約${effectiveEntry}%`)}
    ${majorSpecRow("RUSH継続率", `${rushContinuation}%`, 102, 350, 585, 62, theme.gold)}
    <rect x="82" y="452" width="625" height="118" rx="12" fill="rgba(8,7,18,0.72)" stroke="url(#goldLine)" stroke-width="4"/>
    ${miniStatBox("RUSH中確率", `1/${result.rushProbability}`, 116, 468, 255, 84, theme.sub)}
    ${miniStatBox("ST/時短回数", `${stCount}回`, 418, 468, 255, 84, theme.gold)}
  </g>

  <g filter="url(#shadow)">
    <rect x="1108" y="142" width="444" height="1115" rx="28" fill="rgba(0,0,0,0.38)" stroke="url(#goldLine)" stroke-width="5"/>
    ${machineVisual}
    <rect x="1160" y="1110" width="340" height="64" rx="14" fill="rgba(0,0,0,0.65)" stroke="${theme.gold}" stroke-width="3"/>
    <text x="1330" y="1153" text-anchor="middle" class="machineName">${escapeXml(machineDisplayName)}</text>
  </g>

  <g filter="url(#shadow)">
    ${charts}
  </g>

  <rect x="62" y="1205" width="1015" height="38" rx="8" fill="rgba(0,0,0,0.62)"/>
  <text x="78" y="1229" class="note">※この画像はオリパチで作成したオリジナルスペックの紹介画像です。実機性能・勝敗を保証するものではありません。</text>
</svg>
  `.trim();
}

export default function SpecShareCard({ input, result }: Props) {
  const [created, setCreated] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [machineImageDataUrl, setMachineImageDataUrl] = useState<string>();
  const [previewPngUrl, setPreviewPngUrl] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const previewObjectUrlRef = useRef<string | null>(null);
  const svg = useMemo(() => buildSpecShareSvg(input, result, machineImageDataUrl), [input, machineImageDataUrl, result]);
  const svgPreviewUrl = useMemo(() => svgToDataUrl(svg), [svg]);
  const previousSvgRef = useRef(svg);

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

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previousSvgRef.current === svg) return;

    previousSvgRef.current = svg;
    setPreviewBlob(null);
    setPreviewPngUrl("");

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, [svg]);

  function updatePreviewBlob(blob: Blob) {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }

    const nextUrl = URL.createObjectURL(blob);
    previewObjectUrlRef.current = nextUrl;
    setPreviewBlob(blob);
    setPreviewPngUrl(nextUrl);
  }

  async function createShareImage() {
    setDownloadMessage("");
    setCreated(true);
    setIsRendering(true);

    try {
      const blob = await renderSvgToPng(svg);
      updatePreviewBlob(blob);
    } catch {
      setDownloadMessage("画像の作成に失敗しました。もう一度お試しください。");
    } finally {
      setIsRendering(false);
    }
  }

  async function saveImage() {
    setDownloadMessage("");
    setIsRendering(true);

    try {
      const blob = previewBlob ?? await renderSvgToPng(svg);
      if (!previewBlob) {
        updatePreviewBlob(blob);
      }

      const fileName = `${sanitizeFileName(input.name || "oripachi")}-spec.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      const shareNavigator = navigator as NavigatorWithFileShare;

      if (isMobileSaveTarget() && shareNavigator.canShare?.({ files: [file] }) && shareNavigator.share) {
        await shareNavigator.share({
          files: [file],
          title: `${input.name}のスペック紹介画像`,
          text: "オリパチで作成したスペック紹介画像です。",
        });
        setDownloadMessage("共有シートから画像を保存できます。X投稿ではこの画像を添付してください。");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadMessage("高画質画像を保存しました。X投稿ではこの画像を添付してください。");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setDownloadMessage("保存をキャンセルしました。");
        return;
      }

      setDownloadMessage("画像の保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsRendering(false);
    }
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
        <button className="primary-action" onClick={createShareImage} disabled={isRendering}>
          {isRendering ? "画像を作成中" : "スペック紹介画像を作成"}
        </button>
      </div>

      {created && (
        <>
          <div className="share-card-preview">
            {/* The preview is a generated data URL, so Next/Image optimization is not useful here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPngUrl || svgPreviewUrl}
              width={CANVAS_WIDTH * EXPORT_SCALE}
              height={CANVAS_HEIGHT * EXPORT_SCALE}
              alt={`${input.name}のスペック紹介画像`}
            />
            {isRendering && <div className="share-card-rendering">高画質画像を作成中です</div>}
          </div>
          <div className="share-card-actions">
            <button className="secondary-action" onClick={saveImage} disabled={isRendering}>
              高画質で保存
            </button>
            <button className="primary-action" onClick={shareToX}>
              Xで共有
            </button>
          </div>
          {downloadMessage && <p className="share-card-message">{downloadMessage}</p>}
        </>
      )}
    </section>
  );
}
