import { generateText } from 'ai';
import type { CouncilModel } from './models';
import type { CouncilStage1, CouncilStage2, CouncilStage3 } from '@/types/evaluation';

interface Stage3Input {
  chairman: CouncilModel;
  stage1: CouncilStage1;
  stage2: CouncilStage2;
  dimensionName: string;
  nameBeingEvaluated: string;
  onStageProgress?: (message: string) => void;
}

export async function runStage3(input: Stage3Input): Promise<CouncilStage3> {
  const { chairman, stage1, stage2, dimensionName, nameBeingEvaluated, onStageProgress } = input;

  onStageProgress?.(`Stage 3: Chairman (${chairman.label}) synthesizing final verdict`);
  const startTime = Date.now();

  const individualAnalyses = stage1.responses
    .map((r, i) => `--- Analyst ${i + 1} (${r.modelLabel}) ---\nScore: ${r.score}/100 | Risk: ${r.riskLevel}\n${r.analysis}`)
    .join('\n\n');

  const peerRankingSummary = stage2.aggregatedScores
    .map((s) => `${s.responseLabel}: Average rank ${s.averageRank.toFixed(1)}`)
    .join('\n');

  const riskLevels = stage1.responses.map((r) => r.riskLevel);
  const hasDisagreement = new Set(riskLevels).size > 1;

  const result = await generateText({
    model: chairman.provider,
    system: `You are the Chairman of an LLM Council evaluating the ${dimensionName} dimension of the startup name "${nameBeingEvaluated}". You have received individual analyses from ${stage1.responses.length} council members, along with their anonymized peer rankings. Your job is to synthesize a final, authoritative verdict.

IMPORTANT RULES:
- If council members disagree on risk level, ALWAYS take the more conservative (higher risk) rating
- Your synthesis must address every significant point raised by any analyst
- Provide a single clear SCORE (0-100) and RISK level (green/yellow/red)
- Include specific, actionable recommendations

Format your response:
FINAL SCORE: [0-100]
FINAL RISK: [green/yellow/red]
CONFIDENCE: [0.0-1.0]

SYNTHESIS:
[Your comprehensive synthesis]

RECOMMENDATIONS:
- [Actionable recommendation 1]
- [Actionable recommendation 2]
- ...`,
    prompt: `Name being evaluated: "${nameBeingEvaluated}"

INDIVIDUAL ANALYSES:
${individualAnalyses}

PEER RANKING RESULTS:
${peerRankingSummary}

${hasDisagreement ? 'NOTE: The council DISAGREES on risk level. Apply the conservative rule — take the higher risk rating.' : 'The council is in consensus on risk level.'}

Synthesize all analyses into your final authoritative verdict.`,
    maxOutputTokens: 2000,
    temperature: 0.2,
  });

  const processingTimeMs = Date.now() - startTime;
  const parsed = parseSynthesis(result.text, riskLevels);

  return {
    chairmanModel: chairman.id,
    synthesis: result.text,
    finalScore: parsed.score,
    finalRisk: parsed.risk,
    confidence: parsed.confidence,
    recommendations: parsed.recommendations,
    processingTimeMs,
  };
}

function parseSynthesis(
  text: string,
  analystRiskLevels: string[],
): { score: number; risk: 'green' | 'yellow' | 'red'; confidence: number; recommendations: string[] } {
  const scoreMatch = text.match(/FINAL SCORE:\s*(\d+)/i);
  const riskMatch = text.match(/FINAL RISK:\s*(green|yellow|red)/i);
  const confMatch = text.match(/CONFIDENCE:\s*([\d.]+)/i);

  let score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 50;
  let risk = (riskMatch?.[1]?.toLowerCase() as 'green' | 'yellow' | 'red') ?? 'yellow';
  const confidence = confMatch ? Math.min(1, Math.max(0, parseFloat(confMatch[1]))) : 0.7;

  // Conservative rule: if any analyst flagged red, final must be at least yellow
  const riskPriority: Record<string, number> = { green: 0, yellow: 1, red: 2 };
  const worstAnalystRisk = analystRiskLevels.reduce<'green' | 'yellow' | 'red'>((worst, r) => {
    const level = r as 'green' | 'yellow' | 'red';
    return (riskPriority[level] ?? 0) > (riskPriority[worst] ?? 0) ? level : worst;
  }, 'green');

  if ((riskPriority[worstAnalystRisk] ?? 0) > (riskPriority[risk] ?? 0)) {
    risk = worstAnalystRisk;
  }

  // Extract recommendations
  const recsSection = text.split(/RECOMMENDATIONS?:/i)[1] ?? '';
  const recommendations = recsSection
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((line) => line.length > 10);

  return { score, risk, confidence, recommendations };
}
