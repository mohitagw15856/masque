import { ProviderError, readError, sseData, type ProviderDef } from './types';

export const geminiProvider: ProviderDef = {
  id: 'gemini',
  label: 'Google Gemini',
  needsKey: true,
  keyPlaceholder: 'AIza…',
  keyHelp: 'Free tier available in Google AI Studio.',
  keyUrl: 'https://aistudio.google.com/apikey',
  models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
  defaultModel: 'gemini-2.5-flash',
  async *stream({ apiKey, model, system, messages, signal }) {
    if (!apiKey) throw new ProviderError('Add your Gemini API key in Settings.');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      }),
    });
    if (!res.ok) throw await readError(res);
    for await (const data of sseData(res)) {
      try {
        const j = JSON.parse(data) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        for (const p of j.candidates?.[0]?.content?.parts ?? []) if (p.text) yield p.text;
      } catch {
        /* partial */
      }
    }
  },
};
