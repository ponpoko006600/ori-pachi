import { SpecInput, SpecResult } from "./calculator";

export interface SimulationResult {
  totalHits: number;
  totalPayout: number;
  avgPayoutPerHit: number;
  maxChain: number;
  maxHamari: number;
  chainDistribution: Record<number, number>;
  balanceHistory: number[];
  finalBalance: number;
  machineRatio: number;
}

export function runSimulation(
  input: SpecInput,
  spec: SpecResult,
  trials = 10000,
  onProgress?: (current: number) => void
): SimulationResult {
  const hitProb = input.hitProbability;
  const R = input.continuationRate / 100;
  const ltEntryRate = spec.ltEntryRate;
  const roundDist = spec.roundDistribution;

  const SPINS_PER_1000YEN = 19;
  const YEN_PER_1000 = 1000;
  const BALL_PRICE = 4;

  let totalPayout = 0;
  let totalSpins = 0;
  let maxChain = 0;
  let maxHamari = 0;
  let chainDistribution: Record<number, number> = {};
  const balanceHistory: number[] = [0];

  let cumulativeBalance = 0;
  const SAMPLE_INTERVAL = Math.floor(trials / 200);

  for (let i = 0; i < trials; i++) {
    // 通常時の回転数（指数分布）
    const spinsToHit = Math.ceil(-Math.log(Math.random()) * hitProb);
    totalSpins += spinsToHit;
    if (spinsToHit > maxHamari) maxHamari = spinsToHit;

    // 投資額
    const cost = Math.ceil(spinsToHit / SPINS_PER_1000YEN) * YEN_PER_1000;

    // 初当たり出玉（3R固定）
    let hitPayout = spec.initialPayout * BALL_PRICE;

    // LT突入抽選
    let chainCount = 0;
    if (Math.random() < ltEntryRate) {
      // LT中の連チャン
      let continuing = true;
      while (continuing) {
        chainCount++;
        // ラウンド振り分け
        const rand = Math.random();
        let payout: number;
        if (rand < roundDist.rate3r) {
          payout = 450;
        } else if (rand < roundDist.rate3r + roundDist.rate10r) {
          payout = 1500;
        } else {
          payout = 2400;
        }
        hitPayout += payout * BALL_PRICE;

        // 継続抽選
        if (Math.random() >= R) {
          continuing = false;
        }
      }
    }

    if (chainCount > maxChain) maxChain = chainCount;
    chainDistribution[chainCount] = (chainDistribution[chainCount] || 0) + 1;

    const netBalance = hitPayout - cost;
    cumulativeBalance += netBalance;
    totalPayout += hitPayout;

    if (i % SAMPLE_INTERVAL === 0) {
      balanceHistory.push(cumulativeBalance);
    }

    if (onProgress && i % 500 === 0) {
      onProgress(i);
    }
  }

  balanceHistory.push(cumulativeBalance);

  const avgPayoutPerHit = totalPayout / trials;
  const totalCost = totalSpins / SPINS_PER_1000YEN * YEN_PER_1000;
  const machineRatio = (totalPayout / BALL_PRICE) / (totalCost / BALL_PRICE) * 100;

  return {
    totalHits: trials,
    totalPayout,
    avgPayoutPerHit: Math.round(avgPayoutPerHit),
    maxChain,
    maxHamari,
    chainDistribution,
    balanceHistory,
    finalBalance: Math.round(cumulativeBalance),
    machineRatio: Math.round(machineRatio * 10) / 10,
  };
}
