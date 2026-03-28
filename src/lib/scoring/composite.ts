import type { Dimension, NamingLevel, RiskLevel, CompositeWeights } from '@/types/evaluation';
import { WEIGHTS_BY_LEVEL } from '@/types/evaluation';

interface DimensionInput {
  dimension: Dimension;
  score: number;
  riskLevel: RiskLevel;
}

export function calculateCompositeScore(
  dimensions: DimensionInput[],
  namingLevel: NamingLevel,
): { compositeScore: number; overallRisk: RiskLevel; breakdown: Record<Dimension, { score: number; weight: number; weighted: number }> } {
  const weights = WEIGHTS_BY_LEVEL[namingLevel];
  const breakdown = {} as Record<Dimension, { score: number; weight: number; weighted: number }>;

  let totalWeighted = 0;
  let totalWeight = 0;

  for (const dim of dimensions) {
    const weight = weights[dim.dimension];
    const weighted = dim.score * weight;
    breakdown[dim.dimension] = { score: dim.score, weight, weighted };
    totalWeighted += weighted;
    totalWeight += weight;
  }

  const compositeScore = totalWeight > 0
    ? Math.round((totalWeighted / totalWeight) * 100) / 100
    : 0;

  // Worst-risk rule
  const riskPriority: Record<RiskLevel, number> = { green: 0, yellow: 1, red: 2 };
  const overallRisk = dimensions.reduce<RiskLevel>((worst, dim) => {
    return riskPriority[dim.riskLevel] > riskPriority[worst] ? dim.riskLevel : worst;
  }, 'green');

  return { compositeScore, overallRisk, breakdown };
}
