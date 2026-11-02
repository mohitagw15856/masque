import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { exportAll, exportAnkiTsv, getDeckStats, importAll } from '../lib/deck';
import type { Mask } from '../masks';
import { touchDb, useAsync } from '../hooks';

export function Deck({ masks, onReview }: { masks: Mask[]; onReview: () => void }) {
  const stats = useAsync(getDeckStats, []);
  const [q, setQ] = useState('');
  const [lang, setLang] = useState<string>('');
  const [note, setNote] = useState<string | null>(null);
  const cards = useLiveQuery(() => db.cards.orderBy('createdAt').reverse().toArray(), [], []);
  const filtered = cards.filter(
    (c) => (!lang || c.language === lang) && (!q || `${c.front} ${c.back} ${c.hint ?? ''} ${c.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())),
  );

  function download(name: string, text: string, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onImport(file: File) {
    try {
      const r = await importAll(await file.text());
      setNote(`Imported ${r.cards} new card${r.cards === 1 ? '' : 's'}.`);
      touchDb();
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Import failed');
    }
  }

  const max = Math.max(1, ...(stats?.forecast.map((f) => f.count) ?? [1]));

  return (
    <section className="panel deck">
      <header className="panel-head">
        <h2>Deck</h2>
        <button className="btn primary" onClick={onReview} disabled={!stats?.dueNow && !stats?.new}>
          Review {stats?.dueNow ? `${stats.dueNow} due` : stats?.new ? `${Math.min(stats.new, 15)} new` : ''}
        </button>
      </header>

      {stats && (
        <>
          <div className="tiles">
            <Tile label="cards" value={stats.total} />
            <Tile label="learned" value={stats.learned} />
            <Tile label="mature" value={stats.mature} hint="21d+ interval" />
            <Tile label="retention" value={`${stats.retention}%`} hint="last 30 days" />
            <Tile label="streak" value={`${stats.streak}d`} />
          </div>
          <div className="forecast">
            <div className="forecast-title">Due over the next week</div>
            <div className="bars">
              {stats.forecast.map((f) => (
                <div key={f.label} className="bar">
                  <i style={{ height: `${Math.round((f.count / max) * 100)}%` }} title={`${f.count}`} />
                  <small>{f.label}</small>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="toolbar">
        <input placeholder="Search cards…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">All languages</option>
          {stats?.byLanguage.map((l) => (
            <option key={l.language} value={l.language}>{l.language} ({l.count})</option>
          ))}
        </select>
        <button className="btn ghost" onClick={async () => download('masque-export.json', await exportAll())}>Export JSON</button>
        <button className="btn ghost" onClick={async () => download(`masque-${lang || 'all'}.txt`, await exportAnkiTsv(lang || undefined), 'text/plain')}>Export for Anki</button>
        <label className="btn ghost">
          Import
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </label>
      </div>
      {note && <p className="muted">{note}</p>}

      {filtered.length === 0 ? (
        <p className="muted empty">No cards yet. Every mask ends its turn with the words it taught — they land here automatically.</p>
      ) : (
        <ul className="card-list">
          {filtered.map((c) => {
            const m = masks.find((x) => x.id === c.maskId);
            return (
              <li key={c.id} className="card-row" style={{ ['--mask' as string]: m?.color ?? '#a855f7' }}>
                <span className="card-row-emoji">{m?.emoji ?? '🎭'}</span>
                <div className="card-row-main">
                  <strong>{c.front}</strong>
                  <span>{c.back}</span>
                  {c.hint && <small>{c.hint}</small>}
                </div>
                <div className="card-row-meta">
                  <span className={`pill ${c.state}`}>{c.state}</span>
                  <small>{c.state === 'new' ? 'unseen' : c.interval ? `every ${c.interval}d` : 'learning'}</small>
                  <button className="chip quiet" title="Delete" onClick={() => db.cards.delete(c.id!).then(touchDb)}>✕</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Tile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="tile">
      <strong>{value}</strong>
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}
