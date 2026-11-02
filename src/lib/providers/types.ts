export type ProviderId = 'demo' | 'anthropic' | 'openai' | 'gemini' | 'ollama';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamRequest {
  apiKey: string;
  model: string;
  baseUrl?: string;
  system: string;
  messages: ChatTurn[];
  signal: AbortSignal;
  /** Only the demo provider uses this: which mask is speaking. */
  maskId?: string;
}

export interface ProviderDef {
  id: ProviderId;
  label: string;
  needsKey: boolean;
  keyPlaceholder?: string;
  keyHelp?: string;
  keyUrl?: string;
  models: string[];
  defaultModel: string;
  defaultBaseUrl?: string;
  baseUrlHelp?: string;
  /** Yields text deltas. */
  stream(req: StreamRequest): AsyncGenerator<string, void, void>;
}

export class ProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** Shared SSE line reader for fetch-based providers. Yields the `data:` payloads. */
export async function* sseData(res: Response): AsyncGenerator<string, void, void> {
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
      const line = buf.slice(0, idx).trimEnd();
      buf = buf.slice(idx + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
}

export async function readError(res: Response): Promise<ProviderError> {
  let detail = '';
  try {
    const j = (await res.json()) as { error?: { message?: string } | string; message?: string };
    detail = typeof j.error === 'string' ? j.error : j.error?.message ?? j.message ?? '';
  } catch {
    /* non-JSON body */
  }
  const hint =
    res.status === 401 || res.status === 403
      ? 'Check the API key in Settings.'
      : res.status === 429
        ? 'Rate limited — wait a moment.'
        : res.status === 0
          ? 'Network error. If this is Ollama, allow the origin (see Settings).'
          : '';
  return new ProviderError([`${res.status}`, detail, hint].filter(Boolean).join(' · '), res.status);
}
