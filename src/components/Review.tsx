import { useEffect, useMemo, useState } from 'react';
import type { Card } from '../lib/db';
import { getDueCards, getNewCardsForToday, reviewCard } from '../lib/deck';
import { previewIntervals, type Grade } from '../lib/srs';
import { canSpeak, speak } from '../lib/speech';
import type { Mask } from '../masks';
import { touchDb, useSettings } from '../hooks';

const GRADES: { g: Grade; label: string; key: string; cls: string }[] = [
  { g: 0, label: 'Again', key: '1', cls: 'again' },
  { g: 1, label: 'Hard', key: '2', cls: 'hard' },
  { g: 2, label: 'Good', key: '3', cls: 'good' },
  { g: 3, label: 'Easy', key: '4', cls: 'easy' },
];

export function Review({ masks, onDone }: { masks: Mask[]; onDone: () => void }) {
  const settings = useSettings();
  const [queue, setQueue] = useState<Card[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [startCount, setStartCount] = useState(0);

  useEffect(() => {
    (async () => {
      const q = [...(await getDueCards()), ...(await getNewCardsForToday())];
      setQueue(q);
      setStartCount(q.length);
    })();
  }, []);

  const card = queue?.[0];
  const mask = useMemo(() => masks.find((m) => m.id === card?.maskId), [masks, card]);
  const preview = useMemo(() => (card ? previewIntervals(card) : null), [card]);

  useEffect(() => {
    if (card && settings.tts && canSpeak() && !revealed) speak(card.front, mask?.langCode ?? 'en-US');
  }, [card, revealed, settings.tts, mask]);

  async function grade(g: Grade) {
    if (!card || !queue) return;
    const updated = await reviewCard(card, g);
    const rest = queue.slice(1);
    // Learning cards come back later in the same session.
    if (updated.state === 'learning') rest.push(updated);
    else setDone((d) => d + 1);
    setQueue(rest);
    setRevealed(false);
    touchDb();
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        else grade(2);
      }
      const hit = GRADES.find((x) => x.key === e.key);
      if (hit && revealed) grade(hit.g);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  if (queue === null) return <section className="panel center"><p className="muted">Loading…</p></section>;

  if (!card) {
    return (
      <section className="panel center review-done">
        <div className="big-emoji">{startCount === 0 ? '🌱' : '🎉'}</div>
        <h2>{startCount === 0 ? 'Nothing due' : `Done — ${done} card${done === 1 ? '' : 's'} reviewed`}</h2>
        <p className="muted">
          {startCount === 0
            ? 'Chat with a mask and every new word it teaches lands here, scheduled by SM-2.'
            : 'Come back tomorrow. The intervals grow every time you remember.'}
        </p>
        <button className="btn primary" onClick={onDone}>Back to chat</button>
      </section>
    );
  }

  const progress = startCount ? Math.round(((startCount - queue.length) / startCount) * 100) : 0;

  return (
    <section className="panel review" style={{ ['--mask' as string]: mask?.color ?? '#a855f7' }}>
      <div className="review-top">
        <span className="chip quiet">{mask?.emoji ?? '🎭'} {mask?.name ?? 'Mask'} · {card.language}</span>
        <span className="muted">{queue.length} left</span>
      </div>
      <div className="progress"><i style={{ width: `${progress}%` }} /></div>

      <div className={`flashcard ${revealed ? 'revealed' : ''}`} onClick={() => !revealed && setRevealed(true)}>
        <div className="flash-state">{card.state === 'new' ? 'new' : card.state}</div>
        <div className="flash-front">{card.front}</div>
        {revealed ? (
          <div className="flash-back">
            <div className="flash-answer">{card.back}</div>
            {card.hint && <div className="flash-hint">{card.hint}</div>}
            {card.example && <div className="flash-example">“{card.example}”</div>}
            {card.tags.length > 0 && <div className="flash-tags">{card.tags.map((t) => <span key={t}>#{t}</span>)}</div>}
          </div>
        ) : (
          <div className="flash-prompt">tap or press space to reveal</div>
        )}
        {canSpeak() && (
          <button
            className="chip quiet flash-speak"
            onClick={(e) => {
              e.stopPropagation();
              speak(card.front, mask?.langCode ?? 'en-US');
            }}
          >
            🔊
          </button>
        )}
      </div>

      {revealed ? (
        <div className="grades">
          {GRADES.map(({ g, label, key, cls }) => (
            <button key={g} className={`grade ${cls}`} onClick={() => grade(g)}>
              <span>{label}</span>
              <small>{preview?.[g]}</small>
              <kbd>{key}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <button className="btn primary wide" onClick={() => setRevealed(true)}>Show answer</button>
      )}
    </section>
  );
}
