import { BaseEvaluationAgent } from './base-agent';
import { LEGAL_SYSTEM_PROMPT, buildLegalUserPrompt } from '@/lib/council/prompts/legal';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class LegalAgent extends BaseEvaluationAgent {
  dimension = 'legal' as const;
  systemPrompt = LEGAL_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildLegalUserPrompt(name, contextStr);
  }

  buildResults(name: string, _context: BusinessContext, council: CouncilResult): Record<string, unknown> {
    return {
      name,
      trademarkType: 'AI-estimated',
      councilConsensus: {
        scores: council.stage1.responses.map((r) => ({ model: r.modelLabel, score: r.score, risk: r.riskLevel })),
        averageScore: council.finalScore,
        riskAgreement: new Set(council.stage1.responses.map((r) => r.riskLevel)).size === 1,
      },
    };
  }
}
