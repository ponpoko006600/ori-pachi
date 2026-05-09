"use client";

import { useState } from "react";
import { BorderResult, calcExpectedValue } from "@/lib/calculator";

interface Props {
  hitProbability: number;
  border: BorderResult;
}

export default function BorderAnalyzer({ hitProbability, border }: Props) {
  const [userSpins, setUserSpins] = useState(String(border.borderSpins));
  const [investment, setInvestment] = useState("10000");
  const [exchange, setExchange] = useState("4");

  const userSpinsNum = parseFloat(userSpins);
  const investmentNum = parseInt(investment);
  const exchangeNum = parseFloat(exchange) || 4;

  const canCalc = userSpinsNum > 0 && investmentNum > 0;

  const ev = canCalc
    ? calcExpectedValue({
        borderSpins: border.borderSpins,
        userSpins: userSpinsNum,
        investmentYen: investmentNum,
        hitProbability,
        avgTotalPayoutBalls: border.avgTotalPayoutBalls,
        exchangeYenPerBall: exchangeNum,
        ballPriceYen: 4,
      })
    : null;

  const judgmentStyle = ev
    ? ev.judgment === "plus"
      ? { color: "#4ade80", label: "期待値プラス ▲", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)" }
      : ev.judgment === "even"
      ? { color: "#facc15", label: "ほぼ損益分岐 ▶", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.3)" }
      : { color: "#f87171", label: "期待値マイナス ▼", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)" }
    : null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,215,0,0.25)", background: "rgba(255,255,255,0.03)" }}>
      {/* ヘッダー */}
      <div className="px-5 py-3" style={{ background: "rgba(255,215,0,0.08)", borderBottom: "1px solid rgba(255,215,0,0.15)" }}>
        <h3 className="font-bold text-sm flex items-center gap-2">
          <span>📊</span>
          <span style={{ color: "#ffd700" }}>ボーダー分析</span>
        </h3>
      </div>

      <div className="p-5 space-y-5">
        {/* ボーダー情報 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="text-xs text-white/40 mb-1">ボーダー回転数</div>
            <div className="text-2xl font-bold" style={{ color: "#ffd700" }}>{border.borderSpins}</div>
            <div className="text-xs text-white/40">回 / 1,000円</div>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="text-xs text-white/40 mb-1">平均獲得玉</div>
            <div className="text-xl font-bold text-white">{border.avgTotalPayoutBalls.toLocaleString()}</div>
            <div className="text-xs text-white/40">玉 / 初当たり</div>
          </div>
        </div>

        <p className="text-xs text-white/30">
          {border.sourceLabel ? `${border.sourceLabel}掲載値を基準に表示` : "ボーダー以上回れば理論上は期待値プラス（4円等価交換基準）"}
        </p>
        {border.conditionNote && (
          <p className="text-xs text-white/30">
            {border.conditionNote}
            {border.sourceUrl && (
              <>
                {" "}
                <a href={border.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">
                  参照元
                </a>
              </>
            )}
          </p>
        )}

        {/* ユーザー入力 */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-white/70">あなたの条件を入力</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">回転率（回/1,000円）</label>
              <input
                type="number"
                value={userSpins}
                onChange={(e) => setUserSpins(e.target.value)}
                placeholder="例: 21.0"
                step="0.1"
                min="1"
                className="w-full rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">投資金額（円）</label>
              <input
                type="number"
                value={investment}
                onChange={(e) => setInvestment(e.target.value)}
                placeholder="例: 10000"
                step="1000"
                min="0"
                className="w-full rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1">交換レート（円/玉）</label>
            <div className="flex gap-2">
              {["3.57", "4"].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setExchange(rate)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={exchange === rate
                    ? { background: "rgba(255,215,0,0.3)", border: "1px solid rgba(255,215,0,0.5)", color: "#ffd700" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                  }
                >
                  {rate === "4" ? "4円等価" : "3.57円（28玉）"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 判定結果 */}
        {ev && judgmentStyle && (
          <div className="rounded-xl p-4 space-y-3" style={{ background: judgmentStyle.bg, border: `1px solid ${judgmentStyle.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">あなたの回転率</span>
              <span className="font-bold text-white">{userSpinsNum.toFixed(1)} 回/1,000円</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">ボーダーとの差</span>
              <span className="font-bold" style={{ color: judgmentStyle.color }}>
                {ev.spinDiff >= 0 ? "+" : ""}{ev.spinDiff} 回
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">期待収支</span>
              <span className="font-bold" style={{ color: judgmentStyle.color }}>
                {ev.expectedValueYen >= 0 ? "+" : ""}{ev.expectedValueYen.toLocaleString()} 円
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">期待差玉</span>
              <span className="font-bold" style={{ color: judgmentStyle.color }}>
                {ev.expectedDiffBalls >= 0 ? "+" : ""}{ev.expectedDiffBalls.toLocaleString()} 玉
              </span>
            </div>
            <div
              className="rounded-lg p-3 text-center font-bold"
              style={{ background: judgmentStyle.bg, color: judgmentStyle.color }}
            >
              {judgmentStyle.label}
            </div>
            <p className="text-xs text-white/30">
              ※理論値です。実際の勝敗を保証するものではありません。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
