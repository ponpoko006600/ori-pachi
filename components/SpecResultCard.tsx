"use client";

import { useRouter } from "next/navigation";
import { SpecInput, SpecResult } from "@/lib/calculator";

interface Props {
  input: SpecInput;
  result: SpecResult;
}

const CALC_LABEL: Record<string, string> = {
  A: "一撃重視",
  B: "チャンス重視",
  C: "バランス",
};

export default function SpecResultCard({ input, result }: Props) {
  const router = useRouter();

  if (result.error) {
    return (
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)" }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-bold text-red-400 mb-1">総量規定により実現できません</h3>
            <p className="text-white/70 text-sm">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  function handleSimulate() {
    const params = new URLSearchParams({
      machineType: input.machineType,
      hitProbability: String(input.hitProbability),
      continuationRate: String(input.continuationRate),
      calculationType: input.calculationType,
      name: input.name,
    });
    router.push(`/simulate?${params.toString()}`);
  }

  const { rate3r, rate10r, rate16r } = result.roundDistribution;

  return (
    <div className="glow-border-cyan rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
      {/* Header */}
      <div className="px-6 py-4 text-center" style={{ background: "linear-gradient(135deg, rgba(255,45,120,0.2), rgba(0,229,255,0.2))" }}>
        <div className="text-2xl mb-1">🎰</div>
        <h2 className="text-xl font-bold">「{input.name}」</h2>
        <p className="text-white/40 text-xs mt-1">あなたのオリジナル台</p>
      </div>

      <div className="p-6 space-y-5">
        {/* メインスペック */}
        <div>
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">📊 メインスペック</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="機種タイプ" value={input.machineType === "e" ? "e機（スマパチ）" : "P機"} />
            <StatItem label="RUSH中確率" value={`1/${result.rushProbability}`} highlight />
            <StatItem label="大当たり確率" value={`1/${input.hitProbability}`} highlight />
            <StatItem label="LT継続率" value={`${input.continuationRate}%`} highlight />
            <StatItem label="ST/時短回数" value={`${result.stCount}回`} />
            <StatItem label="計算タイプ" value={CALC_LABEL[input.calculationType]} />
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* 自動計算結果 */}
        <div>
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">📈 自動計算結果</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatItem label="LT突入率" value={`約${Math.round(result.ltEntryRate * 100)}%`} highlight color="cyan" />
            <StatItem label="期待連チャン数" value={`${result.avgChain}連`} highlight color="cyan" />
            <StatItem label="1連あたり出玉" value={`約${result.avgPayoutPerChain.toLocaleString()}個`} />
            <StatItem label="LT期待出玉" value={`約${result.avgLtPayout.toLocaleString()}個`} highlight color="gold" />
            <StatItem label="初当たり出玉" value={`約${result.initialPayout.toLocaleString()}個`} />
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* ラウンド振り分け */}
        <div>
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">🎲 RUSH中の出玉振り分け</h3>
          <div className="space-y-2">
            {rate3r > 0 && (
              <RoundBar label="🥉 約450個（3R）" rate={rate3r} color="#6b7280" />
            )}
            {rate10r > 0 && (
              <RoundBar label="🥈 約1,500個（10R）" rate={rate10r} color="#0891b2" />
            )}
            {rate16r > 0 && (
              <RoundBar label="🥇 約2,400個（16R）" rate={rate16r} color="#d97706" />
            )}
          </div>
        </div>

        {/* ボタン */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleSimulate}
            className="py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #0891b2, #6366f1)", boxShadow: "0 0 15px rgba(8,145,178,0.3)" }}
          >
            🎲 シミュレート
          </button>
          <button
            className="py-3 rounded-xl font-bold text-sm text-white/60 transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={() => alert("URL共有機能は次のフェーズで実装予定です")}
          >
            🔗 URLコピー
          </button>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, highlight, color }: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: "cyan" | "gold";
}) {
  const valueClass = highlight
    ? color === "cyan" ? "neon-cyan font-bold text-lg"
    : color === "gold" ? "neon-gold font-bold text-lg"
    : "neon-pink font-bold text-lg"
    : "text-white font-semibold";

  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

function RoundBar({ label, rate, color }: { label: string; rate: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/60 w-36 shrink-0">{label}</span>
      <div className="flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", height: "8px" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-white/80 w-10 text-right">{Math.round(rate * 100)}%</span>
    </div>
  );
}
