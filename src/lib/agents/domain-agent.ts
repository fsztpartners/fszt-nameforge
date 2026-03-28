import { BaseEvaluationAgent } from './base-agent';
import { DOMAIN_SYSTEM_PROMPT, buildDomainUserPrompt } from '@/lib/council/prompts/domain';
import type { BusinessContext } from '@/types/evaluation';
import type { CouncilResult } from '@/lib/council';

export class DomainAgent extends BaseEvaluationAgent {
  dimension = 'domain' as const;
  systemPrompt = DOMAIN_SYSTEM_PROMPT;

  buildUserPrompt(name: string, context: BusinessContext): string {
    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;
    return buildDomainUserPrompt(name, contextStr);
  }

  buildResults(name: string, _context: BusinessContext, council: CouncilResult): Record<string, unknown> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return {
      nameSlug: slug,
      primaryDomain: `${slug}.com`,
      alternativeTLDs: ['.ai', '.co', '.io', '.tech', '.app', '.inc', '.studio'].map((tld) => ({
        domain: `${slug}${tld}`,
        tld,
      })),
      councilConsensus: {
        scores: council.stage1.responses.map((r) => ({ model: r.modelLabel, score: r.score, risk: r.riskLevel })),
        averageScore: council.finalScore,
        riskAgreement: new Set(council.stage1.responses.map((r) => r.riskLevel)).size === 1,
      },
    };
  }
}
