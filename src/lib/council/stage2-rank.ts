import { generateText } from 'ai';
import type { CouncilModel } from './models';
import type { CouncilStage1, CouncilStage2 } from '@/types/evaluation';

interface Stage2Input {
  analysts: CouncilModel[];
  stage1: CouncilStage1;
  dimensionName: string;
  onStageProgress?: (message: string) => void;
}

export async function runStage2(input: Stage2Input): Promise<CouncilStage2> {
  const { analysts, stage1, dimensionName, onStageProgress } = input;

  // Anonymize responses: assign labels A, B, C, D...
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const anonymizedResponses = stage1.responses.map((r, i) => ({
    label: `Response ${labels[i]}`,
    analysis: r.analysis,
    originalModel: r.model,
  }));

  const anonymizedText = anonymizedResponses
    .map((r) => `--- ${r.label} ---\n${r.analysis}`)
    .join('\n\n');

  onStageProgress?.('Stage 2: Peer ranking with anonymized responses');

  // Each analyst ranks all responses (including their own, anonymized)
  const rankingResults = await Promise.allSettled(
    analysts.map(async (analyst) => {
      const result = await generateText({
        model: analyst.provider,
        system: `You are evaluating ${dimensionName} analyses from multiple analysts. Their identities are hidden. Rank all responses from best to worst based on thoroughness, accuracy, and actionability.`,
        prompt: `Here are anonymized analyses of a startup name's ${dimensionName} dimension:\n\n${anonymizedText}\n\nProvide your ranking and a brief critique of each. Format:\nRANKING: [best to worst, e.g. "B, A, D, C"]\nFor each response, provide a one-line critique.`,
        maxOutputTokens: 1000,
        temperature: 0.2,
      });

      return {
        rankerModel: analyst.id,
        rankings: parseRankings(result.text, anonymizedResponses.map((r) => r.label)),
      };
    }),
  );

  const rankings = rankingResults
    .filter((r): r is PromiseFulfilledResult<CouncilStage2['rankings'][0]> => r.status === 'fulfilled')
    .map((r) => r.value);

  // Aggregate: calculate average position for each response
  const aggregatedScores = anonymizedResponses.map((r) => {
    const positions: number[] = [];
    for (const ranking of rankings) {
      const entry = ranking.rankings.find((rr) => rr.responseLabel === r.label);
      if (entry) positions.push(entry.rank);
    }
    const averageRank = positions.length > 0
      ? positions.reduce((a, b) => a + b, 0) / positions.length
      : anonymizedResponses.length;
    return { responseLabel: r.label, averageRank };
  });

  aggregatedScores.sort((a, b) => a.averageRank - b.averageRank);

  return { rankings, aggregatedScores };
}

function parseRankings(
  text: string,
  labels: string[],
): { responseLabel: string; rank: number; critique: string }[] {
  const rankingMatch = text.match(/RANKING:\s*(.+)/i);
  if (!rankingMatch) {
    // Fallback: assign equal ranks
    return labels.map((label, i) => ({ responseLabel: label, rank: i + 1, critique: '' }));
  }

  const rankOrder = rankingMatch[1]
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => labels.some((l) => l.includes(s) || s.includes(l.replace('Response ', ''))));

  return labels.map((label) => {
    const letter = label.replace('Response ', '');
    const position = rankOrder.findIndex((r) => r.includes(letter));
    return {
      responseLabel: label,
      rank: position >= 0 ? position + 1 : labels.length,
      critique: '', // Could parse per-response critiques from text
    };
  });
}
