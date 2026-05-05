// 総量規定 (LT3.0+ 2025年7月7日施行)
export const REGULATIONS = {
  MAX_INITIAL_PAYOUT: 6400,
  MAX_LT_TOTAL_PAYOUT: 9600,
  MAX_LT_RATIO: 0.8,
} as const;

export type MachineType = "P" | "e";
export type HitProbability = 99 | 199 | 319 | 349 | 399;
export type CalculationType = "A" | "B" | "C";

export interface SpecInput {
  machineType: MachineType;
  hitProbability: HitProbability;
  continuationRate: number; // 50-99
  calculationType: CalculationType;
  name: string;
}

export interface RoundDistribution {
  rate3r: number;
  rate10r: number;
  rate16r: number;
}

export interface SpecResult {
  rushProbability: number;       // RUSH中確率（分母）
  stCount: number;               // ST/時短回数
  ltEntryRate: number;           // LT突入率（0-1）
  avgChain: number;              // 平均連チャン数
  avgPayoutPerChain: number;     // 1連あたり平均出玉
  avgLtPayout: number;           // 1回のLT平均出玉
  initialPayout: number;         // 初当たり期待出玉
  roundDistribution: RoundDistribution;
  error?: string;
  suggestion?: string;
}

const RUSH_PROBABILITY: Record<MachineType, number> = {
  e: 79,
  P: 99,
};

const ST_COUNT: Record<HitProbability, number> = {
  99: 30,
  199: 80,
  319: 163,
  349: 180,
  399: 200,
};

const PAYOUT_PER_ROUND = 150;

function calcRoundDistribution(avgPayoutPerChain: number): RoundDistribution {
  const p3r = 450;
  const p10r = 1500;
  const p16r = 2400;

  // avgPayoutPerChain を 3R/10R/16R の組み合わせで近似
  // バランス重視の固定配分から逆算
  if (avgPayoutPerChain <= p3r) {
    return { rate3r: 1, rate10r: 0, rate16r: 0 };
  }
  if (avgPayoutPerChain >= p16r) {
    return { rate3r: 0, rate10r: 0, rate16r: 1 };
  }

  // 線形補間で配分を決める
  if (avgPayoutPerChain <= p10r) {
    const t = (avgPayoutPerChain - p3r) / (p10r - p3r);
    return {
      rate3r: Math.round((1 - t) * 100) / 100,
      rate10r: Math.round(t * 100) / 100,
      rate16r: 0,
    };
  } else {
    const t = (avgPayoutPerChain - p10r) / (p16r - p10r);
    return {
      rate3r: 0,
      rate10r: Math.round((1 - t) * 100) / 100,
      rate16r: Math.round(t * 100) / 100,
    };
  }
}

export function calculateSpec(input: SpecInput): SpecResult {
  const { machineType, hitProbability, continuationRate, calculationType } = input;
  const R = continuationRate / 100;

  const rushProbability = RUSH_PROBABILITY[machineType];
  const stCount = ST_COUNT[hitProbability];

  // ステップ1: 平均連チャン数
  const avgChain = 1 / (1 - R);

  // ステップ2: 1連あたり最大出玉
  const maxPayoutPerChain = REGULATIONS.MAX_LT_TOTAL_PAYOUT / avgChain;

  let ltEntryRate: number;
  let avgPayoutPerChain: number;

  if (calculationType === "A") {
    // 一撃重視: 出玉を最大化、突入率は低め
    avgPayoutPerChain = maxPayoutPerChain * 0.95;
    // LT総出玉の割合から突入率を逆算
    // LT獲得出玉 / 総出玉 <= 0.8
    // totalLtPayout = avgChain * avgPayoutPerChain * ltEntryRate (per initial hit)
    // initialPayout + ltEntryRate * avgLtPayout <= totalPayout
    // 初当たり出玉は3R固定とする（突入率を上げるため出玉を抑える）
    const initialPayout = 450;
    const ltPayout = avgChain * avgPayoutPerChain;
    // ltEntryRate * ltPayout / (initialPayout + ltEntryRate * ltPayout) <= 0.8
    // ltEntryRate * ltPayout <= 0.8 * initialPayout + 0.8 * ltEntryRate * ltPayout
    // 0.2 * ltEntryRate * ltPayout <= 0.8 * initialPayout
    // ltEntryRate <= 4 * initialPayout / ltPayout
    const maxEntryByRatio = (REGULATIONS.MAX_LT_RATIO * initialPayout) / ((1 - REGULATIONS.MAX_LT_RATIO) * ltPayout);
    ltEntryRate = Math.min(maxEntryByRatio, 0.5);
  } else if (calculationType === "B") {
    // チャンス重視: 突入率を最大化
    ltEntryRate = 0.8;
    // 突入率から逆算して出玉を決める
    const initialPayout = 450;
    const ltPayout = avgChain * maxPayoutPerChain;
    const actualMaxByRatio = (REGULATIONS.MAX_LT_RATIO * initialPayout) / ((1 - REGULATIONS.MAX_LT_RATIO) * avgChain * ltEntryRate);
    avgPayoutPerChain = Math.min(maxPayoutPerChain * 0.7, actualMaxByRatio / ltEntryRate);
    if (avgPayoutPerChain < 450) avgPayoutPerChain = 450;
  } else {
    // バランス
    ltEntryRate = 0.6;
    avgPayoutPerChain = maxPayoutPerChain * 0.7;
  }

  // 規定チェック
  const avgLtPayout = avgChain * avgPayoutPerChain;
  const initialPayout = 450;

  if (avgLtPayout >= REGULATIONS.MAX_LT_TOTAL_PAYOUT) {
    const maxRate = Math.ceil((1 - REGULATIONS.MAX_LT_TOTAL_PAYOUT / (REGULATIONS.MAX_LT_TOTAL_PAYOUT / (1 - R) * (1/avgChain))) * 100);
    return {
      rushProbability,
      stCount,
      ltEntryRate: 0,
      avgChain,
      avgPayoutPerChain: 0,
      avgLtPayout: 0,
      initialPayout,
      roundDistribution: { rate3r: 1, rate10r: 0, rate16r: 0 },
      error: `このスペックは総量規定により実現できません。LT中の期待出玉が9,600個を超えます。継続率を下げてください。`,
      suggestion: `推奨：継続率を${Math.floor((1 - REGULATIONS.MAX_LT_TOTAL_PAYOUT / (avgPayoutPerChain * 100)) * 100)}%以下に`,
    };
  }

  const roundDistribution = calcRoundDistribution(avgPayoutPerChain);

  return {
    rushProbability,
    stCount,
    ltEntryRate: Math.round(ltEntryRate * 100) / 100,
    avgChain: Math.round(avgChain * 10) / 10,
    avgPayoutPerChain: Math.round(avgPayoutPerChain),
    avgLtPayout: Math.round(avgLtPayout),
    initialPayout,
    roundDistribution,
  };
}

export interface BorderResult {
  avgTotalPayoutBalls: number;  // 初当たり1回あたりの平均総獲得玉
  borderSpins: number;          // ボーダー回転数 (回/1,000円)
}

export function calculateBorder(input: SpecInput, spec: SpecResult): BorderResult {
  // 平均総獲得玉 = 初当たり出玉 + LT突入率 × LT平均出玉
  const avgTotalPayoutBalls = spec.initialPayout + spec.ltEntryRate * spec.avgLtPayout;
  // ボーダー = 250 ÷ (平均総獲得玉 ÷ 初当たり確率分母)
  const borderSpins = 250 / (avgTotalPayoutBalls / input.hitProbability);
  return {
    avgTotalPayoutBalls: Math.round(avgTotalPayoutBalls),
    borderSpins: Math.round(borderSpins * 10) / 10,
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
  const spinsPerBall = 1000 / 250; // 4円等価の場合
  const expectedPayoutBalls = actualSpins * (avgTotalPayoutBalls / hitProbability);
  const investedBalls = investmentYen / ballPriceYen;
  const expectedDiffBalls = Math.round(expectedPayoutBalls - investedBalls);
  const expectedValueYen = Math.round(expectedDiffBalls * exchangeYenPerBall);

  const spinDiff = Math.round((userSpins - borderSpins) * 10) / 10;
  const judgment: "plus" | "even" | "minus" =
    Math.abs(spinDiff) <= 0.5 ? "even" : spinDiff > 0 ? "plus" : "minus";

  return { expectedDiffBalls, expectedValueYen, spinDiff, judgment };
}

export function getMaxContinuationRate(
  hitProbability: HitProbability,
  calculationType: CalculationType
): number {
  for (let rate = 99; rate >= 50; rate--) {
    const result = calculateSpec({
      machineType: "e",
      hitProbability,
      continuationRate: rate,
      calculationType,
      name: "test",
    });
    if (!result.error) return rate;
  }
  return 50;
}
