import { BaseEvaluationAgent } from './base-agent';
import { LINGUISTIC_SYSTEM_PROMPT, buildLinguisticUserPrompt } from '@/lib/council/prompts/linguistic';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class LinguisticAgent extends BaseEvaluationAgent {
  dimension = 'linguistic' as const;
  systemPrompt = LINGUISTIC_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildLinguisticUserPrompt(name, contextStr);
  }

  buildResults(name: string, _context: BusinessContext, council: CouncilResult): Record<string, unknown> {
    return {
      name,
      syllableCount: name.replace(/[^aeiouy]/gi, '').length || 1,
      characterCount: name.length,
      councilConsensus: {
        scores: council.stage1.responses.map((r) => ({ model: r.modelLabel, score: r.score, risk: r.riskLevel })),
        averageScore: council.finalScore,
      },
    };
  }
}
