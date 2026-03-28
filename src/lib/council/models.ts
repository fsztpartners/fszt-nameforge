import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export interface CouncilModel {
  id: string;
  label: string;
  role: 'chairman' | 'analyst';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any; // OpenRouter model instance — type varies by model
}

// Default council configuration — swap models by editing this config
export const COUNCIL_CONFIG = {
  chairman: {
    id: 'anthropic/claude-sonnet-4',
    label: 'Claude Sonnet',
  },
  analysts: [
    { id: 'openai/gpt-4o', label: 'GPT-4o' },
    { id: 'google/gemini-2.0-flash-001', label: 'Gemini Flash' },
    { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
    { id: 'mistralai/mistral-large-latest', label: 'Mistral Large' },
  ],
} as const;

// Free tier uses fewer analysts
export const FREE_COUNCIL_CONFIG = {
  chairman: COUNCIL_CONFIG.chairman,
  analysts: COUNCIL_CONFIG.analysts.slice(0, 2),
} as const;

export function getCouncilModels(plan: 'free' | 'pro' | 'enterprise' = 'pro') {
  const config = plan === 'free' ? FREE_COUNCIL_CONFIG : COUNCIL_CONFIG;

  return {
    chairman: {
      id: config.chairman.id,
      label: config.chairman.label,
      role: 'chairman' as const,
      provider: openrouter(config.chairman.id),
    },
    analysts: config.analysts.map((a) => ({
      id: a.id,
      label: a.label,
      role: 'analyst' as const,
      provider: openrouter(a.id),
    })),
  };
}

export { openrouter };
