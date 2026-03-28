import { BaseEvaluationAgent } from './base-agent';
import { FINANCIAL_SYSTEM_PROMPT, buildFinancialUserPrompt } from '@/lib/council/prompts/financial';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class FinancialAgent extends BaseEvaluationAgent {
  dimension = 'financial' as const;
  systemPrompt = FINANCIAL_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildFinancialUserPrompt(name, contextStr);
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
