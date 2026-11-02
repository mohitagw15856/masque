import { useEffect, useState } from 'react';
import { Chat } from './components/Chat';
import { Deck } from './components/Deck';
import { Masks } from './components/Masks';
import { Onboarding } from './components/Onboarding';
import { Review } from './components/Review';
import { Settings } from './components/Settings';
import { Sidebar, type View } from './components/Sidebar';
import { useAsync, useMasks, useSettings } from './hooks';
import { getDueCards, getNewCardsForToday } from './lib/deck';
import { decodeMask, upsertMask } from './masks';

export default function App() {
  const settings = useSettings();
  const masks = useMasks();
  const [view, setView] = useState<View>('chat');
  const [maskId, setMaskId] = useState<string>(() => localStorage.getItem('masque.activeMask') ?? masks[0].id);
  const mask = masks.find((m) => m.id === maskId) ?? masks[0];

  const due = useAsync(async () => (await getDueCards()).length + (await getNewCardsForToday()).length, [view]);

  useEffect(() => {
    localStorage.setItem('masque.activeMask', mask.id);
  }, [mask.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Shared masks arrive as #mask=<base64>.
  useEffect(() => {
    const m = new URLSearchParams(location.hash.slice(1)).get('mask');
    if (!m) return;
    const decoded = decodeMask(m);
    history.replaceState(null, '', location.pathname + location.search);
    if (decoded && confirm(`Add the mask “${decoded.name}” (${decoded.language}) to your collection?`)) {
      upsertMask(decoded);
      setMaskId(decoded.id);
      setView('chat');
    }
  }, []);

  if (!settings.onboarded) return <Onboarding onDone={() => setView('chat')} />;

  return (
    <div className="app">
      <Sidebar
        masks={masks}
        activeMaskId={mask.id}
        view={view}
        dueCount={due ?? 0}
        onPickMask={(id) => {
          setMaskId(id);
          setView('chat');
        }}
        onView={setView}
      />
      <main className="main">
        {view === 'chat' && <Chat key={mask.id} mask={mask} onOpenSettings={() => setView('settings')} onOpenReview={() => setView('review')} />}
        {view === 'review' && <Review masks={masks} onDone={() => setView('chat')} />}
        {view === 'deck' && <Deck masks={masks} onReview={() => setView('review')} />}
        {view === 'masks' && (
          <Masks
            masks={masks}
            onUse={(id) => {
              setMaskId(id);
              setView('chat');
            }}
          />
        )}
        {view === 'settings' && <Settings />}
      </main>
    </div>
  );
}
