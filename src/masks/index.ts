import { BUILTIN_MASKS } from './builtin';
import type { Mask } from './types';

export * from './types';
export { BUILTIN_MASKS } from './builtin';
export { buildSystemPrompt } from './prompt';

const KEY = 'masque.masks.v1';
const listeners = new Set<() => void>();

function loadCustom(): Mask[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Mask[]) : [];
  } catch {
    return [];
  }
}

function saveCustom(masks: Mask[]): void {
  localStorage.setItem(KEY, JSON.stringify(masks));
  listeners.forEach((l) => l());
}

export function getMasks(): Mask[] {
  return [...BUILTIN_MASKS, ...loadCustom()];
}

export function getMask(id: string): Mask | undefined {
  return getMasks().find((m) => m.id === id);
}

export function upsertMask(mask: Mask): void {
  const custom = loadCustom().filter((m) => m.id !== mask.id);
  saveCustom([...custom, { ...mask, builtin: false }]);
}

export function deleteMask(id: string): void {
  saveCustom(loadCustom().filter((m) => m.id !== id));
}

export function subscribeMasks(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function newMaskId(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mask'}-${Date.now().toString(36)}`;
}

/** Share a mask as a URL fragment so people can swap masks without a server. */
export function encodeMask(mask: Mask): string {
  const { builtin: _b, ...rest } = mask;
  return btoa(unescape(encodeURIComponent(JSON.stringify(rest))));
}

export function decodeMask(s: string): Mask | null {
  try {
    const m = JSON.parse(decodeURIComponent(escape(atob(s)))) as Mask;
    if (!m.name || !m.language || !m.persona) return null;
    return { ...m, builtin: false };
  } catch {
    return null;
  }
}
