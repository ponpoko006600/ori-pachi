"use client";

import { useState } from "react";
import { calculateSpec, SpecInput, SpecResult, MachineType, HitProbability, CalculationType } from "@/lib/calculator";
import SpecResultCard from "@/components/SpecResultCard";

const HIT_PROBS: HitProbability[] = [99, 199, 319, 349, 399];
const CALC_TYPES: { value: CalculationType; label: string; desc: string }[] = [
  { value: "A", label: "一撃重視", desc: "出玉MAX・突入率低め" },
  { value: "B", label: "チャンス重視", desc: "突入率MAX・出玉控えめ" },
  { value: "C", label: "バランス", desc: "中間バランス型" },
];

export default function Home() {
  const [name, setName] = useState("俺の最強LT");
  const [machineType, setMachineType] = useState<MachineType>("e");
  const [hitProb, setHitProb] = useState<HitProbability>(319);
  const [contRate, setContRate] = useState(85);
  const [calcType, setCalcType] = useState<CalculationType>("C");
  const [result, setResult] = useState<SpecResult | null>(null);
  const [specInput, setSpecInput] = useState<SpecInput | null>(null);

  function handleCreate() {
    const input: SpecInput = {
      machineType,
      hitProbability: hitProb,
      continuationRate: contRate,
      calculationType: calcType,
      name,
    };
    setSpecInput(input);
    setResult(calculateSpec(input));
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f1a 100%)" }}>
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🎰</span>
        <span className="text-xl font-bold neon-pink">PachiSpec</span>
        <span className="text-white/40 text-sm hidden sm:inline">夢のパチンコスペックメーカー</span>
      </header>

      {/* Hero */}
      <section className="text-center py-10 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          あなただけの<span className="neon-gold">夢のパチンコ台</span>を作ろう
        </h1>
        <p className="text-white/60 text-sm">専門知識いらず。継続率99%の台、作れます。</p>
      </section>

      {/* Form */}
      <section className="max-w-lg mx-auto px-4 pb-10">
        <div className="glow-border rounded-2xl p-6 space-y-6" style={{ background: "rgba(255,255,255,0.03)" }}>

          {/* スペック名 */}
          <div>
            <label className="block text-sm text-white/60 mb-2">スペック名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className="w-full rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)" }}
              placeholder="俺の最強LT"
            />
          </div>

          {/* 機種タイプ */}
          <div>
            <label className="block text-sm text-white/60 mb-2">機種タイプ</label>
            <div className="grid grid-cols-2 gap-3">
              {(["e", "P"] as MachineType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setMachineType(t)}
                  className="py-3 rounded-xl font-bold text-sm transition-all"
                  style={machineType === t
                    ? { background: "#db2777", color: "white", boxShadow: "0 0 20px rgba(219,39,119,0.4)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  {t === "e" ? "e機（スマパチ）" : "P機"}
                  <div className="text-xs font-normal opacity-70 mt-0.5">
                    {t === "e" ? "RUSH中 1/79" : "RUSH中 1/99"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 大当たり確率 */}
          <div>
            <label className="block text-sm text-white/60 mb-2">大当たり確率</label>
            <div className="grid grid-cols-5 gap-2">
              {HIT_PROBS.map((p) => (
                <button
                  key={p}
                  onClick={() => setHitProb(p)}
                  className="py-2 rounded-lg text-xs font-bold transition-all"
                  style={hitProb === p
                    ? { background: "#0891b2", color: "white", boxShadow: "0 0 15px rgba(8,145,178,0.4)" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }
                  }
                >
                  1/{p}
                </button>
              ))}
            </div>
          </div>

          {/* LT継続率 */}
          <div>
            <label className="block text-sm text-white/60 mb-2">
              LT継続率：<span className="neon-gold text-lg font-bold">{contRate}%</span>
              <span className="text-white/30 text-xs ml-2">
                (平均 {(1 / (1 - contRate / 100)).toFixed(1)}連)
              </span>
            </label>
            <input
              type="range"
              min={50}
              max={99}
              step={1}
              value={contRate}
              onChange={(e) => setContRate(Number(e.target.value))}
              className="w-full accent-yellow-400"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>50%</span>
              <span>75%</span>
              <span>99%</span>
            </div>
          </div>

          {/* 計算タイプ */}
          <div>
            <label className="block text-sm text-white/60 mb-2">計算タイプ</label>
            <div className="space-y-2">
              {CALC_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setCalcType(ct.value)}
                  className="w-full py-3 px-4 rounded-xl text-left transition-all flex justify-between items-center"
                  style={calcType === ct.value
                    ? { background: "linear-gradient(to right, rgba(219,39,119,0.3), rgba(8,145,178,0.2))", border: "1px solid rgba(219,39,119,0.5)" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  <span className="font-bold text-sm">{ct.label}</span>
                  <span className="text-xs text-white/50">{ct.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 作成ボタン */}
          <button
            onClick={handleCreate}
            className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #ff2d78, #ff6b35)",
              boxShadow: "0 0 20px rgba(255,45,120,0.4)",
            }}
          >
            🎰 スペックを作成する
          </button>
        </div>
      </section>

      {/* Result */}
      {result && specInput && (
        <section id="result-section" className="max-w-lg mx-auto px-4 pb-16">
          <SpecResultCard input={specInput} result={result} />
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-6 text-white/30 text-xs px-4">
        <p>PachiSpec - すべての計算は架空のシミュレーションです。実機を再現するものではありません。</p>
        <p className="mt-1">© 2025 PachiSpec. 18歳未満のご利用はご遠慮ください。</p>
      </footer>
    </main>
  );
}
