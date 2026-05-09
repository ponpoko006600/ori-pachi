export type MachineType = "P" | "e";
export type HitProbability = 99 | 129 | 199 | 319 | 349 | 399;
export type RegulationType = "lt" | "classic";
export type ProbabilityMode = "normal" | "high";
export type RushMode = "standard" | "directLt" | "twoStage";
export type ContinuationCalcMode = "rate" | "st";

export interface PayoutTier {
  id: string;
  label: string;
  payout: number;
  rate: number;
  bonusCount: number;
}

export interface YutimeSettings {
  enabled: boolean;
  triggerSpins: number;
  supportSpins: number;
  probabilityMode: ProbabilityMode;
  highProbability: number;
}

export interface TimeShortSettings {
  enabled: boolean;
  spins: number;
}

export interface SpecBenchmark {
  sourceLabel: string;
  sourceUrl: string;
  avgTotalPayoutBalls: number;
  borderSpins4Yen: number;
  conditionNote: string;
}

export interface SpecInput {
  name: string;
  machineType: MachineType;
  regulationType: RegulationType;
  rushMode: RushMode;
  hitProbability: HitProbability;
  rushEntryRate: number;
  rushContinuationRate: number;
  upperRushEntryRate: number;
  upperRushContinuationRate: number;
  ltContinuationRate: number;
  continuationCalcMode: ContinuationCalcMode;
  rightHitProbability: number;
  rushStSpins: number;
  upperRushStSpins: number;
  ltStSpins: number;
  nonRushTimeShort: TimeShortSettings;
  initialPayout: number;
  payoutTiers: PayoutTier[];
  yutime: YutimeSettings;
  benchmark?: SpecBenchmark;
}

export interface RegulationPreset {
  id: RegulationType;
  label: string;
  shortLabel: string;
  description: string;
  maxInitialPayout: number;
  maxLtTotalPayout?: number;
  maxLtRatio?: number;
  maxPayoutPerBonus: number;
  maxPayoutPerUnit: number;
  maxPayoutBundle: number;
  maxBonusCount: number;
  maxContinuationRate: number;
  supportsLt: boolean;
}

export interface RegulationCheck {
  ok: boolean;
  warnings: string[];
  causes: string[];
  payoutTierTotalRate: number;
  ltRatio: number;
  remainingLtPayout: number;
  headroomBalls: number;
}

export interface SpecResult {
  regulation: RegulationPreset;
  rushProbability: number;
  stCount: number;
  ltStCount: number;
  rushMode: RushMode;
  rushEntryRate: number;
  upperRushEntryRate: number;
  ltEntryRate: number;
  ltEntryRateWithinRush: number;
  effectiveRushEntryRate: number;
  timeShortReturnRate: number;
  actualRushContinuationRate: number;
  actualUpperRushContinuationRate: number;
  actualLtContinuationRate: number;
  avgRushChain: number;
  avgUpperRushChain: number;
  avgLtChain: number;
  avgPayoutPerBonus: number;
  avgRushPayout: number;
  avgUpperRushPayout: number;
  avgLtPayout: number;
  initialPayout: number;
  avgTotalPayout: number;
  payoutTiers: PayoutTier[];
  entryChartTiers: PayoutTier[];
  check: RegulationCheck;
  suggestions: string[];
  error?: string;
}

export interface BorderResult {
  avgTotalPayoutBalls: number;
  borderSpins: number;
  sourceLabel?: string;
  sourceUrl?: string;
  conditionNote?: string;
}

export const REGULATIONS: Record<RegulationType, RegulationPreset> = {
  lt: {
    id: "lt",
    label: "タイプA：LTあり規制",
    shortLabel: "LTあり",
    description: "LT期待出玉9,600発、初当たり出玉6,400発、LT比率80%を上限として判定します。",
    maxInitialPayout: 6400,
    maxLtTotalPayout: 9600,
    maxLtRatio: 0.8,
    maxPayoutPerBonus: 2400,
    maxPayoutPerUnit: 1500,
    maxPayoutBundle: 10000,
    maxBonusCount: 5,
    maxContinuationRate: 99,
    supportsLt: true,
  },
  classic: {
    id: "classic",
    label: "タイプB：LTなし規制",
    shortLabel: "LTなし",
    description: "1回あたりの出玉1,500発、継続率81%を上限とした旧来型として判定します。",
    maxInitialPayout: 1500,
    maxPayoutPerBonus: 1500,
    maxPayoutPerUnit: 1500,
    maxPayoutBundle: 7500,
    maxBonusCount: 5,
    maxContinuationRate: 81,
    supportsLt: false,
  },
};

export const HIT_PROBS: HitProbability[] = [99, 129, 199, 319, 349, 399];

export const DEFAULT_YUTIME: YutimeSettings = {
  enabled: false,
  triggerSpins: 999,
  supportSpins: 900,
  probabilityMode: "normal",
  highProbability: 99,
};

export const DEFAULT_TIME_SHORT: TimeShortSettings = {
  enabled: false,
  spins: 100,
};

export const DEFAULT_PAYOUT_TIERS: PayoutTier[] = [
  { id: "tier-reset", label: "STリセット", payout: 0, rate: 5, bonusCount: 1 },
  { id: "tier-450", label: "3R", payout: 450, rate: 35, bonusCount: 1 },
  { id: "tier-1500", label: "10R", payout: 1500, rate: 50, bonusCount: 1 },
  { id: "tier-3000", label: "10R x2", payout: 3000, rate: 10, bonusCount: 2 },
];

const RUSH_PROBABILITY: Record<MachineType, number> = {
  e: 79,
  P: 99,
};

const ST_COUNT: Record<HitProbability, number> = {
  99: 30,
  129: 6,
  199: 80,
  319: 130,
  349: 144,
  399: 163,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calcStContinuationRate(probabilityDenominator: number, spins: number): number {
  const denominator = Math.max(1, probabilityDenominator);
  const count = Math.max(0, spins);
  return round1((1 - Math.pow(1 - 1 / denominator, count)) * 100);
}

function chainAverage(continuationRate: number): number {
  return 1 / (1 - clamp(continuationRate, 1, 99.8) / 100);
}

function futureHitAverage(continuationRate: number): number {
  const rate = clamp(continuationRate, 1, 99.8) / 100;
  return rate / (1 - rate);
}

function normalizeMode(input: SpecInput, regulation: RegulationPreset): RushMode {
  if (!regulation.supportsLt && input.rushMode === "directLt") return "standard";
  return input.rushMode ?? "standard";
}

export function getRegulation(input: Pick<SpecInput, "regulationType">): RegulationPreset {
  return REGULATIONS[input.regulationType];
}

export function getPayoutTierRateTotal(tiers: PayoutTier[]): number {
  return round1(tiers.reduce((sum, tier) => sum + (Number.isFinite(tier.rate) ? tier.rate : 0), 0));
}

export function getAveragePayout(tiers: PayoutTier[]): number {
  return tiers.reduce((sum, tier) => sum + tier.payout * (tier.rate / 100), 0);
}

export function getMaxPayoutForRegulation(regulationType: RegulationType): number {
  return REGULATIONS[regulationType].maxPayoutBundle;
}

export function calculateSpec(input: SpecInput): SpecResult {
  const regulation = getRegulation(input);
  const rushMode = normalizeMode(input, regulation);
  const rushProbability = RUSH_PROBABILITY[input.machineType];
  const fallbackStCount = ST_COUNT[input.hitProbability];
  const stCount = input.rushStSpins ?? fallbackStCount;
  const ltStCount = input.ltStSpins ?? Math.max(stCount, Math.round(stCount * 1.25));
  const rightHitProbability = input.rightHitProbability ?? rushProbability;
  const calcMode = input.continuationCalcMode ?? "rate";
  const actualRushContinuationRate = calcMode === "st"
    ? calcStContinuationRate(rightHitProbability, stCount)
    : input.rushContinuationRate;
  const actualUpperRushContinuationRate = calcMode === "st"
    ? calcStContinuationRate(rightHitProbability, input.upperRushStSpins ?? stCount)
    : input.upperRushContinuationRate;
  const actualLtContinuationRate = calcMode === "st"
    ? calcStContinuationRate(rightHitProbability, ltStCount)
    : input.ltContinuationRate;
  const directRushEntryRate = clamp(input.rushEntryRate, 0, 100) / 100;
  const timeShortReturnRate = input.nonRushTimeShort?.enabled
    ? calcStContinuationRate(input.hitProbability, input.nonRushTimeShort.spins) / 100
    : 0;
  const rushEntryRate = directRushEntryRate + (1 - directRushEntryRate) * timeShortReturnRate;
  const upperRushEntryRate = rushMode === "twoStage" ? clamp(input.upperRushEntryRate, 0, 100) / 100 : 0;
  const avgRushChain = rushMode === "directLt" ? 0 : chainAverage(actualRushContinuationRate);
  const avgUpperRushChain = rushMode === "twoStage" ? chainAverage(actualUpperRushContinuationRate) : 0;
  const avgLtChain = regulation.supportsLt ? chainAverage(actualLtContinuationRate) : 0;
  const avgPayoutPerBonus = getAveragePayout(input.payoutTiers);
  const avgRushPayout = avgPayoutPerBonus * (rushMode === "directLt" ? 0 : futureHitAverage(actualRushContinuationRate));
  const avgUpperRushPayout = avgPayoutPerBonus * (rushMode === "twoStage" ? futureHitAverage(actualUpperRushContinuationRate) : 0);
  const avgLtPayout = regulation.supportsLt ? avgPayoutPerBonus * futureHitAverage(actualLtContinuationRate) : 0;
  const tierRateTotal = getPayoutTierRateTotal(input.payoutTiers);

  const warnings: string[] = [];
  const causes = new Set<string>();

  if (Math.abs(tierRateTotal - 100) > 0.01) {
    warnings.push(`出玉振り分けの合計が${tierRateTotal}%です。100%にしてください。`);
    causes.add("payoutTiers");
  }

  if (input.initialPayout > regulation.maxInitialPayout) {
    warnings.push(`初当たり出玉が${regulation.maxInitialPayout.toLocaleString()}発の上限を超えています。`);
    causes.add("initialPayout");
  }

  const overBundle = input.payoutTiers.find((tier) => tier.payout > regulation.maxPayoutBundle);
  if (overBundle) {
    warnings.push(`出玉ティア「${overBundle.label}」が表示上限${regulation.maxPayoutBundle.toLocaleString()}発を超えています。`);
    causes.add("payoutTiers");
  }

  const impossibleTier = input.payoutTiers.find((tier) => tier.payout > regulation.maxPayoutPerUnit * Math.max(1, tier.bonusCount));
  if (impossibleTier) {
    warnings.push(`「${impossibleTier.label}」は内部当たり${impossibleTier.bonusCount}回では再現しにくい出玉です。内部当たり回数を増やしてください。`);
    causes.add("payoutTiers");
  }

  if (!regulation.supportsLt && actualRushContinuationRate > regulation.maxContinuationRate) {
    warnings.push(`LTなし規制では下位RUSH継続率の上限を${regulation.maxContinuationRate}%として判定します。`);
    causes.add("rushContinuationRate");
  }

  if (!regulation.supportsLt && rushMode === "twoStage" && actualUpperRushContinuationRate > regulation.maxContinuationRate) {
    warnings.push(`LTなし規制では上位RUSH継続率の上限を${regulation.maxContinuationRate}%として判定します。`);
    causes.add("upperRushContinuationRate");
  }

  if (regulation.supportsLt && regulation.maxLtTotalPayout && avgLtPayout > regulation.maxLtTotalPayout) {
    warnings.push(`LT期待出玉が${Math.round(avgLtPayout).toLocaleString()}発で、${regulation.maxLtTotalPayout.toLocaleString()}発の上限を超えています。`);
    causes.add("ltContinuationRate");
    causes.add("payoutTiers");
  }

  let ltEntryRateWithinRush = 0;
  if (regulation.supportsLt && avgLtPayout > 0) {
    if (rushMode === "directLt") {
      ltEntryRateWithinRush = 1;
    } else if (rushMode === "twoStage") {
      ltEntryRateWithinRush = upperRushEntryRate;
    } else if (regulation.maxLtRatio) {
      const maxLtShareByRatio = (regulation.maxLtRatio * input.initialPayout)
        / ((1 - regulation.maxLtRatio) * Math.max(avgLtPayout, 1) * Math.max(rushEntryRate, 0.001));
      ltEntryRateWithinRush = clamp(maxLtShareByRatio, 0, 1);
    }
  }

  const ltEntryRate = regulation.supportsLt ? rushEntryRate * ltEntryRateWithinRush : 0;
  const timeShortEntryRate = (1 - directRushEntryRate) * timeShortReturnRate;
  const lowerRushExpected = rushMode === "directLt"
    ? 0
    : rushEntryRate * (1 - ltEntryRateWithinRush) * avgRushPayout;
  const upperRushExpected = !regulation.supportsLt && rushMode === "twoStage"
    ? rushEntryRate * upperRushEntryRate * avgUpperRushPayout
    : 0;
  const ltExpected = regulation.supportsLt ? ltEntryRate * avgLtPayout : 0;
  const classicRushExpected = !regulation.supportsLt && rushMode !== "twoStage"
    ? rushEntryRate * avgRushPayout
    : 0;
  const timeShortHitPayout = timeShortEntryRate * input.initialPayout;
  const avgTotalPayout = input.initialPayout + timeShortHitPayout + lowerRushExpected + upperRushExpected + ltExpected + classicRushExpected;
  const displayedAvgTotalPayout = input.benchmark?.avgTotalPayoutBalls ?? avgTotalPayout;
  const ltRatio = ltExpected / Math.max(input.initialPayout + lowerRushExpected + ltExpected, 1);
  const suggestions: string[] = [];

  if (regulation.supportsLt && regulation.maxLtRatio && ltRatio > regulation.maxLtRatio + 0.001) {
    if (rushMode === "directLt") {
      suggestions.push(`直LT系のため、LT比率${Math.round(ltRatio * 100)}%は参考値として表示しています。`);
    } else {
      warnings.push(`LT比率が約${Math.round(ltRatio * 100)}%で、${Math.round(regulation.maxLtRatio * 100)}%上限を超えています。突入率・LT継続率・LT出玉を下げてください。`);
      causes.add(rushMode === "twoStage" ? "upperRushEntryRate" : "rushEntryRate");
      causes.add("ltContinuationRate");
      causes.add("payoutTiers");
    }
  }

  const remainingLtPayout = regulation.maxLtTotalPayout ? regulation.maxLtTotalPayout - avgLtPayout : 0;
  const headroomBalls = Math.max(0, (regulation.maxLtTotalPayout ?? regulation.maxPayoutBundle) - Math.max(avgLtPayout, avgUpperRushPayout, avgRushPayout));

  if (warnings.length === 0) {
    if (regulation.supportsLt && rushMode === "directLt") {
      suggestions.push("直LT型として計算しています。初当たり後にRUSHを挟まず、突入時はLT継続率を使います。");
    }
    if (rushMode === "twoStage") {
      suggestions.push(regulation.supportsLt ? "2段階RUSH型として、上位突入後をLTとして計算しています。" : "2段階RUSH型として、下位RUSHと上位RUSHを分けて計算しています。");
    }
    if (regulation.supportsLt && remainingLtPayout > 100) {
      suggestions.push(`LT期待出玉に約${Math.round(remainingLtPayout).toLocaleString()}発の余裕があります。出玉ティアかLT継続率を上げられます。`);
    }
    if (timeShortReturnRate > 0) {
      suggestions.push(`非突入時短${input.nonRushTimeShort.spins}回の引き戻しを含めた実質RUSH突入率は約${round1(rushEntryRate * 100)}%です。`);
    } else if (!regulation.supportsLt && Math.max(actualRushContinuationRate, actualUpperRushContinuationRate) < regulation.maxContinuationRate) {
      suggestions.push(`LTなし規制の継続率上限まで、あと${round1(regulation.maxContinuationRate - Math.max(actualRushContinuationRate, actualUpperRushContinuationRate))}%上げられます。`);
    }
  } else {
    suggestions.push("赤く表示された項目を下げるか、内部当たり回数・出玉振り分けの合計を調整してください。");
  }

  const ok = warnings.length === 0;
  const entryChartTiers: PayoutTier[] = [
    {
      id: "entry-rush",
      label: regulation.supportsLt && rushMode === "directLt" ? "LT突入" : "RUSH突入",
      payout: input.initialPayout,
      rate: round1(input.rushEntryRate),
      bonusCount: 1,
    },
    {
      id: "entry-timeshort",
      label: "時短引き戻し",
      payout: input.initialPayout,
      rate: round1(timeShortEntryRate * 100),
      bonusCount: 1,
    },
    {
      id: "entry-normal",
      label: "通常",
      payout: input.initialPayout,
      rate: round1(Math.max(0, (1 - directRushEntryRate - timeShortEntryRate) * 100)),
      bonusCount: 1,
    },
  ].filter((tier) => tier.rate > 0);

  return {
    regulation,
    rushProbability: rightHitProbability,
    stCount,
    ltStCount,
    rushMode,
    rushEntryRate: round2(rushEntryRate),
    upperRushEntryRate: round2(upperRushEntryRate),
    ltEntryRate: round2(ltEntryRate),
    ltEntryRateWithinRush: round2(ltEntryRateWithinRush),
    effectiveRushEntryRate: round2(rushEntryRate),
    timeShortReturnRate: round2(timeShortReturnRate),
    actualRushContinuationRate: round1(actualRushContinuationRate),
    actualUpperRushContinuationRate: round1(actualUpperRushContinuationRate),
    actualLtContinuationRate: round1(actualLtContinuationRate),
    avgRushChain: round1(avgRushChain),
    avgUpperRushChain: round1(avgUpperRushChain),
    avgLtChain: round1(avgLtChain),
    avgPayoutPerBonus: Math.round(avgPayoutPerBonus),
    avgRushPayout: Math.round(avgRushPayout),
    avgUpperRushPayout: Math.round(avgUpperRushPayout),
    avgLtPayout: Math.round(avgLtPayout),
    initialPayout: input.initialPayout,
    avgTotalPayout: Math.round(displayedAvgTotalPayout),
    payoutTiers: input.payoutTiers,
    entryChartTiers,
    check: {
      ok,
      warnings,
      causes: Array.from(causes),
      payoutTierTotalRate: tierRateTotal,
      ltRatio: round2(ltRatio),
      remainingLtPayout: Math.round(remainingLtPayout),
      headroomBalls: Math.round(headroomBalls),
    },
    suggestions,
    error: ok ? undefined : warnings[0],
  };
}

export function maximizeSpec(input: SpecInput): SpecInput {
  const regulation = getRegulation(input);
  const avgPayout = Math.max(1, getAveragePayout(input.payoutTiers));
  const targetChain = regulation.supportsLt
    ? futureHitAverage(input.ltContinuationRate)
    : futureHitAverage(input.rushMode === "twoStage" ? input.upperRushContinuationRate : input.rushContinuationRate);
  const targetAverage = Math.min(regulation.maxPayoutBundle, (regulation.maxLtTotalPayout ?? regulation.maxPayoutBundle) / Math.max(targetChain, 1));
  const scale = Math.max(1, targetAverage / avgPayout);
  const next: SpecInput = {
    ...input,
    rushContinuationRate: regulation.supportsLt ? input.rushContinuationRate : Math.min(input.rushContinuationRate, regulation.maxContinuationRate),
    upperRushContinuationRate: Math.min(input.upperRushContinuationRate, regulation.maxContinuationRate),
    initialPayout: Math.min(input.initialPayout, regulation.maxInitialPayout),
  };

  next.payoutTiers = input.payoutTiers.map((tier) => {
    const payout = Math.min(regulation.maxPayoutBundle, Math.max(0, Math.round((tier.payout * scale) / 10) * 10));
    const bonusCount = Math.max(1, Math.min(regulation.maxBonusCount, Math.ceil(payout / regulation.maxPayoutPerUnit)));
    return { ...tier, payout, bonusCount };
  });

  return next;
}

export function calculateBorder(input: SpecInput, spec: SpecResult): BorderResult {
  if (input.benchmark) {
    return {
      avgTotalPayoutBalls: input.benchmark.avgTotalPayoutBalls,
      borderSpins: input.benchmark.borderSpins4Yen,
      sourceLabel: input.benchmark.sourceLabel,
      sourceUrl: input.benchmark.sourceUrl,
      conditionNote: input.benchmark.conditionNote,
    };
  }

  const avgTotalPayoutBalls = spec.avgTotalPayout;
  const borderSpins = 250 / Math.max(avgTotalPayoutBalls / input.hitProbability, 0.01);
  return {
    avgTotalPayoutBalls: Math.round(avgTotalPayoutBalls),
    borderSpins: round1(borderSpins),
    conditionNote: "入力条件から算出した概算値です。削り、玉こぼれ、電サポ中の増減は個別には反映していません。",
  };
}

export function calcExpectedValue(params: {
  borderSpins: number;
  userSpins: number;
  investmentYen: number;
  hitProbability: number;
  avgTotalPayoutBalls: number;
  exchangeYenPerBall: number;
  ballPriceYen: number;
}): {
  expectedDiffBalls: number;
  expectedValueYen: number;
  spinDiff: number;
  judgment: "plus" | "even" | "minus";
} {
  const { borderSpins, userSpins, investmentYen, hitProbability, avgTotalPayoutBalls, exchangeYenPerBall, ballPriceYen } = params;
  const actualSpins = (investmentYen / 1000) * userSpins;
  const expectedPayoutBalls = actualSpins * (avgTotalPayoutBalls / hitProbability);
  const investedBalls = investmentYen / ballPriceYen;
  const expectedDiffBalls = Math.round(expectedPayoutBalls - investedBalls);
  const expectedValueYen = Math.round((expectedPayoutBalls * exchangeYenPerBall) - investmentYen);
  const spinDiff = round1(userSpins - borderSpins);
  const judgment: "plus" | "even" | "minus" =
    Math.abs(spinDiff) <= 0.5 ? "even" : spinDiff > 0 ? "plus" : "minus";

  return { expectedDiffBalls, expectedValueYen, spinDiff, judgment };
}
