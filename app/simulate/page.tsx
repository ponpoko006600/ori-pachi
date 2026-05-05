"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { calculateSpec, calculateBorder, SpecInput, MachineType, HitProbability, CalculationType } from "@/lib/calculator";
import { runSimulation, SimulationResult } from "@/lib/simulator";
import BorderAnalyzer from "@/components/BorderAnalyzer";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

function SimulatePage() {
  const params = useSearchParams();
  const router = useRouter();

  const input: SpecInput = {
    machineType: (params.get("machineType") || "e") as MachineType,
    hitProbability: Number(params.get("hitProbability") || 319) as HitProbability,
    continuationRate: Number(params.get("continuationRate") || 85),
    calculationType: (params.get("calculationType") || "C") as CalculationType,
    name: params.get("name") || "オリジナル台",
  };

  const spec = calculateSpec(input);
  const border = !spec.error ? calculateBorder(input, spec) : null;

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  function handleSimulate() {
    setRunning(true);
    setProgress(0);
    setSimResult(null);

    setTimeout(() => {
      const result = runSimulation(input, spec, 10000, (current) => {
        setProgress(current);
      });
      setSimResult(result);
      setRunning(false);
      setProgress(10000);
    }, 50);
  }

  const balanceData = simResult?.balanceHistory.map((v, i) => ({
    x: i,
    balance: Math.round(v),
  })) || [];

  const chainData = simResult
    ? Object.entries(simResult.chainDistribution)
        .map(([k, v]) => ({ chain: `${k}連`, count: v }))
        .sort((a, b) => parseInt(a.chain) - parseInt(b.chain))
        .slice(0, 20)
    : [];

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f1a 100%)" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white text-sm">← 戻る</button>
        <span className="text-xl">🎰</span>
        <span className="font-bold neon-pink">PachiSpec</span>
        <span className="text-white/40 text-sm">シミュレーター</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* スペック概要 */}
        <div className="glow-border rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
          <h2 className="font-bold mb-3">「{input.name}」のシミュレーター</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-white/40">大当たり</div>
              <div className="font-bold neon-cyan">1/{input.hitProbability}</div>
            </div>
            <div>
              <div className="text-xs text-white/40">継続率</div>
              <div className="font-bold neon-gold">{input.continuationRate}%</div>
            </div>
            <div>
              <div className="text-xs text-white/40">LT突入率</div>
              <div className="font-bold neon-pink">{Math.round(spec.ltEntryRate * 100)}%</div>
            </div>
          </div>
        </div>

        {/* ボーダー分析 */}
        {border && (
          <BorderAnalyzer
            hitProbability={input.hitProbability}
            border={border}
          />
        )}

        {/* シミュレートボタン */}
        <button
          onClick={handleSimulate}
          disabled={running}
          className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #0891b2, #6366f1)", boxShadow: "0 0 20px rgba(8,145,178,0.3)" }}
        >
          {running ? "シミュレート中..." : "🎲 10,000回シミュレート開始"}
        </button>

        {/* 進捗 */}
        {(running || progress > 0) && (
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>シミュレート中...</span>
              <span>{progress.toLocaleString()} / 10,000</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)", height: "6px" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(progress / 10000) * 100}%`, background: "linear-gradient(to right, #0891b2, #6366f1)" }}
              />
            </div>
          </div>
        )}

        {/* 結果 */}
        {simResult && (
          <>
            {/* 数値サマリー */}
            <div className="glow-border-cyan rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">📊 シミュレーション結果</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResultStat label="総初当たり回数" value="10,000回" />
                <ResultStat label="平均出玉/初当たり" value={`${simResult.avgPayoutPerHit.toLocaleString()}円`} highlight />
                <ResultStat label="最大連チャン" value={`${simResult.maxChain}連`} highlight color="gold" />
                <ResultStat label="最大ハマり" value={`${simResult.maxHamari.toLocaleString()}回転`} />
                <ResultStat label="最終累計収支" value={`${simResult.finalBalance >= 0 ? "+" : ""}${simResult.finalBalance.toLocaleString()}円`} highlight color={simResult.finalBalance >= 0 ? "cyan" : "pink"} />
                <ResultStat label="機械割" value={`${simResult.machineRatio}%`} />
              </div>
            </div>

            {/* スランプグラフ */}
            <div className="glow-border rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">📈 スランプグラフ（累計収支）</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="x" hide />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    labelStyle={{ display: "none" }}
                    formatter={(v: number) => [`${v.toLocaleString()}円`, "収支"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#00e5ff"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 連チャン分布 */}
            <div className="glow-border rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h3 className="text-sm text-white/40 uppercase tracking-wider mb-4">🎲 連チャン分布</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chainData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="chain" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v.toLocaleString()}回`, "発生回数"]}
                  />
                  <Bar dataKey="count" fill="#ff2d78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* もう一度 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSimulate}
                className="py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #0891b2, #6366f1)" }}
              >
                🔄 もう一度
              </button>
              <button
                onClick={() => router.back()}
                className="py-3 rounded-xl font-bold text-sm text-white/60"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                ← スペックに戻る
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ResultStat({ label, value, highlight, color }: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: "cyan" | "gold" | "pink";
}) {
  const valueClass = highlight
    ? color === "gold" ? "neon-gold font-bold text-lg"
    : color === "pink" ? "neon-pink font-bold text-lg"
    : "neon-cyan font-bold text-lg"
    : "text-white font-semibold";

  return (
    <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

export default function SimulatePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">読み込み中...</div>}>
      <SimulatePage />
    </Suspense>
  );
}
