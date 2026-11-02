import { Logo } from './Logo';
import type { Mask } from '../masks';

export type View = 'chat' | 'review' | 'deck' | 'masks' | 'settings';

interface Props {
  masks: Mask[];
  activeMaskId: string;
  view: View;
  dueCount: number;
  onPickMask: (id: string) => void;
  onView: (v: View) => void;
}

export function Sidebar({ masks, activeMaskId, view, dueCount, onPickMask, onView }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand" onClick={() => onView('chat')} role="button">
        <Logo size={30} />
        <span>Masque</span>
      </div>
      <nav className="nav">
        <NavBtn active={view === 'chat'} onClick={() => onView('chat')} icon="💬" label="Chat" />
        <NavBtn active={view === 'review'} onClick={() => onView('review')} icon="🃏" label="Review" badge={dueCount} />
        <NavBtn active={view === 'deck'} onClick={() => onView('deck')} icon="📚" label="Deck" />
        <NavBtn active={view === 'masks'} onClick={() => onView('masks')} icon="🎭" label="Masks" />
        <NavBtn active={view === 'settings'} onClick={() => onView('settings')} icon="⚙️" label="Settings" />
      </nav>
      <div className="sidebar-title">Masks</div>
      <ul className="mask-list">
        {masks.map((m) => (
          <li key={m.id}>
            <button
              className={`mask-item ${m.id === activeMaskId && view === 'chat' ? 'active' : ''}`}
              style={{ ['--mask' as string]: m.color }}
              onClick={() => onPickMask(m.id)}
            >
              <span className="mask-emoji">{m.emoji}</span>
              <span className="mask-item-text">
                <strong>{m.name}</strong>
                <small>{m.language}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn ghost sidebar-foot" onClick={() => onView('masks')}>+ New mask</button>
    </aside>
  );
}

function NavBtn({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: string; label: string; badge?: number }) {
  return (
    <button className={`nav-btn ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );
}
