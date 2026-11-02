import { readError, type ProviderDef } from './types';

/**
 * Local models. Ollama blocks browser origins by default, so the user runs:
 *   OLLAMA_ORIGINS="*" ollama serve
 * (or sets it in launchd / systemd). Documented in Settings and the README.
 */
export const ollamaProvider: ProviderDef = {
  id: 'ollama',
  label: 'Ollama (local)',
  needsKey: false,
  models: ['llama3.2', 'qwen2.5:7b', 'gemma3', 'mistral'],
  defaultModel: 'llama3.2',
  defaultBaseUrl: 'http://localhost:11434',
  baseUrlHelp: 'Start Ollama with OLLAMA_ORIGINS="*" so the browser may call it.',
  async *stream({ model, baseUrl, system, messages, signal }) {
    const url = `${(baseUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`;
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, stream: true, messages: [{ role: 'system', content: system }, ...messages] }),
    });
    if (!res.ok) throw await readError(res);
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const j = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (j.message?.content) yield j.message.content;
          if (j.done) return;
        } catch {
          /* partial */
        }
      }
    }
  },
};
