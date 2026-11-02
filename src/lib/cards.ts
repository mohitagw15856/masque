/**
 * Masks teach in prose and hand back flashcards in a fenced ```cards block.
 * This module finds that block, validates it, and strips it from the visible reply.
 * It works with any provider because it is just text.
 */

export interface ProposedCard {
  front: string;
  back: string;
  /** Pronunciation, reading, register note. Shown after reveal. */
  hint?: string;
  /** A short example sentence in the target language. */
  example?: string;
  tags?: string[];
}

const FENCE = /```cards\s*\n([\s\S]*?)```/g;

export function extractCards(text: string): { visible: string; cards: ProposedCard[] } {
  const cards: ProposedCard[] = [];
  const visible = text
    .replace(FENCE, (_m, body: string) => {
      cards.push(...parseCardsBody(body));
      return '';
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { visible, cards };
}

/** True while a reply is still streaming and has opened a ```cards fence it has not closed. */
export function hasOpenCardsFence(text: string): boolean {
  const open = text.lastIndexOf('```cards');
  if (open === -1) return false;
  return text.indexOf('```', open + 8) === -1;
}

export function parseCardsBody(body: string): ProposedCard[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Tolerate a trailing comma or a bare object.
    try {
      parsed = JSON.parse(`[${trimmed.replace(/,\s*$/, '')}]`);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const out: ProposedCard[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const front = str(o.front);
    const back = str(o.back);
    if (!front || !back) continue;
    out.push({
      front,
      back,
      hint: str(o.hint) || undefined,
      example: str(o.example) || undefined,
      tags: Array.isArray(o.tags) ? o.tags.map(String).filter(Boolean).slice(0, 6) : undefined,
    });
  }
  return out;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
}

/** Key used to de-duplicate cards across conversations. */
export function cardKey(language: string, front: string): string {
  return `${language.toLowerCase()}::${front.toLowerCase().replace(/\s+/g, ' ').trim()}`;
}
