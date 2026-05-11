"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  calculateBorder,
  calculateSpec,
  DEFAULT_PAYOUT_TIERS,
  DEFAULT_TIME_SHORT,
  DEFAULT_YUTIME,
  SpecInput,
} from "@/lib/calculator";
import { runSimulation, SimulationResult } from "@/lib/simulator";
import BorderAnalyzer from "@/components/BorderAnalyzer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SIMULATION_SPINS = 2000;

function withDefaults(value: Partial<SpecInput>): SpecInput {
  return {
    name: value.name ?? "オリジナル台",
    machineType: value.machineType ?? "e",
    regulationType: value.regulationType ?? "lt",
    rushMode: value.rushMode ?? "standard",
    hitProbability: value.hitProbability ?? 319,
    rushEntryRate: value.rushEntryRate ?? 55,
    rushContinuationRate: value.rushContinuationRate ?? 72,
    middleRushEntryRate: value.middleRushEntryRate ?? 50,
    middleRushContinuationRate: value.middleRushContinuationRate ?? 80,
    upperRushEntryRate: value.upperRushEntryRate ?? 25,
    upperRushContinuationRate: value.upperRushContinuationRate ?? 81,
    ltContinuationRate: value.ltContinuationRate ?? 85,
    continuationCalcMode: value.continuationCalcMode ?? "rate",
    rightHitProbability: value.rightHitProbability ?? (value.machineType === "P" ? 99 : 79),
    rushStSpins: value.rushStSpins ?? 130,
    middleRushStSpins: value.middleRushStSpins ?? 130,
    upperRushStSpins: value.upperRushStSpins ?? 130,
    ltStSpins: value.ltStSpins ?? 163,
    nonRushTimeShort: { ...DEFAULT_TIME_SHORT, ...(value.nonRushTimeShort ?? {}) },
    initialPayout: value.initialPayout ?? 450,
    payoutTiers: (value.payoutTiers ?? DEFAULT_PAYOUT_TIERS).map((tier, index) => ({
      ...tier,
      bonusCount: tier.bonusCount ?? Math.max(1, Math.ceil((tier.payout ?? 0) / 1500)),
      id: tier.id ?? `tier-${index}`,
    })),
    yutime: { ...DEFAULT_YUTIME, ...(value.yutime ?? {}) },
    benchmark: value.benchmark,
  };
}

function getInputFromParams(params: URLSearchParams): SpecInput {
  const raw = params.get("spec");
  if (raw) {
    try {
      return withDefaults(JSON.parse(raw) as Partial<SpecInput>);
    } catch {
      try {
        return withDefaults(JSON.parse(decodeURIComponent(raw)) as Partial<SpecInput>);
      } catch {
        // fall through to default
      }
    }
  }

  return {
    name: "オリジナル台",
    machineType: "e",
    regulationType: "lt",
    rushMode: "standard",
    hitProbability: 319,
    rushEntryRate: 55,
    rushContinuationRate: 72,
    middleRushEntryRate: 50,
    middleRushContinuationRate: 80,
    upperRushEntryRate: 25,
    upperRushContinuationRate: 81,
    ltContinuationRate: 85,
    continuationCalcMode: "rate",
    rightHitProbability: 79,
    rushStSpins: 130,
    middleRushStSpins: 130,
    upperRushStSpins: 130,
    ltStSpins: 163,
    nonRushTimeShort: DEFAULT_TIME_SHORT,
    initialPayout: 450,
    payoutTiers: DEFAULT_PAYOUT_TIERS,
    yutime: DEFAULT_YUTIME,
  };
}

function SimulatePage() {
  const params = useSearchParams();
  const router = useRouter();
  const input = getInputFromParams(params);
  const spec = calculateSpec(input);
  const border = spec.check.ok ? calculateBorder(input, spec) : null;

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  function handleSimulate() {
    if (!spec.check.ok) return;
    setRunning(true);
    setProgress(0);
    setSimResult(null);

    setTimeout(() => {
      const result = runSimulation(input, spec, SIMULATION_SPINS, (current) => {
        setProgress(current);
      });
      setSimResult(result);
      setRunning(false);
      setProgress(SIMULATION_SPINS);
    }, 50);
  }

  const balanceData = simResult?.balanceHistory.map((point) => ({
    spin: point.spin,
    balance: Math.round(point.balance),
  })) || [];

  const chainData = simResult
    ? Object.entries(simResult.chainDistribution)
        .map(([chain, count]) => ({ chain: `${chain}連`, count }))
        .sort((a, b) => parseInt(a.chain) - parseInt(b.chain))
        .slice(0, 20)
    : [];

  return (
    <main className="min-h-screen app-bg">
      <header className="app-header">
        <button onClick={() => router.back()} className="back-button">戻る</button>
        <span className="brand-mark">P</span>
        <div>
          <span className="brand-name">PachiSpec</span>
          <span className="brand-sub">シミュレーター</span>
        </div>
      </header>

      <div className="simulate-shell">
        <section className="result-shell">
          <div className="result-header">
            <div>
              <p className="result-kicker">{spec.regulation.label}</p>
              <h2>「{input.name}」のシミュレーター</h2>
            </div>
            <div className={spec.check.ok ? "status-pill ok" : "status-pill warn"}>
              {spec.check.ok ? "実行可能" : "要調整"}
            </div>
          </div>
          <div className="result-body">
            <div className="stat-grid">
              <ResultStat label="大当たり" value={`1/${input.hitProbability}`} highlight />
              <ResultStat label="RUSH突入" value={`${input.rushEntryRate}%`} highlight />
              {spec.rushMode !== "directLt" && <ResultStat label="RUSH継続" value={`${spec.actualRushContinuationRate}%`} />}
              {spec.rushMode === "threeStage" && <ResultStat label="中位突入" value={`${input.middleRushEntryRate}%`} />}
              {spec.rushMode === "threeStage" && <ResultStat label="中位継続" value={`${spec.actualMiddleRushContinuationRate}%`} />}
              {isMultiStageRush(spec.rushMode) && <ResultStat label="上位突入" value={`${input.upperRushEntryRate}%`} />}
              {isMultiStageRush(spec.rushMode) && !spec.regulation.supportsLt && <ResultStat label="上位継続" value={`${spec.actualUpperRushContinuationRate}%`} />}
              <ResultStat label="初当たり期待" value={`約${spec.avgTotalPayout.toLocaleString()}発`} highlight color="cyan" />
              {input.nonRushTimeShort.enabled && <ResultStat label="実質RUSH突入" value={`約${Math.round(spec.effectiveRushEntryRate * 100)}%`} />}
              {spec.regulation.supportsLt && (
                <>
                  <ResultStat label="LT継続" value={`${spec.actualLtContinuationRate}%`} highlight color="gold" />
                  <ResultStat label="初当たりLT突入" value={`約${Math.round(spec.ltEntryRate * 100)}%`} />
                </>
              )}
            </div>
          </div>
        </section>

        {border && <BorderAnalyzer key={`${input.name}-${border.borderSpins}`} hitProbability={input.hitProbability} border={border} />}

        {!spec.check.ok && (
          <div className="warning-banner">
            <strong>シミュレーションできません</strong>
            <span>{spec.error}</span>
          </div>
        )}

        <button
          onClick={handleSimulate}
          disabled={running || !spec.check.ok}
          className="primary-action wide"
        >
          {running ? "シミュレート中..." : `${SIMULATION_SPINS.toLocaleString()}回転シミュレート開始`}
        </button>

        {(running || progress > 0) && (
          <div className="progress-block">
            <div className="progress-label">
              <span>進捗</span>
              <span>{progress.toLocaleString()} / {SIMULATION_SPINS.toLocaleString()}回転</span>
            </div>
            <div className="progress-track">
              <div style={{ width: `${(progress / SIMULATION_SPINS) * 100}%` }} />
            </div>
          </div>
        )}

        {simResult && (
          <>
            <section className="result-shell">
              <div className="result-body">
                <h3>シミュレーション結果</h3>
                <div className="stat-grid">
                  <ResultStat label="通常時総回転数" value={`${simResult.totalSpins.toLocaleString()}回転`} />
                  <ResultStat label="総初当たり回数" value={`${simResult.totalInitialHits.toLocaleString()}回`} />
                  <ResultStat label="RUSH突入回数" value={`${simResult.totalRushEntries.toLocaleString()}回`} />
                  <ResultStat label="平均回収/初当たり" value={`${simResult.avgPayoutPerHit.toLocaleString()}円`} highlight />
                  <ResultStat label="最大連チャン" value={`${simResult.maxChain}連`} highlight color="gold" />
                  <ResultStat label="最大ハマり" value={`${simResult.maxHamari.toLocaleString()}回転`} />
                  <ResultStat label="遊タイム突入" value={`${simResult.yutimeEntries.toLocaleString()}回`} />
                  <ResultStat label="遊タイム当選" value={`${simResult.yutimeHits.toLocaleString()}回`} />
                  <ResultStat
                    label="最終累計収支"
                    value={`${simResult.finalBalance >= 0 ? "+" : ""}${simResult.finalBalance.toLocaleString()}円`}
                    highlight
                    color={simResult.finalBalance >= 0 ? "cyan" : "pink"}
                  />
                  <ResultStat label="機械割" value={`${simResult.machineRatio}%`} />
                </div>
              </div>
            </section>

            <section className="chart-panel">
              <h3>スランプグラフ</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="spin" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                  <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141827", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}
                    labelStyle={{ display: "none" }}
                    formatter={(value) => [`${Number(value ?? 0).toLocaleString()}円`, "収支"]}
                  />
                  <Line type="monotone" dataKey="balance" stroke="#00e5ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section className="chart-panel">
              <h3>連チャン分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chainData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="chain" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#141827", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px" }}
                    formatter={(value) => [`${Number(value ?? 0).toLocaleString()}回`, "発生回数"]}
                  />
                  <Bar dataKey="count" fill="#ff2d78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <div className="create-actions">
              <button onClick={handleSimulate} className="primary-action">もう一度</button>
              <button onClick={() => router.back()} className="secondary-action">スペックに戻る</button>
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
    ? color === "gold" ? "stat-value gold"
    : color === "pink" ? "stat-value pink"
    : "stat-value cyan"
    : "stat-value";

  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}

function isMultiStageRush(rushMode: SpecInput["rushMode"]) {
  return rushMode === "twoStage" || rushMode === "threeStage";
}

export default function SimulatePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen app-bg loading-screen">読み込み中...</div>}>
      <SimulatePage />
    </Suspense>
  );
}
