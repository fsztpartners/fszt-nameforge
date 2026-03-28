import { getCouncilModels } from './models';
import { runStage1 } from './stage1-collect';
import { runStage2 } from './stage2-rank';
import { runStage3 } from './stage3-synthesize';
import type { Dimension, CouncilStage1, CouncilStage2, CouncilStage3 } from '@/types/evaluation';

export interface CouncilInput {
  name: string;
  dimension: Dimension;
  systemPrompt: string;
  userPrompt: string;
  plan?: 'free' | 'pro' | 'enterprise';
  onEvent?: (event: CouncilEvent) => void;
}

export interface CouncilEvent {
  type: 'model_dispatched' | 'model_response' | 'stage_complete' | 'error';
  dimension: Dimension;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface CouncilResult {
  stage1: CouncilStage1;
  stage2: CouncilStage2;
  stage3: CouncilStage3;
  finalScore: number;
  finalRisk: 'green' | 'yellow' | 'red';
  confidence: number;
  recommendations: string[];
  totalTimeMs: number;
}

export async function runCouncil(input: CouncilInput): Promise<CouncilResult> {
  const { name, dimension, systemPrompt, userPrompt, plan = 'pro', onEvent } = input;
  const { chairman, analysts } = getCouncilModels(plan);
  const startTime = Date.now();

  const emit = (type: CouncilEvent['type'], message: string, metadata?: Record<string, unknown>) => {
    onEvent?.({ type, dimension, message, metadata });
  };

  // Stage 1: Parallel collection from all analysts
  emit('stage_complete', `Stage 1: Dispatching to ${analysts.length} council analysts`);

  const stage1 = await runStage1({
    analysts,
    systemPrompt,
    userPrompt,
    onModelDispatched: (model) => {
      emit('model_dispatched', `${model.label}: analyzing ${dimension}...`, { model: model.id });
    },
    onModelResponse: (model, result) => {
      emit('model_response', `${model.label} responded (${(result.processingTimeMs / 1000).toFixed(1)}s) — Risk: ${result.riskLevel.toUpperCase()}`, {
        model: model.id,
        score: result.score,
        risk: result.riskLevel,
        timeMs: result.processingTimeMs,
      });
    },
  });

  emit('stage_complete', `Stage 1 complete: ${stage1.responses.length}/${analysts.length} analysts responded`);

  // Stage 2: Anonymized peer ranking
  const stage2 = await runStage2({
    analysts,
    stage1,
    dimensionName: dimension,
    onStageProgress: (msg) => emit('stage_complete', msg),
  });

  const topRanked = stage2.aggregatedScores[0];
  emit('stage_complete', `Stage 2 complete: ${topRanked?.responseLabel} ranked highest (avg rank ${topRanked?.averageRank.toFixed(1)})`);

  // Stage 3: Chairman synthesis
  const stage3 = await runStage3({
    chairman,
    stage1,
    stage2,
    dimensionName: dimension,
    nameBeingEvaluated: name,
    onStageProgress: (msg) => emit('stage_complete', msg),
  });

  const totalTimeMs = Date.now() - startTime;
  emit('stage_complete', `${dimension} dimension complete — Score: ${stage3.finalScore}/100, Risk: ${stage3.finalRisk.toUpperCase()} (${(totalTimeMs / 1000).toFixed(1)}s)`);

  return {
    stage1,
    stage2,
    stage3,
    finalScore: stage3.finalScore,
    finalRisk: stage3.finalRisk,
    confidence: stage3.confidence,
    recommendations: stage3.recommendations,
    totalTimeMs,
  };
}

export { getCouncilModels } from './models';
