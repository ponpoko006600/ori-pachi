"use client";

import { useRouter } from "next/navigation";
import { calculateBorder, SpecInput, SpecResult } from "@/lib/calculator";
import PayoutPieChart from "@/components/PayoutPieChart";
import SpecShareCard from "@/components/SpecShareCard";

interface Props {
  input: SpecInput;
  result: SpecResult;
}

function encodeSpec(input: SpecInput) {
  return encodeURIComponent(JSON.stringify(input));
}

const RUSH_MODE_LABEL = {
  standard: "直RUSH",
  directLt: "直RUSH（LT）",
  twoStage: "2段階Rush",
  threeStage: "3段階Rush",
};

export default function SpecResultCard({ input, result }: Props) {
  const router = useRouter();
  const border = calculateBorder(input, result);
  const lowerRushStLabel = `ST${result.stCount}回転`;
  const upperRushStCount = result.regulation.supportsLt
    ? result.ltStCount
    : input.upperRushStSpins || result.stCount;
  const upperRushStLabel = `ST${upperRushStCount}回転`;

  function handleSimulate() {
    router.push(`/simulate?spec=${encodeSpec(input)}`);
  }

  return (
    <div className="result-shell">
      <div className="result-header">
        <div>
          <p className="result-kicker">{result.regulation.label}</p>
          <h2>「{input.name}」</h2>
        </div>
        <div className={result.check.ok ? "status-pill ok" : "status-pill warn"}>
          {result.check.ok ? "規制内" : "要調整"}
        </div>
      </div>

      {!result.check.ok && (
        <div className="warning-banner">
          <strong>総量規制オーバー</strong>
          <span>{result.check.warnings[0]}</span>
        </div>
      )}

      <div className="result-body">
        <section>
          <h3>メインスペック</h3>
          <div className="stat-grid">
            <StatItem label="大当たり確率" value={`1/${input.hitProbability}`} highlight />
            <StatItem label="RUSH突入率" value={`${input.rushEntryRate}%`} highlight />
            {input.nonRushTimeShort.enabled && <StatItem label="実質RUSH突入率" value={`約${Math.round(result.effectiveRushEntryRate * 100)}%`} highlight color="cyan" />}
            <StatItem label="Rush構造" value={RUSH_MODE_LABEL[result.rushMode]} />
            {result.rushMode !== "directLt" && <StatItem label={isMultiStageRush(result.rushMode) ? "下位RUSH継続率" : "RUSH継続率"} value={`${result.actualRushContinuationRate}%`} />}
            {result.rushMode === "threeStage" && (
              <>
                <StatItem label="中位RUSH突入率" value={`${input.middleRushEntryRate}%`} />
                <StatItem label="中位RUSH継続率" value={`${result.actualMiddleRushContinuationRate}%`} />
              </>
            )}
            {isMultiStageRush(result.rushMode) && (
              <StatItem label={result.regulation.supportsLt ? "上位/LT突入率" : "上位RUSH突入率"} value={`${input.upperRushEntryRate}%`} />
            )}
            {isMultiStageRush(result.rushMode) && !result.regulation.supportsLt && (
              <StatItem label="上位RUSH継続率" value={`${result.actualUpperRushContinuationRate}%`} />
            )}
            <StatItem
              label={result.regulation.supportsLt ? "LT継続率" : "継続率上限"}
              value={result.regulation.supportsLt ? `${result.actualLtContinuationRate}%` : `${result.regulation.maxContinuationRate}%`}
              highlight={result.regulation.supportsLt}
            />
            <StatItem label="RUSH中確率" value={`1/${result.rushProbability}`} />
            <StatItem label="ST/時短回数" value={`${result.stCount}回`} />
          </div>
        </section>

        <section>
          <h3>期待値サマリー</h3>
          <div className="stat-grid">
            <StatItem label="初当たり出玉" value={`約${result.initialPayout.toLocaleString()}発`} />
            <StatItem label="平均出玉/当たり" value={`約${result.avgPayoutPerBonus.toLocaleString()}発`} />
            {result.rushMode !== "directLt" && <StatItem label="RUSH期待出玉" value={`約${result.avgRushPayout.toLocaleString()}発`} highlight />}
            {result.rushMode === "threeStage" && (
              <StatItem label="中位RUSH期待出玉" value={`約${result.avgMiddleRushPayout.toLocaleString()}発`} highlight color="gold" />
            )}
            {isMultiStageRush(result.rushMode) && !result.regulation.supportsLt && (
              <StatItem label="上位RUSH期待出玉" value={`約${result.avgUpperRushPayout.toLocaleString()}発`} highlight color="gold" />
            )}
            {result.regulation.supportsLt && (
              <>
                <StatItem label="LT期待出玉" value={`約${result.avgLtPayout.toLocaleString()}発`} highlight color="gold" />
                <StatItem label="LT比率" value={`約${Math.round(result.check.ltRatio * 100)}%`} />
                <StatItem label="初当たりLT突入" value={`約${Math.round(result.ltEntryRate * 100)}%`} />
              </>
            )}
            <StatItem label="初当たり期待出玉" value={`約${result.avgTotalPayout.toLocaleString()}発`} highlight color="cyan" />
            <StatItem label="ボーダー（4円等価）" value={`${border.borderSpins}回/k`} highlight color="gold" />
          </div>
          {input.benchmark && (
            <p className="benchmark-note">
              実機プリセットは{input.benchmark.sourceLabel}掲載の「初当り1回あたりの期待出玉」とボーダーを基準に表示しています。
            </p>
          )}
        </section>

        <section>
          <h3>上限までの提案</h3>
          <div className="suggestion-box">
            {result.suggestions.map((suggestion) => (
              <p key={suggestion}>{suggestion}</p>
            ))}
          </div>
        </section>

        <div className="pie-chart-stack">
          <PayoutPieChart
            title="通常時"
            tiers={result.entryChartTiers}
            stLabel="初当たり"
          />
          <PayoutPieChart
            title={isMultiStageRush(result.rushMode) ? "下位RUSH・割合" : "大当たり中"}
            tiers={result.payoutTiers}
            stLabel={isMultiStageRush(result.rushMode) ? lowerRushStLabel : `ST${result.regulation.supportsLt ? result.ltStCount : result.stCount}回転`}
          />
          {result.rushMode === "threeStage" && (
            <PayoutPieChart
              title="中位RUSH・割合"
              tiers={result.payoutTiers}
              stLabel={`ST${input.middleRushStSpins || result.stCount}回転`}
            />
          )}
          {isMultiStageRush(result.rushMode) && (
            <PayoutPieChart
              title={result.regulation.supportsLt ? "上位/LT・割合" : "上位RUSH・割合"}
              tiers={result.payoutTiers}
              stLabel={upperRushStLabel}
            />
          )}
        </div>

        <SpecShareCard input={input} result={result} />

        <div className="result-actions">
          <button onClick={handleSimulate} className="primary-action">
            シミュレート
          </button>
          <button
            className="secondary-action"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            URLコピー
          </button>
        </div>
      </div>
    </div>
  );
}

function isMultiStageRush(rushMode: SpecResult["rushMode"]) {
  return rushMode === "twoStage" || rushMode === "threeStage";
}

function StatItem({ label, value, highlight, color }: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: "cyan" | "gold";
}) {
  const valueClass = highlight
    ? color === "cyan" ? "stat-value cyan"
    : color === "gold" ? "stat-value gold"
    : "stat-value pink"
    : "stat-value";

  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}
