import { db, type Card, type ReviewLog } from './db';
import { cardKey, type ProposedCard } from './cards';
import { applyGrade, DAY_MS, endOfToday, isMature, newSrsState, sortDue, type Grade } from './srs';
import { getSettings } from './settings';

/** Save proposed cards, skipping any front already in the deck for that language. Returns how many were new. */
export async function addCards(proposed: ProposedCard[], language: string, maskId: string): Promise<number> {
  const now = Date.now();
  let added = 0;
  await db.transaction('rw', db.cards, async () => {
    for (const p of proposed) {
      const key = cardKey(language, p.front);
      const exists = await db.cards.where('key').equals(key).first();
      if (exists) continue;
      await db.cards.add({
        ...newSrsState(now),
        key,
        language,
        front: p.front,
        back: p.back,
        hint: p.hint,
        example: p.example,
        tags: p.tags ?? [],
        maskId,
        createdAt: now,
      });
      added += 1;
    }
  });
  return added;
}

export async function getDueCards(language?: string): Promise<Card[]> {
  const cutoff = endOfToday();
  let coll = db.cards.where('due').belowOrEqual(cutoff).and((c) => c.state !== 'new');
  if (language) coll = coll.and((c) => c.language === language);
  return sortDue(await coll.toArray());
}

export async function getNewCardsForToday(language?: string): Promise<Card[]> {
  const { newPerDay } = getSettings();
  if (newPerDay <= 0) return [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const introduced = await db.reviewLogs
    .where('date')
    .aboveOrEqual(start.getTime())
    .and((l) => l.stateBefore === 'new')
    .toArray();
  const remaining = Math.max(0, newPerDay - new Set(introduced.map((l) => l.cardId)).size);
  if (remaining === 0) return [];
  let news = await db.cards.where('state').equals('new').sortBy('createdAt');
  if (language) news = news.filter((c) => c.language === language);
  return news.slice(0, remaining);
}

export async function reviewCard(card: Card, grade: Grade): Promise<Card> {
  const before = card.state;
  const updated = applyGrade(card, grade);
  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    await db.cards.put(updated);
    const log: ReviewLog = {
      cardId: card.id!,
      date: Date.now(),
      grade,
      stateBefore: before,
      intervalAfter: updated.interval,
    };
    await db.reviewLogs.add(log);
  });
  return updated;
}

export interface DeckStats {
  total: number;
  learned: number;
  mature: number;
  new: number;
  dueNow: number;
  retention: number;
  streak: number;
  forecast: { label: string; count: number }[];
  byLanguage: { language: string; count: number }[];
}

export async function getDeckStats(): Promise<DeckStats> {
  const cards = await db.cards.toArray();
  const cutoff = endOfToday();
  const since = Date.now() - 30 * DAY_MS;
  const logs = await db.reviewLogs.where('date').aboveOrEqual(since).toArray();
  const reviewLogs = logs.filter((l) => l.stateBefore === 'review');
  const retention =
    reviewLogs.length === 0 ? 100 : Math.round((reviewLogs.filter((l) => l.grade > 0).length / reviewLogs.length) * 100);

  const forecast: DeckStats['forecast'] = [];
  for (let i = 0; i < 7; i++) {
    const from = cutoff + (i - 1) * DAY_MS + 1;
    const to = cutoff + i * DAY_MS;
    const count = cards.filter((c) => c.state !== 'new' && c.due > (i === 0 ? 0 : from) && c.due <= to).length;
    const d = new Date(Date.now() + i * DAY_MS);
    forecast.push({ label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }), count });
  }

  const days = new Set(logs.map((l) => new Date(l.date).toDateString()));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(Date.now() - i * DAY_MS).toDateString();
    if (days.has(d)) streak += 1;
    else if (i > 0) break;
  }

  const byLang = new Map<string, number>();
  for (const c of cards) byLang.set(c.language, (byLang.get(c.language) ?? 0) + 1);

  return {
    total: cards.length,
    learned: cards.filter((c) => c.state !== 'new').length,
    mature: cards.filter(isMature).length,
    new: cards.filter((c) => c.state === 'new').length,
    dueNow: cards.filter((c) => c.state !== 'new' && c.due <= cutoff).length,
    retention,
    streak,
    forecast,
    byLanguage: [...byLang].map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count),
  };
}

/** Everything the user owns, as one JSON file. Keys are never included. */
export async function exportAll(): Promise<string> {
  const [cards, reviewLogs, conversations, messages] = await Promise.all([
    db.cards.toArray(),
    db.reviewLogs.toArray(),
    db.conversations.toArray(),
    db.messages.toArray(),
  ]);
  return JSON.stringify({ app: 'masque', version: 1, exportedAt: new Date().toISOString(), cards, reviewLogs, conversations, messages }, null, 2);
}

export async function importAll(json: string): Promise<{ cards: number }> {
  const data = JSON.parse(json) as { app?: string; cards?: Card[]; reviewLogs?: ReviewLog[]; conversations?: unknown[]; messages?: unknown[] };
  if (data.app !== 'masque' || !Array.isArray(data.cards)) throw new Error('Not a Masque export');
  let n = 0;
  await db.transaction('rw', db.cards, db.reviewLogs, async () => {
    for (const c of data.cards!) {
      const { id: _id, ...rest } = c;
      const exists = await db.cards.where('key').equals(rest.key).first();
      if (exists) continue;
      await db.cards.add(rest);
      n += 1;
    }
  });
  return { cards: n };
}

/** Tab-separated front/back/hint for Anki's text importer. */
export async function exportAnkiTsv(language?: string): Promise<string> {
  let cards = await db.cards.toArray();
  if (language) cards = cards.filter((c) => c.language === language);
  const esc = (s = '') => s.replace(/\t/g, ' ').replace(/\n/g, '<br>');
  return cards.map((c) => [esc(c.front), esc(c.back), esc(c.hint), esc(c.example), (c.tags ?? []).join(' ')].join('\t')).join('\n');
}
