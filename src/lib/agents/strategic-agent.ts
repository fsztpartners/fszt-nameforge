import { BaseEvaluationAgent } from './base-agent';
import { STRATEGIC_SYSTEM_PROMPT, buildStrategicUserPrompt } from '@/lib/council/prompts/strategic';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class StrategicAgent extends BaseEvaluationAgent {
  dimension = 'strategic' as const;
  systemPrompt = STRATEGIC_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildStrategicUserPrompt(name, contextStr);
  }

  buildResults(name: string, _context: BusinessContext, council: CouncilResult): Record<string, unknown> {
    return {
      name,
      councilConsensus: {
        scores: council.stage1.responses.map((r) => ({ model: r.modelLabel, score: r.score, risk: r.riskLevel })),
        averageScore: council.finalScore,
      },
    };
  }
}
