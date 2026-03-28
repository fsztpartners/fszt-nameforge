import { createAdminClient } from '@/lib/supabase/admin';
import { runCouncil, type CouncilResult, type CouncilEvent } from '@/lib/council';
import type { BusinessContext, Dimension, DimensionScore, ResearchEvent } from '@/types/evaluation';

export abstract class BaseEvaluationAgent {
  abstract dimension: Dimension;
  abstract systemPrompt: string;

  abstract buildUserPrompt(name: string, context: BusinessContext): string;
  abstract buildResults(name: string, context: BusinessContext, council: CouncilResult): Record<string, unknown>;

  async evaluate(
    candidateId: string,
    name: string,
    context: BusinessContext,
    plan: 'free' | 'pro' | 'enterprise' = 'pro',
  ): Promise<DimensionScore> {
    const supabase = createAdminClient();
    const startTime = Date.now();

    const emitEvent = async (event: Partial<ResearchEvent>) => {
      await supabase.from('research_events').insert({
        candidate_id: candidateId,
        dimension: this.dimension,
        event_type: event.eventType ?? 'agent_start',
        message: event.message ?? '',
        metadata: event.metadata ?? {},
      });
    };

    await emitEvent({
      eventType: 'agent_start',
      message: `Starting ${this.dimension} evaluation for "${name}"`,
    });

    const contextStr = `${context.businessDescription}. Verticals: ${context.verticals.join(', ')}. Stage: ${context.companyStage ?? 'not specified'}. Naming level: ${context.namingLevel}.`;

    const council = await runCouncil({
      name,
      dimension: this.dimension,
      systemPrompt: this.systemPrompt,
      userPrompt: this.buildUserPrompt(name, context),
      plan,
      onEvent: async (event: CouncilEvent) => {
        await emitEvent({
          eventType: event.type as ResearchEvent['eventType'],
          message: event.message,
          metadata: event.metadata,
        });
      },
    });

    const results = this.buildResults(name, context, council);
    const processingTimeMs = Date.now() - startTime;

    // Write dimension score to database
    const dimensionScore: Omit<DimensionScore, 'id'> = {
      candidateId,
      dimension: this.dimension,
      score: council.finalScore,
      riskLevel: council.finalRisk,
      confidence: council.confidence,
      results,
      summary: council.stage3.synthesis.slice(0, 500),
      recommendations: council.recommendations,
      councilStage1: council.stage1,
      councilStage2: council.stage2,
      councilStage3: council.stage3,
      chairmanModel: council.stage3.chairmanModel,
      analystsModels: council.stage1.responses.map((r) => r.model),
      processingTimeMs,
      cached: false,
    };

    const { data, error } = await supabase
      .from('dimension_scores')
      .insert({
        candidate_id: dimensionScore.candidateId,
        dimension: dimensionScore.dimension,
        score: dimensionScore.score,
        risk_level: dimensionScore.riskLevel,
        confidence: dimensionScore.confidence,
        results: dimensionScore.results,
        summary: dimensionScore.summary,
        recommendations: dimensionScore.recommendations,
        council_stage1: dimensionScore.councilStage1,
        council_stage2: dimensionScore.councilStage2,
        council_stage3: dimensionScore.councilStage3,
        chairman_model: dimensionScore.chairmanModel,
        analysts_models: dimensionScore.analystsModels,
        processing_time_ms: dimensionScore.processingTimeMs,
        cached: dimensionScore.cached,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save ${this.dimension} score: ${error.message}`);

    // Update candidate's agents_completed array and dimension score
    const scoreColumn = `${this.dimension}_score` as const;
    await supabase.rpc('array_append_unique', {
      table_name: 'name_candidates',
      row_id: candidateId,
      column_name: 'agents_completed',
      value: this.dimension,
    }).then(() =>
      // Fallback: direct update
      supabase
        .from('name_candidates')
        .update({ [scoreColumn]: council.finalScore })
        .eq('id', candidateId),
    );

    await emitEvent({
      eventType: 'agent_complete',
      message: `${this.dimension} complete — Score: ${council.finalScore}/100, Risk: ${council.finalRisk.toUpperCase()}`,
      metadata: { score: council.finalScore, risk: council.finalRisk, timeMs: processingTimeMs },
    });

    return { ...dimensionScore, id: data.id } as DimensionScore;
  }
}
