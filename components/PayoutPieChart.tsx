"use client";

import { useId } from "react";
import { PayoutTier } from "@/lib/calculator";

interface Props {
  title: string;
  tiers: PayoutTier[];
  stLabel: string;
}

const ENTRY_COLORS = {
  normal: "#0095e8",
  entry: "#ffd400",
  other: "#ff9800",
};
const RUSH_COLORS = {
  blue: "#0095e8",
  yellow: "#ffd400",
  green: "#18c56e",
  red: "#f00035",
};

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function formatPayout(tier: PayoutTier) {
  if (tier.payout === 0) return "0個";
  return `約${tier.payout.toLocaleString()}個`;
}

function pickRushColors(tiers: PayoutTier[], rainbowFill: string): string[] {
  if (tiers.length === 1) {
    return tiers[0].payout === 0 ? [RUSH_COLORS.blue] : [rainbowFill];
  }

  const paidTiers = tiers.filter((tier) => tier.payout > 0);
  const paidColors = paidTiers.length === 1
    ? [RUSH_COLORS.red]
    : paidTiers.length === 2
      ? [RUSH_COLORS.yellow, RUSH_COLORS.red]
      : paidTiers.length === 3
        ? [RUSH_COLORS.yellow, RUSH_COLORS.red, rainbowFill]
        : [RUSH_COLORS.yellow, RUSH_COLORS.green, RUSH_COLORS.red, rainbowFill];

  let paidIndex = 0;
  return tiers.map((tier) => {
    if (tier.payout === 0) return RUSH_COLORS.blue;
    const color = paidColors[Math.min(paidIndex, paidColors.length - 1)];
    paidIndex += 1;
    return color;
  });
}

export default function PayoutPieChart({ title, tiers, stLabel }: Props) {
  const rainbowId = useId().replace(/:/g, "");
  const isEntryChart = title.includes("ヘソ") || title.includes("通常時");
  const normalized = tiers
    .filter((tier) => tier.rate > 0)
    .sort((a, b) => {
      if (isEntryChart) {
        const score = (tier: PayoutTier) => {
          if (tier.label.includes("通常")) return 0;
          if (tier.label.includes("時短")) return 1;
          if (tier.label.includes("RUSH") || tier.label.includes("LT")) return 2;
          return 3;
        };
        return score(a) - score(b);
      }
      return a.payout - b.payout || a.rate - b.rate;
    });
  const rushColors = pickRushColors(normalized, `url(#${rainbowId})`);
  const colorForTier = (tier: PayoutTier, index: number) => {
    if (!isEntryChart) return rushColors[index] ?? RUSH_COLORS.red;
    if (tier.label.includes("通常")) return ENTRY_COLORS.normal;
    if (tier.label.includes("時短")) return ENTRY_COLORS.other;
    if (tier.label.includes("RUSH") || tier.label.includes("LT")) return ENTRY_COLORS.entry;
    return ENTRY_COLORS.other;
  };
  const slices = normalized.reduce<Array<{ tier: PayoutTier; start: number; end: number; color: string }>>((items, tier, index) => {
    const previousEnd = items[index - 1]?.end ?? 0;
    const end = previousEnd - (tier.rate / 100) * 360;
    return [...items, { tier, start: previousEnd, end, color: colorForTier(tier, index) }];
  }, []);

  return (
    <div className="payout-chart">
      <div className="payout-chart-title">{title}</div>
      <div className="payout-chart-inner">
        <svg viewBox="0 0 420 420" role="img" aria-label={`${title}の円グラフ`} className="payout-chart-svg">
          <defs>
            <linearGradient id={rainbowId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff004c" />
              <stop offset="0.24" stopColor="#ff8a00" />
              <stop offset="0.42" stopColor="#ffd400" />
              <stop offset="0.62" stopColor="#18c56e" />
              <stop offset="0.82" stopColor="#0095e8" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <circle cx="210" cy="210" r="156" fill="#dcecf7" />
          {slices.map(({ tier, start, end, color }) => (
            tier.rate >= 99.9 ? (
              <circle key={tier.id} cx="210" cy="210" r="156" fill={color} />
            ) : (
              <path
                key={tier.id}
                d={describeArc(210, 210, 156, start, end)}
                fill={color}
              />
            )
          ))}
          {slices.map(({ tier, start, end, color }, index) => {
            const mid = start + (end - start) / 2;
            const isSmall = tier.rate < 12;
            const radius = isSmall ? 132 : tier.rate > 45 ? 66 : 92;
            const label = isEntryChart
              ? {
                  x: tier.label.includes("通常") ? 135 : 285,
                  y: 214,
                }
              : polarToCartesian(210, 210, radius, mid);
            const marker = polarToCartesian(210, 210, 142, mid);
            const fontSize = isEntryChart ? 22 : tier.rate > 45 ? 25 : tier.rate > 24 ? 22 : 18;
            const labelFill = isEntryChart && !tier.label.includes("通常") ? "#111827" : color;

            if (isSmall) {
              return (
                <g key={`${tier.id}-marker`}>
                  <circle cx={marker.x} cy={marker.y} r="16" fill="white" stroke={color} strokeWidth="5" />
                  <text x={marker.x} y={marker.y + 6} textAnchor="middle" className="pie-marker">
                    {index + 1}
                  </text>
                </g>
              );
            }

            return (
              <g key={`${tier.id}-label`}>
                <text x={label.x} y={label.y - 24} textAnchor="middle" className="pie-label" style={{ fontSize }} fill={labelFill}>
                  {tier.label}
                </text>
                <text x={label.x} y={label.y + 2} textAnchor="middle" className="pie-label sub" style={{ fontSize: fontSize - 5 }} fill={labelFill}>
                  {formatPayout(tier)}
                </text>
                <rect x={label.x - 50} y={label.y + 14} width="100" height="24" rx="4" fill="black" />
                <text x={label.x} y={label.y + 32} textAnchor="middle" className="pie-badge" style={{ fontSize: 15 }}>
                  {stLabel}
                </text>
                <text x={label.x} y={label.y + 60} textAnchor="middle" className="pie-label rate" style={{ fontSize: fontSize + 2 }} fill={labelFill}>
                  ...約{tier.rate}%
                </text>
              </g>
            );
          })}
        </svg>
        <div className="payout-legend">
          {normalized.map((tier, index) => (
            <div key={`${tier.id}-legend`} className="payout-legend-item">
              <span className="legend-index" style={{ borderColor: colorForTier(tier, index), color: colorForTier(tier, index) }}>
                {index + 1}
              </span>
              <strong>{tier.label}</strong>
              <small>{formatPayout(tier)} / {tier.rate}%{tier.bonusCount > 1 ? ` / 内部${tier.bonusCount}回` : ""}</small>
            </div>
          ))}
        </div>
      </div>
      <p className="payout-chart-note">※払い出し出玉。数値は入力スペックに基づく試算です。</p>
    </div>
  );
}
