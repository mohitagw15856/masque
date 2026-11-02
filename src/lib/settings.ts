import type { ProviderId } from './providers/types';

export interface Settings {
  provider: ProviderId;
  model: string;
  /** Keyed by provider so switching back keeps the key. */
  keys: Partial<Record<ProviderId, string>>;
  /** For OpenAI-compatible endpoints (OpenRouter, Groq, LM Studio) and Ollama. */
  baseUrls: Partial<Record<ProviderId, string>>;
  newPerDay: number;
  /** The language the tutor explains things in. */
  nativeLanguage: string;
  theme: 'auto' | 'light' | 'dark';
  tts: boolean;
  onboarded: boolean;
}

const KEY = 'masque.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  provider: 'demo',
  model: '',
  keys: {},
  baseUrls: {},
  newPerDay: 15,
  nativeLanguage: 'English',
  theme: 'auto',
  tts: true,
  onboarded: false,
};

let cache: Settings | null = null;
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULT_SETTINGS };
  } catch {
    cache = { ...DEFAULT_SETTINGS };
  }
  return cache;
}

export function saveSettings(patch: Partial<Settings>): Settings {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private mode: settings live for the session only */
  }
  listeners.forEach((l) => l());
  return cache;
}

export function subscribeSettings(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Wipe keys only. Cards and chats stay. */
export function forgetKeys(): void {
  saveSettings({ keys: {} });
}
