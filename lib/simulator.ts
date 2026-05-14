import { PayoutTier, SpecInput, SpecResult } from "./calculator";

export interface SimulationPoint {
  spin: number;
  balance: number;
}

export interface SimulationResult {
  totalSpins: number;
  totalInitialHits: number;
  totalRushEntries: number;
  totalPayout: number;
  totalPayoutBalls: number;
  avgPayoutPerHit: number;
  avgPayoutBallsPerHit: number;
  maxChain: number;
  maxHamari: number;
  yutimeEntries: number;
  yutimeHits: number;
  chainDistribution: Record<number, number>;
  balanceHistory: SimulationPoint[];
  finalBalance: number;
  machineRatio: number;
}

export interface SimulationOptions {
  spinsPer1000Yen?: number;
  exchangeYenPerBall?: number;
  ballPriceYen?: number;
}

const DEFAULT_SPINS_PER_1000YEN = 17;
const DEFAULT_BALL_PRICE = 4;
const DEFAULT_EXCHANGE_YEN_PER_BALL = 4;

function drawGeometric(probabilityDenominator: number): number {
  const hitRate = 1 / Math.max(probabilityDenominator, 1);
  return Math.ceil(Math.log(1 - Math.random()) / Math.log(1 - hitRate));
}

function drawPayout(tiers: PayoutTier[]): number {
  const rand = Math.random() * 100;
  let cursor = 0;
  for (const tier of tiers) {
    cursor += tier.rate;
    if (rand <= cursor) return tier.payout;
  }
  return tiers[tiers.length - 1]?.payout ?? 0;
}

function drawNormalUntilHit(input: SpecInput): { spins: number; yutimeEntered: boolean; yutimeHit: boolean } {
  if (!input.yutime.enabled) {
    return { spins: drawGeometric(input.hitProbability), yutimeEntered: false, yutimeHit: false };
  }

  let spins = 0;
  let yutimeEntered = false;

  while (true) {
    const normalHit = drawGeometric(input.hitProbability);
    if (normalHit <= input.yutime.triggerSpins) {
      return { spins: spins + normalHit, yutimeEntered, yutimeHit: false };
    }

    spins += input.yutime.triggerSpins;
    yutimeEntered = true;

    const yutimeProbability = input.yutime.probabilityMode === "high"
      ? input.yutime.highProbability
      : input.hitProbability;
    const yutimeHit = drawGeometric(yutimeProbability);

    if (yutimeHit <= input.yutime.supportSpins) {
      return { spins: spins + yutimeHit, yutimeEntered, yutimeHit: true };
    }

    spins += input.yutime.supportSpins;
  }
}

function playRush(input: SpecInput, spec: SpecResult): { payoutBalls: number; chainCount: number; enteredRush: boolean } {
  const directEntry = Math.random() < input.rushEntryRate / 100;
  const timeShortEntry = !directEntry && input.nonRushTimeShort?.enabled && Math.random() < spec.timeShortReturnRate;
  if (!directEntry && !timeShortEntry) {
    return { payoutBalls: 0, chainCount: 0, enteredRush: false };
  }

  const isDirectLt = spec.regulation.supportsLt && spec.rushMode === "directLt";
  const entersMiddle = spec.rushMode === "threeStage" && Math.random() < input.middleRushEntryRate / 100;
  const isMultiStageUpper = spec.rushMode === "twoStage"
    ? Math.random() < input.upperRushEntryRate / 100
    : entersMiddle && Math.random() < input.upperRushEntryRate / 100;
  const isLt = spec.regulation.supportsLt
    && (isDirectLt || isMultiStageUpper || (spec.rushMode === "standard" && Math.random() < spec.ltEntryRateWithinRush));
  const continuation = isLt
    ? spec.actualLtContinuationRate / 100
    : isMultiStageUpper
      ? spec.actualUpperRushContinuationRate / 100
      : entersMiddle
        ? spec.actualMiddleRushContinuationRate / 100
      : spec.actualRushContinuationRate / 100;

  let payoutBalls = timeShortEntry ? input.initialPayout : 0;
  let chainCount = 0;
  while (Math.random() < continuation) {
    chainCount++;
    payoutBalls += drawPayout(input.payoutTiers);
  }

  return { payoutBalls, chainCount, enteredRush: true };
}

export function runSimulation(
  input: SpecInput,
  spec: SpecResult,
  totalSpins = 2000,
  onProgress?: (current: number) => void,
  options: SimulationOptions = {}
): SimulationResult {
  const spinsPer1000Yen = sanitizePositive(options.spinsPer1000Yen, DEFAULT_SPINS_PER_1000YEN);
  const ballPriceYen = sanitizePositive(options.ballPriceYen, DEFAULT_BALL_PRICE);
  const exchangeYenPerBall = sanitizePositive(options.exchangeYenPerBall, DEFAULT_EXCHANGE_YEN_PER_BALL);
  let currentSpin = 0;
  let totalInitialHits = 0;
  let totalRushEntries = 0;
  let totalPayoutYen = 0;
  let totalPayoutBalls = 0;
  let totalInvestmentYen = 0;
  let maxChain = 0;
  let maxHamari = 0;
  let yutimeEntries = 0;
  let yutimeHits = 0;
  let cumulativeBalance = 0;
  const chainDistribution: Record<number, number> = {};
  const balanceHistory: SimulationPoint[] = [{ spin: 0, balance: 0 }];

  while (currentSpin < totalSpins) {
    const normal = drawNormalUntilHit(input);
    const remainingSpins = totalSpins - currentSpin;

    if (normal.spins > remainingSpins) {
      const costYen = (remainingSpins / spinsPer1000Yen) * 1000;
      totalInvestmentYen += costYen;
      cumulativeBalance -= costYen;
      currentSpin = totalSpins;
      balanceHistory.push({ spin: currentSpin, balance: Math.round(cumulativeBalance) });
      break;
    }

    const costYen = (normal.spins / spinsPer1000Yen) * 1000;
    totalInvestmentYen += costYen;
    cumulativeBalance -= costYen;
    currentSpin += normal.spins;
    maxHamari = Math.max(maxHamari, normal.spins);
    totalInitialHits++;
    if (normal.yutimeEntered) yutimeEntries++;
    if (normal.yutimeHit) yutimeHits++;

    const rush = playRush(input, spec);
    if (rush.enteredRush) totalRushEntries++;
    maxChain = Math.max(maxChain, rush.chainCount);
    chainDistribution[rush.chainCount] = (chainDistribution[rush.chainCount] || 0) + 1;

    const payoutBalls = input.initialPayout + rush.payoutBalls;
    const payoutYen = payoutBalls * exchangeYenPerBall;
    totalPayoutBalls += payoutBalls;
    totalPayoutYen += payoutYen;
    cumulativeBalance += payoutYen;
    balanceHistory.push({ spin: currentSpin, balance: Math.round(cumulativeBalance) });

    if (onProgress) onProgress(currentSpin);
  }

  const investedBalls = totalInvestmentYen / ballPriceYen;
  const machineRatio = (totalPayoutBalls / Math.max(investedBalls, 1)) * 100;

  return {
    totalSpins,
    totalInitialHits,
    totalRushEntries,
    totalPayout: Math.round(totalPayoutYen),
    totalPayoutBalls,
    avgPayoutPerHit: totalInitialHits > 0 ? Math.round(totalPayoutYen / totalInitialHits) : 0,
    avgPayoutBallsPerHit: totalInitialHits > 0 ? Math.round(totalPayoutBalls / totalInitialHits) : 0,
    maxChain,
    maxHamari,
    yutimeEntries,
    yutimeHits,
    chainDistribution,
    balanceHistory,
    finalBalance: Math.round(cumulativeBalance),
    machineRatio: Math.round(machineRatio * 10) / 10,
  };
}

function sanitizePositive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}
