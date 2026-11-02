import { ProviderError, type ProviderDef } from './types';

/**
 * Calls the Claude API straight from the browser with the official SDK.
 * The key lives in localStorage and never touches a server of ours — that is the whole point of BYOK.
 */
export const anthropicProvider: ProviderDef = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  needsKey: true,
  keyPlaceholder: 'sk-ant-…',
  keyHelp: 'Create a key in the Claude Console.',
  keyUrl: 'https://platform.claude.com/settings/keys',
  models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
  defaultModel: 'claude-opus-5-5',
  async *stream({ apiKey, model, system, messages, signal }) {
    if (!apiKey) throw new ProviderError('Add your Anthropic API key in Settings.');
    // Lazy-load the SDK so the demo/other providers don't pay for it.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
    try {
      // Chat tutoring is routine work: low effort keeps replies snappy and cheap.
      // Server-side fallback reroutes a safety refusal to another Claude model instead of a dead turn.
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: 8192,
          system,
          messages,
          output_config: { effort: 'low' },
          fallbacks: 'default',
          betas: ['server-side-fallback-2026-07-01'],
        },
        { signal },
      );
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        yield '\n\n_(The model declined that turn. Try rephrasing.)_';
      }
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new ProviderError('Anthropic rejected the key. Check it in Settings.', 401);
      if (e instanceof Anthropic.RateLimitError) throw new ProviderError('Anthropic rate limit hit. Wait a moment.', 429);
      if (e instanceof Anthropic.APIConnectionError) throw new ProviderError('Could not reach the Claude API.');
      if (e instanceof Anthropic.APIError) throw new ProviderError(`Anthropic ${e.status}: ${e.message}`, e.status);
      throw e;
    }
  },
};
