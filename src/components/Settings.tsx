import { useState } from 'react';
import { db } from '../lib/db';
import { PROVIDERS, getProvider } from '../lib/providers';
import type { ProviderId } from '../lib/providers';
import { forgetKeys, saveSettings } from '../lib/settings';
import { useSettings } from '../hooks';

export function ProviderForm({ compact = false }: { compact?: boolean }) {
  const s = useSettings();
  const [show, setShow] = useState(false);
  const p = getProvider(s.provider);
  const key = s.keys[s.provider] ?? '';
  const baseUrl = s.baseUrls[s.provider] ?? '';

  return (
    <div className="form">
      <label>
        <span>Provider</span>
        <div className="provider-grid">
          {PROVIDERS.map((x) => (
            <button
              key={x.id}
              type="button"
              className={`provider-btn ${s.provider === x.id ? 'active' : ''}`}
              onClick={() => saveSettings({ provider: x.id as ProviderId, model: '' })}
            >
              {x.label}
            </button>
          ))}
        </div>
      </label>

      {p.needsKey && (
        <label>
          <span>API key</span>
          <div className="row">
            <input
              type={show ? 'text' : 'password'}
              placeholder={p.keyPlaceholder}
              value={key}
              autoComplete="off"
              onChange={(e) => saveSettings({ keys: { ...s.keys, [s.provider]: e.target.value.trim() } })}
            />
            <button type="button" className="btn ghost" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <small>
            {p.keyHelp} {p.keyUrl && <a href={p.keyUrl} target="_blank" rel="noreferrer">Get a key ↗</a>} Stored in this browser only.
          </small>
        </label>
      )}

      {p.id !== 'demo' && (
        <label>
          <span>Model</span>
          <input list={`models-${p.id}`} value={s.model || p.defaultModel} onChange={(e) => saveSettings({ model: e.target.value.trim() })} />
          <datalist id={`models-${p.id}`}>
            {p.models.map((m) => <option key={m} value={m} />)}
          </datalist>
          <small>Pick one or type any model id the provider accepts.</small>
        </label>
      )}

      {p.defaultBaseUrl && (
        <label>
          <span>Base URL</span>
          <input placeholder={p.defaultBaseUrl} value={baseUrl} onChange={(e) => saveSettings({ baseUrls: { ...s.baseUrls, [s.provider]: e.target.value.trim() } })} />
          <small>{p.baseUrlHelp}</small>
        </label>
      )}

      {p.id === 'ollama' && (
        <pre className="code">OLLAMA_ORIGINS="*" ollama serve</pre>
      )}
      {!compact && p.needsKey && (
        <p className="muted small">
          Your key is sent straight from this browser to {p.label}. There is no Masque server. Clear it any time with “Forget keys”.
        </p>
      )}
    </div>
  );
}

export function Settings() {
  const s = useSettings();
  return (
    <section className="panel settings">
      <header className="panel-head"><h2>Settings</h2></header>

      <h3>Model</h3>
      <ProviderForm />

      <h3>Learning</h3>
      <div className="form two">
        <label>
          <span>Explain things in</span>
          <input value={s.nativeLanguage} onChange={(e) => saveSettings({ nativeLanguage: e.target.value })} />
        </label>
        <label>
          <span>New cards per day</span>
          <input type="number" min={0} max={200} value={s.newPerDay} onChange={(e) => saveSettings({ newPerDay: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        <label>
          <span>Theme</span>
          <select value={s.theme} onChange={(e) => saveSettings({ theme: e.target.value as 'auto' | 'light' | 'dark' })}>
            <option value="auto">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={s.tts} onChange={(e) => saveSettings({ tts: e.target.checked })} />
          <span>Read replies and card fronts aloud (browser voices)</span>
        </label>
      </div>

      <h3>Privacy</h3>
      <p className="muted">
        Everything lives in this browser: keys in localStorage, cards and chats in IndexedDB. Nothing is sent anywhere except to the provider you chose, directly.
      </p>
      <div className="row">
        <button className="btn ghost" onClick={() => { forgetKeys(); alert('Keys cleared.'); }}>Forget keys</button>
        <button
          className="btn ghost danger"
          onClick={async () => {
            if (!confirm('Delete every card, review log and chat on this device?')) return;
            await db.delete();
            location.reload();
          }}
        >
          Wipe all data
        </button>
      </div>
    </section>
  );
}
