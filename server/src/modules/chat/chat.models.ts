export type AIProvider = 'google' | 'openai' | 'anthropic';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  modelId: string;
}

export const AI_MODELS: AIModel[] = [
  // Google Gemini
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    modelId: 'gemini-2.0-flash',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    modelId: 'gemini-2.5-pro',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    modelId: 'gemini-2.5-flash',
  },
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'google',
    modelId: 'gemini-3-pro-preview',
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    modelId: 'gpt-4o-mini',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    modelId: 'gpt-4.1',
  },
  // Anthropic
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
  },
];

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash';

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
