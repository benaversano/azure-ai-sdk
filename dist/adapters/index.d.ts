import { AdapterType, ChatAdapter } from './types.js';
export { OpenAIAdapter } from './openai-adapter.js';
export { OpenAILegacyAdapter } from './openai-legacy-adapter.js';
export { AnthropicAdapter } from './anthropic-adapter.js';
export type { AdapterType, ChatAdapter } from './types.js';
/**
 * Resolve and instantiate the correct ChatAdapter for a given model.
 *
 * Resolution order:
 *   1. Explicit adapterType from settings — user always wins
 *   2. Model ID heuristic — pattern-matched against known model families
 *   3. Default: 'openai'
 */
export declare function resolveAdapter(modelId: string, adapterType: AdapterType | undefined, idGenerator?: () => string): ChatAdapter;
//# sourceMappingURL=index.d.ts.map