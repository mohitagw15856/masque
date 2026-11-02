import { Logo } from './Logo';
import { ProviderForm } from './Settings';
import { saveSettings } from '../lib/settings';

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="brand big"><Logo size={44} /><span>Masque</span></div>
        <h1>Put on a mask.<br />Learn a language.</h1>
        <p className="muted">
          Every mask is a character who teaches by talking to you. Everything they teach becomes a flashcard, scheduled with spaced repetition. Bring your own key, or try the demo.
        </p>
        <ProviderForm compact />
        <button className="btn primary wide" onClick={() => { saveSettings({ onboarded: true }); onDone(); }}>Start talking</button>
        <p className="muted small">No account. No server. Keys and cards stay in this browser.</p>
      </div>
    </div>
  );
}
