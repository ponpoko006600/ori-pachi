"use client";

import { useMemo, useState } from "react";
import {
  calculateSpec,
  calcStContinuationRate,
  DEFAULT_PAYOUT_TIERS,
  DEFAULT_TIME_SHORT,
  DEFAULT_YUTIME,
  getMaxPayoutForRegulation,
  HIT_PROBS,
  HitProbability,
  MachineType,
  maximizeSpec,
  PayoutTier,
  REGULATIONS,
  RegulationType,
  RushMode,
  SpecInput,
} from "@/lib/calculator";
import { MACHINE_PRESETS } from "@/lib/presets";
import SpecResultCard from "@/components/SpecResultCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  const [input, setInput] = useState<SpecInput>({
    name: "俺の最強LT",
    machineType: "e",
    regulationType: "lt",
    rushMode: "standard",
    hitProbability: 319,
    rushEntryRate: 55,
    rushContinuationRate: 72,
    upperRushEntryRate: 25,
    upperRushContinuationRate: 81,
    ltContinuationRate: 85,
    continuationCalcMode: "rate",
    rightHitProbability: 79,
    rushStSpins: 130,
    upperRushStSpins: 130,
    ltStSpins: 163,
    nonRushTimeShort: DEFAULT_TIME_SHORT,
    initialPayout: 450,
    payoutTiers: DEFAULT_PAYOUT_TIERS,
    yutime: DEFAULT_YUTIME,
  });
  const [createdInput, setCreatedInput] = useState<SpecInput | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const result = useMemo(() => calculateSpec(input), [input]);
  const createdResult = useMemo(() => createdInput ? calculateSpec(createdInput) : null, [createdInput]);
  const regulation = REGULATIONS[input.regulationType];
  const maxTierPayout = getMaxPayoutForRegulation(input.regulationType);
  const hitProbIndex = HIT_PROBS.indexOf(input.hitProbability);
  const causes = result.check.causes;

  function patchInput(patch: Partial<SpecInput>, keepBenchmark = false) {
    setInput((current) => ({ ...current, ...patch, benchmark: keepBenchmark ? current.benchmark : undefined }));
    if (!keepBenchmark) setSelectedPresetId(null);
  }

  function setRegulationType(regulationType: RegulationType) {
    const nextRegulation = REGULATIONS[regulationType];
    setInput((current) => ({
      ...current,
      regulationType,
      rushMode: !nextRegulation.supportsLt && current.rushMode === "directLt" ? "standard" : current.rushMode,
      rushContinuationRate: Math.min(current.rushContinuationRate, nextRegulation.maxContinuationRate),
      ltContinuationRate: nextRegulation.supportsLt ? current.ltContinuationRate : Math.min(current.rushContinuationRate, nextRegulation.maxContinuationRate),
      upperRushContinuationRate: Math.min(current.upperRushContinuationRate, nextRegulation.maxContinuationRate),
      initialPayout: Math.min(current.initialPayout, nextRegulation.maxInitialPayout),
      benchmark: undefined,
      payoutTiers: current.payoutTiers.map((tier) => ({
        ...tier,
        payout: Math.min(tier.payout, nextRegulation.maxPayoutBundle),
        bonusCount: Math.max(1, Math.min(nextRegulation.maxBonusCount, tier.bonusCount)),
      })),
    }));
  }

  function updateTier(id: string, patch: Partial<PayoutTier>) {
    setSelectedPresetId(null);
    setInput((current) => ({
      ...current,
      benchmark: undefined,
      payoutTiers: current.payoutTiers.map((tier) => tier.id === id ? { ...tier, ...patch } : tier),
    }));
  }

  function addTier() {
    if (input.payoutTiers.length >= 6) return;
    setSelectedPresetId(null);
    setInput((current) => ({
      ...current,
      benchmark: undefined,
      payoutTiers: [
        ...current.payoutTiers,
        {
          id: `tier-${Date.now()}`,
          label: `${current.payoutTiers.length + 1}段階`,
          payout: 0,
          rate: 0,
          bonusCount: 1,
        },
      ],
    }));
  }

  function addPresetTier(label: string, payout: number, bonusCount: number) {
    if (input.payoutTiers.length >= 6) return;
    setSelectedPresetId(null);
    setInput((current) => ({
      ...current,
      benchmark: undefined,
      payoutTiers: [
        ...current.payoutTiers,
        {
          id: `tier-${Date.now()}-${payout}`,
          label,
          payout: Math.min(payout, maxTierPayout),
          rate: 0,
          bonusCount,
        },
      ],
    }));
  }

  function removeTier(id: string) {
    if (input.payoutTiers.length <= 1) return;
    setSelectedPresetId(null);
    setInput((current) => ({
      ...current,
      benchmark: undefined,
      payoutTiers: current.payoutTiers.filter((tier) => tier.id !== id),
    }));
  }

  function normalizeRates() {
    const total = input.payoutTiers.reduce((sum, tier) => sum + tier.rate, 0);
    if (total <= 0) return;
    const normalized = input.payoutTiers.map((tier) => ({
      ...tier,
      rate: Math.round((tier.rate / total) * 1000) / 10,
    }));
    const diff = Math.round((100 - normalized.reduce((sum, tier) => sum + tier.rate, 0)) * 10) / 10;
    normalized[normalized.length - 1] = {
      ...normalized[normalized.length - 1],
      rate: Math.round((normalized[normalized.length - 1].rate + diff) * 10) / 10,
    };
    patchInput({ payoutTiers: normalized });
  }

  function handleCreate() {
    setCreatedInput(input);
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleMaximize() {
    setSelectedPresetId(null);
    setInput((current) => ({ ...maximizeSpec(current), benchmark: undefined }));
  }

  function applyPreset(presetId: string, presetInput: SpecInput) {
    setSelectedPresetId(presetId);
    setInput(structuredClone(presetInput));
    setCreatedInput(null);
  }

  function closestHitProbability(value: number): HitProbability {
    return HIT_PROBS.reduce((closest, current) => (
      Math.abs(current - value) < Math.abs(closest - value) ? current : closest
    ), HIT_PROBS[0]);
  }

  return (
    <main className="min-h-screen app-bg">
      <SiteHeader />

      <section className="builder-shell">
        <div className="builder-intro">
          <h1>スペック作成</h1>
          <p>規制タイプを選び、スライダーで出玉性能を調整できます。</p>
        </div>

        {!result.check.ok && (
          <div className="warning-banner sticky-warning">
            <strong>規制オーバー</strong>
            <span>{result.check.warnings[0]}</span>
          </div>
        )}

        <div className="builder-grid">
          <section className="control-panel">
            <PanelTitle label="規制タイプ" />
            <div className="regulation-grid">
              {(Object.keys(REGULATIONS) as RegulationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setRegulationType(type)}
                  className={input.regulationType === type ? "regulation-card active" : "regulation-card"}
                >
                  <strong>{REGULATIONS[type].shortLabel}</strong>
                  <span>{REGULATIONS[type].description}</span>
                </button>
              ))}
            </div>

            <div className="field-stack">
              <label className="field-label">スペック名</label>
              <input
                value={input.name}
                onChange={(event) => patchInput({ name: event.target.value })}
                maxLength={30}
                className="text-input"
                placeholder="スペック名"
              />
            </div>

            <PanelTitle label="実機プリセット" />
            <div className="preset-machine-grid">
              {MACHINE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id, preset.input)}
                  className={selectedPresetId === preset.id ? "preset-machine-button active" : "preset-machine-button"}
                >
                  <strong>{preset.label}</strong>
                  <span>{selectedPresetId === preset.id ? "選択中" : "このスペックに設定"}</span>
                </button>
              ))}
            </div>
            {selectedPresetId && (
              <div className="selected-preset-note">
                <strong>選択中の実機スペック</strong>
                <span>{MACHINE_PRESETS.find((preset) => preset.id === selectedPresetId)?.input.name}</span>
              </div>
            )}

            <PanelTitle label="基本パラメータ" />
            <div className="field-stack">
              <label className="field-label">機種タイプ</label>
              <div className="segmented">
                {(["e", "P"] as MachineType[]).map((machineType) => (
                  <button
                    key={machineType}
                    onClick={() => patchInput({ machineType })}
                    className={input.machineType === machineType ? "active" : ""}
                  >
                    {machineType === "e" ? "e機" : "P機"}
                  </button>
                ))}
              </div>
            </div>

            <SliderControl
              label="初当たり確率"
              valueLabel={`1/${input.hitProbability}`}
              inputPrefix="1/"
              inputValue={input.hitProbability}
              inputMin={HIT_PROBS[0]}
              inputMax={HIT_PROBS[HIT_PROBS.length - 1]}
              inputStep={1}
              min={0}
              max={HIT_PROBS.length - 1}
              step={1}
              value={hitProbIndex}
              ok
              onChange={(value) => patchInput({ hitProbability: HIT_PROBS[value] as HitProbability })}
              onInputChange={(value) => patchInput({ hitProbability: closestHitProbability(value) })}
              markers={HIT_PROBS.map((prob) => `1/${prob}`)}
            />

            <SliderControl
              label="Rush突入率"
              valueLabel={`${input.rushEntryRate}%`}
              inputSuffix="%"
              min={0}
              max={100}
              step={1}
              value={input.rushEntryRate}
              ok={!causes.includes("rushEntryRate")}
              onChange={(rushEntryRate) => patchInput({ rushEntryRate })}
            />

            <div className="toggle-row">
              <span>非突入時短</span>
              <button
                onClick={() => patchInput({ nonRushTimeShort: { ...input.nonRushTimeShort, enabled: !input.nonRushTimeShort.enabled } })}
                className={input.nonRushTimeShort.enabled ? "toggle active" : "toggle"}
              >
                {input.nonRushTimeShort.enabled ? "あり" : "なし"}
              </button>
            </div>
            {input.nonRushTimeShort.enabled && (
              <SliderControl
                label="非突入時の時短回数"
                valueLabel={`${input.nonRushTimeShort.spins}回転`}
                inputSuffix="回転"
                min={1}
                max={300}
                step={1}
                value={input.nonRushTimeShort.spins}
                ok
                onChange={(spins) => patchInput({ nonRushTimeShort: { ...input.nonRushTimeShort, spins } })}
                hint={`引き戻し約${calcStContinuationRate(input.hitProbability, input.nonRushTimeShort.spins)}%`}
              />
            )}

            <div className="field-stack">
              <label className="field-label">Rush構造</label>
              <div className="segmented rush-mode">
                {getRushModeOptions(input.regulationType).map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => patchInput({ rushMode: mode.value })}
                    className={input.rushMode === mode.value ? "active" : ""}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-stack">
              <label className="field-label">継続率の作り方</label>
              <div className="segmented">
                <button
                  onClick={() => patchInput({ continuationCalcMode: "rate" })}
                  className={input.continuationCalcMode === "rate" ? "active" : ""}
                >
                  継続率で選ぶ
                </button>
                <button
                  onClick={() => patchInput({ continuationCalcMode: "st" })}
                  className={input.continuationCalcMode === "st" ? "active" : ""}
                >
                  確率×回数
                </button>
              </div>
            </div>

            {input.continuationCalcMode === "st" && (
              <SliderControl
                label="右打ち中確率"
                valueLabel={`1/${input.rightHitProbability}`}
                inputPrefix="1/"
                min={1}
                max={399}
                step={1}
                value={input.rightHitProbability}
                ok
                onChange={(rightHitProbability) => patchInput({ rightHitProbability })}
              />
            )}

            {input.continuationCalcMode === "st" && input.rushMode !== "directLt" && (
              <SliderControl
                label={input.rushMode === "twoStage" ? "下位Rush ST回数" : "Rush ST回数"}
                valueLabel={`${input.rushStSpins}回 / 約${result.actualRushContinuationRate}%`}
                inputSuffix="回"
                inputNote={`約${result.actualRushContinuationRate}%`}
                min={1}
                max={250}
                step={1}
                value={input.rushStSpins}
                ok={!causes.includes("rushContinuationRate")}
                onChange={(rushStSpins) => patchInput({ rushStSpins })}
              />
            )}

            {input.continuationCalcMode === "rate" && input.rushMode !== "directLt" && (
              <SliderControl
                label={input.rushMode === "twoStage" ? "下位Rush継続率" : "Rush継続率"}
                valueLabel={`${input.rushContinuationRate}%`}
                inputSuffix="%"
                min={1}
                max={99}
                step={1}
                value={input.rushContinuationRate}
                ok={!causes.includes("rushContinuationRate")}
                onChange={(rushContinuationRate) => patchInput({ rushContinuationRate })}
                hint={input.regulationType === "classic" ? "LTなし規制は81%上限で判定" : undefined}
              />
            )}

            {input.rushMode === "twoStage" && (
              <SliderControl
                label={regulation.supportsLt ? "上位/LT突入率" : "上位Rush突入率"}
                valueLabel={`${input.upperRushEntryRate}%`}
                inputSuffix="%"
                min={0}
                max={100}
                step={1}
                value={input.upperRushEntryRate}
                ok={!causes.includes("upperRushEntryRate")}
                onChange={(upperRushEntryRate) => patchInput({ upperRushEntryRate })}
              />
            )}

            {input.continuationCalcMode === "st" && input.rushMode === "twoStage" && (
              <SliderControl
                label={regulation.supportsLt ? "上位/LT ST回数" : "上位Rush ST回数"}
                valueLabel={`${input.upperRushStSpins}回 / 約${result.actualUpperRushContinuationRate}%`}
                inputSuffix="回"
                inputNote={`約${result.actualUpperRushContinuationRate}%`}
                min={1}
                max={250}
                step={1}
                value={input.upperRushStSpins}
                ok={!causes.includes("upperRushContinuationRate")}
                onChange={(upperRushStSpins) => patchInput({ upperRushStSpins })}
              />
            )}

            {input.continuationCalcMode === "rate" && input.rushMode === "twoStage" && !regulation.supportsLt && (
              <SliderControl
                label="上位Rush継続率"
                valueLabel={`${input.upperRushContinuationRate}%`}
                inputSuffix="%"
                min={1}
                max={99}
                step={1}
                value={input.upperRushContinuationRate}
                ok={!causes.includes("upperRushContinuationRate")}
                onChange={(upperRushContinuationRate) => patchInput({ upperRushContinuationRate })}
                hint="LTなし規制は81%上限で判定"
              />
            )}

            {input.continuationCalcMode === "st" && regulation.supportsLt && (
              <SliderControl
                label="LT ST回数"
                valueLabel={`${input.ltStSpins}回 / 約${result.actualLtContinuationRate}%`}
                inputSuffix="回"
                inputNote={`約${result.actualLtContinuationRate}%`}
                min={1}
                max={250}
                step={1}
                value={input.ltStSpins}
                ok={!causes.includes("ltContinuationRate")}
                onChange={(ltStSpins) => patchInput({ ltStSpins })}
                hint={`右打ち1/${input.rightHitProbability}から自動計算`}
              />
            )}

            {input.continuationCalcMode === "rate" && regulation.supportsLt && (
              <SliderControl
                label="LT継続率"
                valueLabel={`${input.ltContinuationRate}%`}
                inputSuffix="%"
                min={50}
                max={99}
                step={1}
                value={input.ltContinuationRate}
                ok={!causes.includes("ltContinuationRate")}
                onChange={(ltContinuationRate) => patchInput({ ltContinuationRate })}
                hint={`平均 ${result.avgLtChain}連`}
              />
            )}

            <SliderControl
              label="初当たり出玉"
              valueLabel={`${input.initialPayout.toLocaleString()}発`}
              inputSuffix="発"
              min={0}
              max={regulation.maxInitialPayout}
              step={10}
              value={input.initialPayout}
              ok={!causes.includes("initialPayout")}
              onChange={(initialPayout) => patchInput({ initialPayout })}
            />

            <PanelTitle label="出玉振り分け" aside={`${result.check.payoutTierTotalRate}%`} />
            <div className="tier-list">
              {input.payoutTiers.map((tier, index) => (
                <div key={tier.id} className="tier-card">
                  <div className="tier-head">
                    <input
                      value={tier.label}
                      onChange={(event) => updateTier(tier.id, { label: event.target.value })}
                      className="tier-name"
                      aria-label={`${index + 1}段階目の名前`}
                    />
                    <button onClick={() => removeTier(tier.id)} disabled={input.payoutTiers.length <= 1}>
                      削除
                    </button>
                  </div>
                  <SliderControl
                    label="出玉数"
                    valueLabel={`${tier.payout.toLocaleString()}発`}
                    inputSuffix="発"
                    min={0}
                    max={maxTierPayout}
                    step={10}
                    value={tier.payout}
                    ok={!causes.includes("payoutTiers") || tier.payout <= maxTierPayout}
                    onChange={(payout) => updateTier(tier.id, { payout })}
                  />
                  <SliderControl
                    label="内部当たり回数"
                    valueLabel={`${tier.bonusCount}回`}
                    inputSuffix="回"
                    min={1}
                    max={regulation.maxBonusCount}
                    step={1}
                    value={tier.bonusCount}
                    ok={!causes.includes("payoutTiers") || tier.payout <= regulation.maxPayoutPerUnit * tier.bonusCount}
                    onChange={(bonusCount) => updateTier(tier.id, { bonusCount })}
                    hint={`${regulation.maxPayoutPerUnit.toLocaleString()}発 x 回数で高出玉を再現`}
                  />
                  <SliderControl
                    label="割合"
                    valueLabel={`${tier.rate}%`}
                    inputSuffix="%"
                    min={0}
                    max={100}
                    step={0.5}
                    value={tier.rate}
                    ok={!causes.includes("payoutTiers") || Math.abs(result.check.payoutTierTotalRate - 100) <= 0.01}
                    onChange={(rate) => updateTier(tier.id, { rate })}
                  />
                </div>
              ))}
            </div>
            <div className="inline-actions">
              <button onClick={addTier} disabled={input.payoutTiers.length >= 6}>ティア追加</button>
              <button onClick={normalizeRates}>割合を100%に補正</button>
            </div>
            <div className="inline-actions preset-actions">
              <button onClick={() => addPresetTier("STリセット", 0, 1)} disabled={input.payoutTiers.length >= 6}>0発STリセット</button>
              <button onClick={() => addPresetTier("10R x2", 3000, 2)} disabled={input.payoutTiers.length >= 6}>3000発</button>
              <button onClick={() => addPresetTier("10R x5", 7500, 5)} disabled={input.payoutTiers.length >= 6}>7500発</button>
            </div>

            <PanelTitle label="遊タイム" />
            <div className="toggle-row">
              <span>遊タイム</span>
              <button
                onClick={() => patchInput({ yutime: { ...input.yutime, enabled: !input.yutime.enabled } })}
                className={input.yutime.enabled ? "toggle active" : "toggle"}
              >
                {input.yutime.enabled ? "あり" : "なし"}
              </button>
            </div>
            {input.yutime.enabled && (
              <>
                <SliderControl
                  label="発動までの回転数"
                  valueLabel={`${input.yutime.triggerSpins}回転`}
                  inputSuffix="回転"
                  min={100}
                  max={1500}
                  step={1}
                  value={input.yutime.triggerSpins}
                  ok
                  onChange={(triggerSpins) => patchInput({ yutime: { ...input.yutime, triggerSpins } })}
                />
                <SliderControl
                  label="時短回転数"
                  valueLabel={`${input.yutime.supportSpins}回転`}
                  inputSuffix="回転"
                  min={1}
                  max={1500}
                  step={1}
                  value={input.yutime.supportSpins}
                  ok
                  onChange={(supportSpins) => patchInput({ yutime: { ...input.yutime, supportSpins } })}
                />
                <div className="field-stack">
                  <label className="field-label">遊タイム中の当たり確率</label>
                  <div className="segmented">
                    <button
                      onClick={() => patchInput({ yutime: { ...input.yutime, probabilityMode: "normal" } })}
                      className={input.yutime.probabilityMode === "normal" ? "active" : ""}
                    >
                      通常確率
                    </button>
                    <button
                      onClick={() => patchInput({ yutime: { ...input.yutime, probabilityMode: "high" } })}
                      className={input.yutime.probabilityMode === "high" ? "active" : ""}
                    >
                      高確率
                    </button>
                  </div>
                </div>
                {input.yutime.probabilityMode === "high" && (
                  <SliderControl
                    label="高確率分母"
                    valueLabel={`1/${input.yutime.highProbability}`}
                    inputPrefix="1/"
                    min={10}
                    max={199}
                    step={1}
                    value={input.yutime.highProbability}
                    ok
                    onChange={(highProbability) => patchInput({ yutime: { ...input.yutime, highProbability } })}
                  />
                )}
              </>
            )}

            <div className="create-actions">
              <button onClick={handleMaximize} className="secondary-action">規制上限まで自動調整</button>
              <button onClick={handleCreate} className="primary-action" disabled={!result.check.ok}>
                スペックを作成する
              </button>
            </div>
          </section>

          <aside className="preview-panel" aria-live="polite">
            <PanelTitle label="リアルタイム判定" />
            <div className={result.check.ok ? "meter-card ok" : "meter-card warn"}>
              <strong>{result.check.ok ? "規制内で作成できます" : "調整が必要です"}</strong>
              <span>{regulation.description}</span>
            </div>
            <div className="stat-grid">
              <PreviewStat label="平均出玉" value={`約${result.avgPayoutPerBonus.toLocaleString()}発`} />
              {input.rushMode !== "directLt" && <PreviewStat label="RUSH期待" value={`約${result.avgRushPayout.toLocaleString()}発`} />}
              {input.rushMode === "twoStage" && !regulation.supportsLt && <PreviewStat label="上位RUSH期待" value={`約${result.avgUpperRushPayout.toLocaleString()}発`} />}
              {regulation.supportsLt && <PreviewStat label="LT期待" value={`約${result.avgLtPayout.toLocaleString()}発`} />}
              <PreviewStat label="初当たり期待" value={`約${result.avgTotalPayout.toLocaleString()}発`} />
              {input.nonRushTimeShort.enabled && <PreviewStat label="実質RUSH突入" value={`約${Math.round(result.effectiveRushEntryRate * 100)}%`} />}
            </div>
            <div className="suggestion-box">
              {result.suggestions.map((suggestion) => (
                <p key={suggestion}>{suggestion}</p>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {createdInput && createdResult && (
        <section id="result-section" className="result-section">
          <SpecResultCard input={createdInput} result={createdResult} />
        </section>
      )}

      <SiteFooter />
    </main>
  );
}

function PanelTitle({ label, aside }: { label: string; aside?: string }) {
  return (
    <div className="panel-title">
      <h2>{label}</h2>
      {aside && <span>{aside}</span>}
    </div>
  );
}

function getRushModeOptions(regulationType: RegulationType): Array<{ value: RushMode; label: string }> {
  if (regulationType === "lt") {
    return [
      { value: "standard", label: "下位Rushあり" },
      { value: "directLt", label: "直LT" },
      { value: "twoStage", label: "2段階Rush" },
    ];
  }

  return [
    { value: "standard", label: "1段階Rush" },
    { value: "twoStage", label: "2段階Rush" },
  ];
}

function SliderControl({
  label,
  valueLabel,
  inputPrefix,
  inputSuffix,
  inputValue,
  inputMin,
  inputMax,
  inputStep,
  inputNote,
  min,
  max,
  step,
  value,
  ok,
  onChange,
  onInputChange,
  hint,
  markers,
}: {
  label: string;
  valueLabel: string;
  inputPrefix?: string;
  inputSuffix?: string;
  inputValue?: number;
  inputMin?: number;
  inputMax?: number;
  inputStep?: number;
  inputNote?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  ok: boolean;
  onChange: (value: number) => void;
  onInputChange?: (value: number) => void;
  hint?: string;
  markers?: string[];
}) {
  const numericValue = inputValue ?? value;
  const numericMin = inputMin ?? min;
  const numericMax = inputMax ?? max;
  const numericStep = inputStep ?? step;
  const inputWidth = Math.max(3, String(numericValue).replace(".", "").length + 1);

  function commitInput(rawValue: string) {
    if (rawValue.trim() === "") return;

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;

    const nextValue = normalizeSliderNumber(parsed, numericMin, numericMax, numericStep);
    (onInputChange ?? onChange)(nextValue);
  }

  return (
    <div className="slider-field">
      <div className="slider-label-row">
        <label>{label}</label>
        <div className={ok ? "slider-value-control" : "slider-value-control warn"} aria-label={`${label}を直接入力`}>
          {inputPrefix && <span>{inputPrefix}</span>}
          <input
            type="number"
            inputMode={numericStep % 1 === 0 ? "numeric" : "decimal"}
            min={numericMin}
            max={numericMax}
            step={numericStep}
            value={numericValue}
            style={{ width: `${inputWidth}ch` }}
            aria-label={`${label}の数値`}
            title={`${label}: ${valueLabel}`}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => commitInput(event.target.value)}
          />
          {inputSuffix && <span>{inputSuffix}</span>}
          {inputNote && <small>{inputNote}</small>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={ok ? "spec-slider ok" : "spec-slider warn"}
      />
      <div className="slider-meta">
        {markers ? markers.map((marker) => <span key={marker}>{marker}</span>) : (
          <>
            <span>{min}</span>
            <span>{hint || ""}</span>
            <span>{max}</span>
          </>
        )}
      </div>
    </div>
  );
}

function normalizeSliderNumber(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value));
  const decimals = Math.max(0, `${step}`.split(".")[1]?.length ?? 0);
  const aligned = Math.round((clamped - min) / step) * step + min;

  return Number(aligned.toFixed(decimals));
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-item">
      <div className="stat-label">{label}</div>
      <div className="stat-value cyan">{value}</div>
    </div>
  );
}
