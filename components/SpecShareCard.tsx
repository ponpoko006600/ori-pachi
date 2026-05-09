"use client";

import { useMemo, useState } from "react";
import { calculateBorder, PayoutTier, SpecInput, SpecResult } from "@/lib/calculator";

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

const PIE_COLORS = ["#008de8", "#ec002f", "#ff8a00", "#cf10d2", "#18b86e", "#ffd400"];

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
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
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

function formatBalls(value: number): string {
  return `${Math.round(value).toLocaleString()}発`;
}

function tierLabel(tier: PayoutTier): string {
  const payout = tier.payout === 0 ? "0発" : `${tier.payout.toLocaleString()}発`;
  return `${tier.label} ${payout}`;
}

function clipText(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function pieChartSvg(params: {
  title: string;
  tiers: PayoutTier[];
  x: number;
  y: number;
  r: number;
  compact?: boolean;
}) {
  const tiers = sanitizeTiers(params.tiers);
  const total = Math.max(1, tiers.reduce((sum, tier) => sum + tier.rate, 0));
  let currentAngle = 0;

  const slices = tiers.map((tier, index) => {
    const angle = (tier.rate / total) * 360;
    const start = currentAngle;
    const end = currentAngle + angle;
    currentAngle = end;
    const mid = start + angle / 2;
    const labelRadius = params.r * (angle < 32 ? 1.05 : 0.58);
    const labelPoint = polarToCartesian(params.x, params.y, labelRadius, mid);
    const label = escapeXml(tierLabel(tier));
    const rate = escapeXml(`${formatPercent(tier.rate)}`);

    if (tier.rate >= 99.9) {
      return `
        <circle cx="${params.x}" cy="${params.y}" r="${params.r}" fill="${PIE_COLORS[index % PIE_COLORS.length]}" stroke="#ffffff" stroke-width="4"/>
        <text x="${params.x}" y="${params.y - 12}" text-anchor="middle" class="pieText">${label}</text>
        <text x="${params.x}" y="${params.y + 46}" text-anchor="middle" class="pieRate">${rate}</text>
      `;
    }

    return `
      <path d="${describeArc(params.x, params.y, params.r, start, end)}" fill="${PIE_COLORS[index % PIE_COLORS.length]}" stroke="#ffffff" stroke-width="4"/>
      ${
        angle >= 18
          ? `<text x="${labelPoint.x}" y="${labelPoint.y - 8}" text-anchor="middle" class="${params.compact ? "pieTextSmall" : "pieText"}">${label}</text>
             <text x="${labelPoint.x}" y="${labelPoint.y + 34}" text-anchor="middle" class="${params.compact ? "pieRateSmall" : "pieRate"}">${rate}</text>`
          : ""
      }
    `;
  }).join("");

  const legend = tiers.map((tier, index) => `
    <g transform="translate(${params.x - params.r}, ${params.y + params.r + 30 + index * 30})">
      <rect x="0" y="0" width="18" height="18" rx="5" fill="${PIE_COLORS[index % PIE_COLORS.length]}"/>
      <text x="28" y="15" class="legendText">${escapeXml(tierLabel(tier))} / ${escapeXml(formatPercent(tier.rate))}</text>
    </g>
  `).join("");

  return `
    <g>
      <rect x="${params.x - params.r - 34}" y="${params.y - params.r - 68}" width="${params.r * 2 + 68}" height="${params.r * 2 + 48}" rx="18" fill="rgba(255,255,255,0.08)" stroke="#e9c85d" stroke-width="3"/>
      <text x="${params.x}" y="${params.y - params.r - 28}" text-anchor="middle" class="chartTitle">${escapeXml(params.title)}</text>
      ${slices}
      ${legend}
    </g>
  `;
}

function statBox(label: string, value: string, x: number, y: number, width: number, height: number, accent: string) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="rgba(6,10,18,0.72)" stroke="${accent}" stroke-width="3"/>
      <rect x="${x}" y="${y}" width="${width}" height="38" rx="14" fill="rgba(255,255,255,0.12)"/>
      <text x="${x + width / 2}" y="${y + 27}" text-anchor="middle" class="statLabel">${escapeXml(label)}</text>
      <text x="${x + width / 2}" y="${y + 92}" text-anchor="middle" class="statValue">${escapeXml(value)}</text>
    </g>
  `;
}

function buildSpecShareSvg(input: SpecInput, result: SpecResult): string {
  const theme = THEMES[Math.abs(hashText(input.name)) % THEMES.length];
  const border = calculateBorder(input, result);
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
      ${pieChartSvg({ title: "ヘソ・割合", tiers: result.entryChartTiers, x: 310, y: 610, r: 128, compact: true })}
      ${pieChartSvg({ title: `${lowerTitle}・割合`, tiers: result.payoutTiers, x: 660, y: 610, r: 128, compact: true })}
      ${pieChartSvg({ title: `${upperTitle}・割合`, tiers: result.payoutTiers, x: 1010, y: 610, r: 128, compact: true })}
    `
    : `
      ${pieChartSvg({ title: "ヘソ・割合", tiers: result.entryChartTiers, x: 390, y: 610, r: 142 })}
      ${pieChartSvg({ title: "電チュー・割合", tiers: result.payoutTiers, x: 860, y: 610, r: 142 })}
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
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.65"/>
    </filter>
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="${theme.gold}" flood-opacity="0.9"/>
      <feDropShadow dx="3" dy="3" stdDeviation="1" flood-color="#05101a" flood-opacity="0.9"/>
    </filter>
    <style>
      .title { font: 900 72px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #061018; stroke-width: 8; paint-order: stroke; letter-spacing: 0; }
      .subtitle { font: 800 24px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; opacity: .88; }
      .statLabel { font: 900 24px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; }
      .statValue { font: 900 58px Georgia, "Times New Roman", serif; fill: #ffffff; filter: url(#textGlow); }
      .chartTitle { font: 900 30px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #061018; stroke-width: 4; paint-order: stroke; }
      .pieText { font: 900 28px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 7; paint-order: stroke; }
      .pieRate { font: 900 42px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 8; paint-order: stroke; }
      .pieTextSmall { font: 900 21px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 6; paint-order: stroke; }
      .pieRateSmall { font: 900 32px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; stroke: #07111d; stroke-width: 7; paint-order: stroke; }
      .legendText { font: 800 18px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; }
      .note { font: 700 20px "Hiragino Sans", "Yu Gothic", sans-serif; fill: rgba(255,255,255,.78); }
      .brand { font: 900 30px "Hiragino Sans", "Yu Gothic", sans-serif; fill: #ffffff; opacity: .88; }
      .machineName { font: 900 42px "Hiragino Sans", "Yu Gothic", sans-serif; fill: ${theme.gold}; stroke: #061018; stroke-width: 7; paint-order: stroke; }
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

  <text x="64" y="94" class="title">${escapeXml(displayName)}</text>
  <text x="68" y="128" class="subtitle">ORIPACHI ORIGINAL SPEC SHOWCASE / ${escapeXml(theme.name)} MODEL</text>
  <text x="1428" y="78" text-anchor="middle" class="brand">オリパチ</text>

  <g filter="url(#shadow)">
    ${statBox("大当り確率", `1/${input.hitProbability}`, 64, 158, 285, 124, theme.gold)}
    ${statBox("RUSH突入率", `${input.rushEntryRate}%`, 365, 158, 285, 124, theme.hot)}
    ${statBox("実質RUSH突入率", `約${effectiveEntry}%`, 666, 158, 285, 124, theme.sub)}
    ${statBox(result.rushMode === "directLt" ? "LT継続率" : "RUSH継続率", `${rushContinuation}%`, 64, 300, 285, 124, theme.gold)}
    ${statBox(showLt ? "LT継続率" : "継続率上限", `${showLt ? result.actualLtContinuationRate : result.regulation.maxContinuationRate}%`, 365, 300, 285, 124, theme.gold)}
    ${statBox("初当り期待出玉", `約${formatBalls(border.avgTotalPayoutBalls)}`, 666, 300, 285, 124, theme.sub)}
    ${statBox("右打ち中確率", `1/${result.rushProbability}`, 967, 158, 245, 124, theme.sub)}
    ${statBox("ST/時短回数", `${stCount}回`, 967, 300, 245, 124, theme.gold)}
  </g>

  <g filter="url(#shadow)">
    <rect x="1268" y="130" width="260" height="680" rx="32" fill="rgba(255,255,255,0.12)" stroke="${theme.gold}" stroke-width="7"/>
    <rect x="1292" y="158" width="212" height="624" rx="44" fill="#0b0d18" stroke="rgba(255,255,255,0.35)" stroke-width="4"/>
    <circle cx="1398" cy="464" r="188" fill="url(#machineGlow)" stroke="${theme.gold}" stroke-width="8"/>
    <circle cx="1398" cy="464" r="130" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="8"/>
    <path d="M1398 286 L1446 418 L1586 418 L1472 500 L1518 632 L1398 552 L1278 632 L1324 500 L1210 418 L1350 418 Z" fill="${theme.gold}" opacity="0.78"/>
    <circle cx="1398" cy="464" r="68" fill="#ffffff" opacity="0.92"/>
    <text x="1398" y="455" text-anchor="middle" class="machineName">P</text>
    <text x="1398" y="500" text-anchor="middle" class="machineName">${escapeXml(input.machineType === "e" ? "e" : "幻")}</text>
    <text x="1398" y="728" text-anchor="middle" class="machineName">${escapeXml(machineDisplayName)}</text>
    <circle cx="1320" cy="206" r="20" fill="${theme.main}" stroke="#ffffff" stroke-width="3"/>
    <circle cx="1476" cy="206" r="20" fill="${theme.hot}" stroke="#ffffff" stroke-width="3"/>
    <circle cx="1320" cy="738" r="20" fill="${theme.hot}" stroke="#ffffff" stroke-width="3"/>
    <circle cx="1476" cy="738" r="20" fill="${theme.main}" stroke="#ffffff" stroke-width="3"/>
  </g>

  <g filter="url(#shadow)">
    ${charts}
  </g>

  <text x="64" y="852" class="note">※この画像はオリパチで作成したオリジナルスペックの紹介画像です。実機性能・勝敗を保証するものではありません。</text>
</svg>
  `.trim();
}

export default function SpecShareCard({ input, result }: Props) {
  const [created, setCreated] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const svg = useMemo(() => buildSpecShareSvg(input, result), [input, result]);
  const previewUrl = useMemo(() => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, [svg]);

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
