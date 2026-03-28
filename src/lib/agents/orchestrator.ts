import { createAdminClient } from '@/lib/supabase/admin';
import { LegalAgent } from './legal-agent';
import { DomainAgent } from './domain-agent';
import { SocialAgent } from './social-agent';
import { LinguisticAgent } from './linguistic-agent';
import { StrategicAgent } from './strategic-agent';
import { FinancialAgent } from './financial-agent';
import type { BusinessContext, Dimension, DimensionScore, RiskLevel } from '@/types/evaluation';
import { WEIGHTS_BY_LEVEL } from '@/types/evaluation';

const agents = {
  legal: new LegalAgent(),
  domain: new DomainAgent(),
  social: new SocialAgent(),
  linguistic: new LinguisticAgent(),
  strategic: new StrategicAgent(),
  financial: new FinancialAgent(),
};

export interface OrchestratorInput {
  candidateId: string;
  name: string;
  context: BusinessContext;
  plan?: 'free' | 'pro' | 'enterprise';
}

export interface OrchestratorResult {
  compositeScore: number;
  overallRisk: RiskLevel;
  dimensionScores: DimensionScore[];
  completedDimensions: Dimension[];
  failedDimensions: Dimension[];
  totalTimeMs: number;
}

export async function runEvaluation(input: OrchestratorInput): Promise<OrchestratorResult> {
  const { candidateId, name, context, plan = 'pro' } = input;
  const supabase = createAdminClient();
  const startTime = Date.now();

  // Mark candidate as evaluating
  await supabase
    .from('name_candidates')
    .update({ evaluation_status: 'evaluating' })
    .eq('id', candidateId);

  // Run all 6 agents in parallel
  const results = await Promise.allSettled(
    Object.entries(agents).map(([, agent]) =>
      withTimeout(
        agent.evaluate(candidateId, name, context, plan),
        45000, // 45s per-agent timeout
        `${agent.dimension} agent timed out`,
      ),
    ),
  );

  const dimensionScores: DimensionScore[] = [];
  const completedDimensions: Dimension[] = [];
  const failedDimensions: Dimension[] = [];

  const dimensionKeys = Object.keys(agents) as Dimension[];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      dimensionScores.push(result.value);
      completedDimensions.push(dimensionKeys[i]);
    } else {
      failedDimensions.push(dimensionKeys[i]);
      console.error(`Agent ${dimensionKeys[i]} failed:`, result.reason);
    }
  });

  // Calculate composite score
  const weights = WEIGHTS_BY_LEVEL[context.namingLevel];
  let compositeScore = 0;
  let totalWeight = 0;

  for (const score of dimensionScores) {
    const weight = weights[score.dimension];
    compositeScore += score.score * weight;
    totalWeight += weight;
  }

  if (totalWeight > 0) {
    compositeScore = Math.round((compositeScore / totalWeight) * 100) / 100;
  }

  // Overall risk = worst individual risk (conservative rule)
  const riskPriority: Record<RiskLevel, number> = { green: 0, yellow: 1, red: 2 };
  const overallRisk = dimensionScores.reduce<RiskLevel>((worst, score) => {
    return riskPriority[score.riskLevel] > riskPriority[worst] ? score.riskLevel : worst;
  }, 'green');

  const totalTimeMs = Date.now() - startTime;

  // Update candidate with final scores
  const riskSummary = buildRiskSummary(dimensionScores, overallRisk);
  await supabase
    .from('name_candidates')
    .update({
      composite_score: compositeScore,
      overall_risk: overallRisk,
      risk_summary: riskSummary,
      evaluation_status: failedDimensions.length === 0 ? 'completed' : 'completed',
      agents_completed: completedDimensions,
    })
    .eq('id', candidateId);

  return {
    compositeScore,
    overallRisk,
    dimensionScores,
    completedDimensions,
    failedDimensions,
    totalTimeMs,
  };
}

function buildRiskSummary(scores: DimensionScore[], overallRisk: RiskLevel): string {
  const redDimensions = scores.filter((s) => s.riskLevel === 'red').map((s) => s.dimension);
  const yellowDimensions = scores.filter((s) => s.riskLevel === 'yellow').map((s) => s.dimension);

  if (overallRisk === 'green') return 'All dimensions cleared. Strong candidate.';
  if (overallRisk === 'red') return `Red flags in: ${redDimensions.join(', ')}. Investigate before proceeding.`;
  return `Caution in: ${yellowDimensions.join(', ')}. Review recommendations.`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms),
    ),
  ]);
}
