import { BaseEvaluationAgent } from './base-agent';
import { SOCIAL_SYSTEM_PROMPT, buildSocialUserPrompt } from '@/lib/council/prompts/social';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class SocialAgent extends BaseEvaluationAgent {
  dimension = 'social' as const;
  systemPrompt = SOCIAL_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildSocialUserPrompt(name, contextStr);
  }

  buildResults(name: string, _context: BusinessContext, council: CouncilResult): Record<string, unknown> {
    const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      primaryHandle: `@${handle}`,
      platforms: ['instagram', 'tiktok', 'linkedin', 'twitter', 'facebook', 'youtube', 'github', 'reddit'],
      variations: [`@${handle}`, `@get${handle}`, `@${handle}hq`, `@${handle}ai`],
      councilConsensus: {
        scores: council.stage1.responses.map((r) => ({ model: r.modelLabel, score: r.score, risk: r.riskLevel })),
        averageScore: council.finalScore,
      },
    };
  }
}
