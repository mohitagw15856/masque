import { useState } from 'react';
import { deleteMask, encodeMask, newMaskId, upsertMask, type Level, type Mask } from '../masks';

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const COLORS = ['#ff7a59', '#a855f7', '#2bb3a3', '#5b6cff', '#e08a1e', '#e94f8a', '#8bc34a', '#4fc3f7', '#f2c84b', '#c77dff'];

const blank = (): Mask => ({
  id: '',
  name: '',
  emoji: '🎭',
  language: '',
  langCode: 'en-US',
  level: 'A1',
  tagline: '',
  persona: '',
  method: '',
  greeting: '',
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

export function Masks({ masks, onUse }: { masks: Mask[]; onUse: (id: string) => void }) {
  const [editing, setEditing] = useState<Mask | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function share(m: Mask) {
    const url = `${location.origin}${location.pathname}#mask=${encodeMask(m)}`;
    navigator.clipboard?.writeText(url);
    setCopied(m.id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (editing) return <MaskEditor mask={editing} onCancel={() => setEditing(null)} onSave={(m) => { upsertMask(m); setEditing(null); onUse(m.id); }} />;

  return (
    <section className="panel masks">
      <header className="panel-head">
        <h2>Masks</h2>
        <button className="btn primary" onClick={() => setEditing(blank())}>+ New mask</button>
      </header>
      <p className="muted">A mask is a character, not a language. Make a mask for your actual teacher, a TV character, a future in-law. Share one with a link.</p>
      <div className="mask-grid">
        {masks.map((m) => (
          <article key={m.id} className="mask-card" style={{ ['--mask' as string]: m.color }}>
            <div className="mask-card-top">
              <span className="mask-emoji big">{m.emoji}</span>
              <div>
                <h3>{m.name}</h3>
                <small>{m.language} · {m.level}</small>
              </div>
            </div>
            <p>{m.tagline}</p>
            <div className="mask-card-actions">
              <button className="btn primary" onClick={() => onUse(m.id)}>Talk</button>
              <button className="btn ghost" onClick={() => setEditing({ ...m, id: m.builtin ? newMaskId(m.name) : m.id, name: m.builtin ? `${m.name} (remix)` : m.name, builtin: false })}>
                {m.builtin ? 'Remix' : 'Edit'}
              </button>
              <button className="btn ghost" onClick={() => share(m)}>{copied === m.id ? 'Copied!' : 'Share'}</button>
              {!m.builtin && <button className="btn ghost danger" onClick={() => confirm(`Delete ${m.name}?`) && deleteMask(m.id)}>Delete</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MaskEditor({ mask, onSave, onCancel }: { mask: Mask; onSave: (m: Mask) => void; onCancel: () => void }) {
  const [m, setM] = useState<Mask>(mask);
  const set = (k: keyof Mask) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setM({ ...m, [k]: e.target.value });
  const valid = m.name.trim() && m.language.trim() && m.persona.trim();

  return (
    <section className="panel editor" style={{ ['--mask' as string]: m.color }}>
      <header className="panel-head"><h2>{mask.id ? 'Edit mask' : 'New mask'}</h2></header>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave({ ...m, id: m.id || newMaskId(m.name), greeting: m.greeting.trim() || `Hello! I'm ${m.name}. Let's practise ${m.language}. How are you today?`, tagline: m.tagline.trim() || `${m.language} with ${m.name}.` });
        }}
      >
        <div className="two">
          <label><span>Emoji</span><input value={m.emoji} onChange={set('emoji')} maxLength={4} /></label>
          <label><span>Name</span><input value={m.name} onChange={set('name')} placeholder="Tía Rosa" required /></label>
          <label><span>Language</span><input value={m.language} onChange={set('language')} placeholder="Spanish" required /></label>
          <label><span>Speech code</span><input value={m.langCode} onChange={set('langCode')} placeholder="es-MX" /><small>BCP-47, for the read-aloud voice.</small></label>
          <label>
            <span>Level</span>
            <select value={m.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label>
            <span>Colour</span>
            <div className="swatches">{COLORS.map((c) => <button key={c} type="button" className={`swatch ${m.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setM({ ...m, color: c })} />)}</div>
          </label>
        </div>
        <label><span>Tagline</span><input value={m.tagline} onChange={set('tagline')} placeholder="Runs a taquería in Oaxaca, corrects your subjunctive." /></label>
        <label><span>Who they are</span><textarea rows={3} value={m.persona} onChange={set('persona')} placeholder="You are Rosa, 55, who runs a taquería in Oaxaca…" required /></label>
        <label><span>How they teach</span><textarea rows={3} value={m.method} onChange={set('method')} placeholder="Correct one thing per turn. Teach food words and the subjunctive through orders…" /></label>
        <label><span>Opening line</span><textarea rows={2} value={m.greeting} onChange={set('greeting')} placeholder="¡Hola! ¿Qué te preparo hoy?" /></label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={!valid}>Save & talk</button>
          <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
