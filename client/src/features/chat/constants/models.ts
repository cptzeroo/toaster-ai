export type AIProvider = 'google' | 'openai' | 'anthropic';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
}

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  google: 'Google',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
};

export const AI_MODELS: AIModel[] = [
  // Google Gemini
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', provider: 'google' },
  // // OpenAI
  // { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  // { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  // { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
  // // Anthropic
  // { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'anthropic' },
  // { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
];

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash';

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
