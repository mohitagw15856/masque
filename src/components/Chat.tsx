import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Message } from '../lib/db';
import { addCards } from '../lib/deck';
import { extractCards, hasOpenCardsFence } from '../lib/cards';
import { getProvider, ProviderError } from '../lib/providers';
import { renderMarkdown, stripMarkdown } from '../lib/markdown';
import { canSpeak, speak } from '../lib/speech';
import { buildSystemPrompt, type Mask } from '../masks';
import { touchDb, useSettings } from '../hooks';

interface Props {
  mask: Mask;
  onOpenSettings: () => void;
  onOpenReview: () => void;
}

export function Chat({ mask, onOpenSettings, onOpenReview }: Props) {
  const settings = useSettings();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Find or start the latest conversation for this mask.
  useEffect(() => {
    let alive = true;
    (async () => {
      const latest = await db.conversations.where('maskId').equals(mask.id).reverse().sortBy('updatedAt');
      if (!alive) return;
      if (latest[0]?.id) setConversationId(latest[0].id);
      else setConversationId(await startConversation(mask));
    })();
    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, [mask]);

  const messages = useLiveQuery(
    () => (conversationId ? db.messages.where('conversationId').equals(conversationId).sortBy('createdAt') : Promise.resolve([] as Message[])),
    [conversationId],
    [] as Message[],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, streaming]);

  async function send() {
    const text = draft.trim();
    if (!text || !conversationId || streaming !== null) return;
    setDraft('');
    setError(null);
    const now = Date.now();
    await db.messages.add({ conversationId, role: 'user', content: text, createdAt: now });
    await db.conversations.update(conversationId, { updatedAt: now });

    const provider = getProvider(settings.provider);
    const history = [...messages, { role: 'user' as const, content: text }]
      .slice(-24)
      .map((m) => ({ role: m.role, content: m.role === 'assistant' ? extractCards(m.content).visible : m.content }));

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming('');
    let raw = '';
    try {
      for await (const delta of provider.stream({
        apiKey: settings.keys[settings.provider] ?? '',
        model: settings.model || provider.defaultModel,
        baseUrl: settings.baseUrls[settings.provider],
        system: buildSystemPrompt(mask, settings.nativeLanguage),
        messages: history,
        signal: ctrl.signal,
        maskId: mask.id,
      })) {
        raw += delta;
        setStreaming(raw);
      }
      const { cards } = extractCards(raw);
      const language = mask.language === 'Any' ? guessLanguage(messages) : mask.language;
      const added = cards.length ? await addCards(cards, language, mask.id) : 0;
      await db.messages.add({ conversationId, role: 'assistant', content: raw, cardsAdded: added, createdAt: Date.now() });
      await db.conversations.update(conversationId, { updatedAt: Date.now() });
      touchDb();
      if (settings.tts && canSpeak()) speak(stripMarkdown(extractCards(raw).visible), mask.langCode);
    } catch (e) {
      if (ctrl.signal.aborted) {
        if (raw) await db.messages.add({ conversationId, role: 'assistant', content: raw, createdAt: Date.now() });
      } else {
        setError(e instanceof ProviderError ? e.message : e instanceof Error ? e.message : String(e));
      }
    } finally {
      setStreaming(null);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  async function newChat() {
    abortRef.current?.abort();
    setConversationId(await startConversation(mask));
  }

  const provider = getProvider(settings.provider);
  const needsKey = provider.needsKey && !settings.keys[settings.provider];

  return (
    <section className="chat" style={{ ['--mask' as string]: mask.color }}>
      <header className="chat-head">
        <div className="chat-head-id">
          <span className="mask-emoji">{mask.emoji}</span>
          <div>
            <h2>{mask.name}</h2>
            <p>
              {mask.language} · {mask.level} · <span className="muted">{provider.label}{settings.provider === 'demo' ? '' : ` · ${settings.model || provider.defaultModel}`}</span>
            </p>
          </div>
        </div>
        <div className="chat-head-actions">
          <button className="btn ghost" onClick={newChat} title="Start a fresh conversation">New chat</button>
        </div>
      </header>

      {settings.provider === 'demo' && (
        <div className="banner">
          <span>Demo mode: scripted replies, no key. </span>
          <button className="link" onClick={onOpenSettings}>Add a key</button> to talk to a real model.
        </div>
      )}
      {needsKey && (
        <div className="banner warn">
          {provider.label} needs an API key. <button className="link" onClick={onOpenSettings}>Open settings</button>
        </div>
      )}

      <div className="messages">
        {messages.map((m) => (
          <Bubble key={m.id} message={m} mask={mask} onReview={onOpenReview} />
        ))}
        {streaming !== null && (
          <div className="bubble assistant streaming">
            <span className="avatar">{mask.emoji}</span>
            <div className="bubble-body">
              <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(visibleWhileStreaming(streaming)) }} />
              {hasOpenCardsFence(streaming) && <span className="chip pulse">✦ writing cards…</span>}
              {!streaming && <span className="dots"><i /><i /><i /></span>}
            </div>
          </div>
        )}
        {error && (
          <div className="bubble error">
            <div className="bubble-body">
              <strong>Couldn’t reach {provider.label}.</strong> {error}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          placeholder={`Reply to ${mask.name}…`}
          title="Enter to send, Shift+Enter for a new line"
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          autoFocus
        />
        {streaming !== null ? (
          <button type="button" className="btn" onClick={() => abortRef.current?.abort()}>Stop</button>
        ) : (
          <button type="submit" className="btn primary" disabled={!draft.trim()}>Send</button>
        )}
      </form>
    </section>
  );
}

function Bubble({ message, mask, onReview }: { message: Message; mask: Mask; onReview: () => void }) {
  const isUser = message.role === 'user';
  const { visible, cards } = isUser ? { visible: message.content, cards: [] } : extractCards(message.content);
  return (
    <div className={`bubble ${message.role}`}>
      {!isUser && <span className="avatar">{mask.emoji}</span>}
      <div className="bubble-body">
        <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(visible) }} />
        {!isUser && (
          <div className="bubble-foot">
            {cards.length > 0 && (
              <button className="chip" onClick={onReview} title={cards.map((c) => c.front).join(', ')}>
                ✦ {message.cardsAdded ?? cards.length} card{(message.cardsAdded ?? cards.length) === 1 ? '' : 's'}
                {message.cardsAdded !== undefined && message.cardsAdded < cards.length ? ` (${cards.length - message.cardsAdded} already known)` : ''}
              </button>
            )}
            {canSpeak() && (
              <button className="chip quiet" onClick={() => speak(stripMarkdown(visible), mask.langCode)} title="Listen">
                🔊
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function visibleWhileStreaming(raw: string): string {
  const i = raw.lastIndexOf('```cards');
  return extractCards(i === -1 ? raw : raw.slice(0, i)).visible;
}

async function startConversation(mask: Mask): Promise<number> {
  const now = Date.now();
  const id = (await db.conversations.add({ maskId: mask.id, title: `${mask.name} · ${new Date(now).toLocaleDateString()}`, createdAt: now, updatedAt: now })) as number;
  await db.messages.add({ conversationId: id, role: 'assistant', content: mask.greeting, createdAt: now });
  return id;
}

/** For "Any"-language masks, read the language the learner named earlier in the chat. */
function guessLanguage(messages: Message[]): string {
  const names = ['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Mandarin', 'Chinese', 'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish', 'Turkish', 'Polish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Tagalog', 'Swahili', 'English'];
  for (const m of [...messages].reverse()) {
    if (m.role !== 'user') continue;
    const hit = names.find((n) => new RegExp(`\\b${n}\\b`, 'i').test(m.content));
    if (hit) return hit === 'Chinese' ? 'Mandarin Chinese' : hit;
  }
  return 'Mixed';
}
