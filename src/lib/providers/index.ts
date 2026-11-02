import { anthropicProvider } from './anthropic';
import { demoProvider } from './demo';
import { geminiProvider } from './gemini';
import { ollamaProvider } from './ollama';
import { openaiProvider } from './openai';
import type { ProviderDef, ProviderId } from './types';

export * from './types';

export const PROVIDERS: ProviderDef[] = [demoProvider, anthropicProvider, openaiProvider, geminiProvider, ollamaProvider];

export function getProvider(id: ProviderId): ProviderDef {
  return PROVIDERS.find((p) => p.id === id) ?? demoProvider;
}
