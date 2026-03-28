import { generateText } from 'ai';
import type { CouncilModel } from './models';
import type { CouncilStage1 } from '@/types/evaluation';

interface Stage1Input {
  analysts: CouncilModel[];
  systemPrompt: string;
  userPrompt: string;
  onModelDispatched?: (model: CouncilModel) => void;
  onModelResponse?: (model: CouncilModel, result: CouncilStage1['responses'][0]) => void;
}

export async function runStage1(input: Stage1Input): Promise<CouncilStage1> {
  const { analysts, systemPrompt, userPrompt, onModelDispatched, onModelResponse } = input;

  const responses = await Promise.allSettled(
    analysts.map(async (analyst) => {
      onModelDispatched?.(analyst);
      const startTime = Date.now();

      const result = await generateText({
        model: analyst.provider,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 2000,
        temperature: 0.3,
      });

      const processingTimeMs = Date.now() - startTime;

      // Extract score and risk from the response
      const parsed = parseAnalysisResponse(result.text);

      const response: CouncilStage1['responses'][0] = {
        model: analyst.id,
        modelLabel: analyst.label,
        analysis: result.text,
        score: parsed.score,
        riskLevel: parsed.riskLevel,
        processingTimeMs,
      };

      onModelResponse?.(analyst, response);
      return response;
    }),
  );

  return {
    responses: responses
      .filter((r): r is PromiseFulfilledResult<CouncilStage1['responses'][0]> => r.status === 'fulfilled')
      .map((r) => r.value),
  };
}

function parseAnalysisResponse(text: string): { score: number; riskLevel: 'green' | 'yellow' | 'red' } {
  // Extract SCORE: XX from response
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10))) : 50;

  // Extract RISK: green/yellow/red from response
  const riskMatch = text.match(/RISK:\s*(green|yellow|red)/i);
  const riskLevel = (riskMatch?.[1]?.toLowerCase() as 'green' | 'yellow' | 'red') ?? 'yellow';

  return { score, riskLevel };
}
