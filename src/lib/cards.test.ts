import { describe, expect, it } from 'vitest';
import { cardKey, extractCards, hasOpenCardsFence } from './cards';

describe('cards block parsing', () => {
  it('extracts a fenced JSON array and strips it from the visible text', () => {
    const text = 'Bonjour ! On dit **une baguette**.\n\n```cards\n[{"front":"une baguette","back":"a baguette","hint":"yn ba-get","tags":["food"]}]\n```\n';
    const { visible, cards } = extractCards(text);
    expect(visible).toBe('Bonjour ! On dit **une baguette**.');
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ front: 'une baguette', back: 'a baguette', hint: 'yn ba-get', tags: ['food'] });
  });

  it('ignores malformed blocks and cards missing a side', () => {
    const { cards } = extractCards('```cards\nnot json\n```');
    expect(cards).toEqual([]);
    const r = extractCards('```cards\n[{"front":"x"},{"front":"y","back":"z"}]\n```');
    expect(r.cards.map((c) => c.front)).toEqual(['y']);
  });

  it('tolerates a single object and trailing commas', () => {
    const r = extractCards('```cards\n{"front":"hola","back":"hello"},\n```');
    expect(r.cards).toHaveLength(1);
  });

  it('detects an unclosed fence while streaming', () => {
    expect(hasOpenCardsFence('text ```cards\n[{"fr')).toBe(true);
    expect(hasOpenCardsFence('text ```cards\n[]\n```')).toBe(false);
    expect(hasOpenCardsFence('no fence')).toBe(false);
  });

  it('builds case-insensitive dedupe keys', () => {
    expect(cardKey('French', ' Une  Baguette ')).toBe(cardKey('french', 'une baguette'));
  });
});
