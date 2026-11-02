import { ProviderError, readError, sseData, type ProviderDef } from './types';

/** OpenAI, and anything that speaks its chat-completions shape (OpenRouter, Groq, LM Studio, Together…). */
export const openaiProvider: ProviderDef = {
  id: 'openai',
  label: 'OpenAI / compatible',
  needsKey: true,
  keyPlaceholder: 'sk-…',
  keyHelp: 'Any OpenAI-compatible key works; set the base URL for OpenRouter, Groq or LM Studio.',
  keyUrl: 'https://platform.openai.com/api-keys',
  models: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini'],
  defaultModel: 'gpt-5-mini',
  defaultBaseUrl: 'https://api.openai.com/v1',
  baseUrlHelp: 'e.g. https://openrouter.ai/api/v1 or http://localhost:1234/v1',
  async *stream({ apiKey, model, baseUrl, system, messages, signal }) {
    if (!apiKey) throw new ProviderError('Add your API key in Settings.');
    const url = `${(baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, stream: true, messages: [{ role: 'system', content: system }, ...messages] }),
    });
    if (!res.ok) throw await readError(res);
    for await (const data of sseData(res)) {
      if (data === '[DONE]') return;
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const t = j.choices?.[0]?.delta?.content;
        if (t) yield t;
      } catch {
        /* keep-alive or partial line */
      }
    }
  },
};
