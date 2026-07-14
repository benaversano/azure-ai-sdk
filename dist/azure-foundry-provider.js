import { NoSuchModelError } from '@ai-sdk/provider';
import { withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname } from 'node:path';
import { AzureFoundryChatLanguageModel, } from './azure-foundry-chat-language-model.js';
// ---------------------------------------------------------------------------
// Scope used to obtain tokens for Azure AI Foundry / Azure ML endpoints
// ---------------------------------------------------------------------------
const COGNITIVE_SERVICES_SCOPE = 'https://cognitiveservices.azure.com/.default';
const AI_FOUNDRY_SCOPE = 'https://ai.azure.com/.default';
// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
/**
 * Create an Azure AI Foundry provider instance.
 *
 * Authentication is handled via Azure Identity. The credential is resolved
 * in the following order (when no `credential` is specified):
 *
 * 1. `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID` env vars
 * 2. Workload identity (Kubernetes pods with federated credentials)
 * 3. Managed identity (Azure-hosted compute)
 * 4. Azure CLI (`az login`)
 * 5. Azure PowerShell
 * 6. VS Code account
 *
 * @example
 * ```ts
 * import { createAzureFoundry } from '@nquandt/azure-ai-sdk';
 * import { generateText } from 'ai';
 *
 * // Azure OpenAI / Cognitive Services endpoint:
 * const foundry = createAzureFoundry({
 *   endpoint: 'https://my-resource.cognitiveservices.azure.com',
 * });
 *
 * // AI Foundry inference endpoint:
 * const foundry = createAzureFoundry({
 *   endpoint: 'https://my-project.services.ai.azure.com/models',
 * });
 *
 * const { text } = await generateText({
 *   model: foundry('DeepSeek-R1'),
 *   prompt: 'Hello world',
 * });
 * ```
 */
export function createAzureFoundry(options = {}) {
    // ---------------------------------------------------------------------------
    // Debug file logger — always writes to a log file.  The path can be
    // overridden via the `debugLogFile` option or the AZURE_AI_SDK_DEBUG_LOG
    // env var; it defaults to <tmpdir>/azure-ai-sdk-debug.log.
    // ---------------------------------------------------------------------------
    const debugFilePath = options.debugLogFile ??
        (typeof process !== 'undefined' && process.env.AZURE_AI_SDK_DEBUG_LOG
            ? process.env.AZURE_AI_SDK_DEBUG_LOG
            : `${tmpdir()}/azure-ai-sdk-debug.log`);
    function debugLog(level, msg) {
        try {
            mkdirSync(dirname(debugFilePath), { recursive: true });
            // Overwrite on the first call each process run, append thereafter.
            if (debugLog.firstWrite) {
                debugLog.firstWrite = false;
                writeFileSync(debugFilePath, `[${new Date().toISOString()}] [${level}] ${msg}\n`);
            }
            else {
                appendFileSync(debugFilePath, `[${new Date().toISOString()}] [${level}] ${msg}\n`);
            }
        }
        catch {
            // never let debug logging break the provider
        }
    }
    debugLog.firstWrite = true;
    debugLog('INFO', `createAzureFoundry called — options: ${JSON.stringify({
        hasResourceName: !!options.resourceName,
        hasEndpoint: !!options.endpoint,
        hasApiKey: !!options.apiKey,
        hasCredential: !!options.credential,
        hasScope: !!options.scope,
        endpointStyle: options.endpointStyle,
        apiVersion: options.apiVersion,
    })}`);
    // ---------------------------------------------------------------------------
    // Endpoint resolution (priority order):
    //   1. options.resourceName (+ options.projectId) — explicit code-level names
    //   2. options.endpoint                           — explicit code-level URL
    //   3. AZURE_FOUNDRY_RESOURCE env var (+ AZURE_FOUNDRY_PROJECT) — env-based names
    //   4. AZURE_AI_FOUNDRY_ENDPOINT env var          — env-based full URL
    //
    // Explicit code-level options always win over env vars so that unit tests
    // which pass a specific endpoint are never overridden by a .env file.
    // ---------------------------------------------------------------------------
    const resolvedEndpoint = (() => {
        if (options.resourceName) {
            // projectId is accepted as a config convenience but does not change the URL.
            // The /models endpoint is the known-working inference surface for all models.
            return `https://${options.resourceName}.services.ai.azure.com/models`;
        }
        if (options.endpoint !== undefined)
            return options.endpoint;
        const envResource = typeof process !== 'undefined' ? process.env.AZURE_FOUNDRY_RESOURCE : undefined;
        if (envResource) {
            return `https://${envResource}.services.ai.azure.com/models`;
        }
        return typeof process !== 'undefined' ? process.env.AZURE_AI_FOUNDRY_ENDPOINT : undefined;
    })();
    const endpoint = withoutTrailingSlash(resolvedEndpoint) ?? '';
    if (!endpoint) {
        const err = '@nquandt/azure-ai-sdk: An Azure AI Foundry endpoint is required. ' +
            'Provide it via `resourceName`/`projectId`, the `endpoint` option, or the AZURE_AI_FOUNDRY_ENDPOINT environment variable.';
        debugLog('ERROR', err);
        throw new Error(err);
    }
    debugLog('INFO', `endpoint resolved — url=${endpoint}`);
    // ---------------------------------------------------------------------------
    // API key resolution:
    //   - options.apiKey wins if provided
    //   - If options.credential is explicitly set, the caller wants Entra auth;
    //     do NOT fall back to AZURE_FOUNDRY_API_KEY env var.
    //   - Otherwise, read AZURE_FOUNDRY_API_KEY from env as a convenience for
    //     testing without az login.
    // ---------------------------------------------------------------------------
    const apiKey = options.apiKey ??
        (options.credential
            ? undefined
            : (typeof process !== 'undefined' ? process.env.AZURE_FOUNDRY_API_KEY : undefined));
    // When an explicit API key is provided, use it directly as the Bearer token
    // and skip Entra identity entirely. This is useful for local testing without
    // requiring `az login`. For production, prefer credential-based auth.
    // null explicitly disables logging; undefined falls back to console.
    const logger = options.logger === null ? null : (options.logger ?? console);
    const getHeaders = apiKey
        ? (() => {
            debugLog('INFO', 'auth=apiKey (Entra bypassed)');
            return async () => ({
                Authorization: `Bearer ${apiKey}`,
                ...options.headers,
            });
        })()
        : (() => {
            // Lazily import @azure/identity only when Entra auth is actually needed.
            // This avoids loading native Azure SDK modules in environments (e.g. bun)
            // where they may not be available, when an apiKey is being used instead.
            let getTokenFn;
            const defaultScope = endpoint.includes('services.ai.azure.com')
                ? AI_FOUNDRY_SCOPE
                : COGNITIVE_SERVICES_SCOPE;
            const scope = options.scope ?? defaultScope;
            const credentialType = options.credential
                ? options.credential.constructor?.name ?? 'custom'
                : 'DefaultAzureCredential';
            return async () => {
                if (!getTokenFn) {
                    debugLog('INFO', `acquiring Entra token — scope=${scope} credentialType=${credentialType}`);
                    const { DefaultAzureCredential, getBearerTokenProvider } = await import('@azure/identity');
                    const credential = options.credential ?? new DefaultAzureCredential();
                    getTokenFn = getBearerTokenProvider(credential, scope);
                }
                try {
                    const token = await getTokenFn();
                    debugLog('INFO', 'Entra token acquired successfully');
                    return {
                        Authorization: `Bearer ${token}`,
                        // APIM subscription key — sent alongside the Entra token when set
                        ...(options.subscriptionKey
                            ? {
                                'Ocp-Apim-Subscription-Key': options.subscriptionKey,
                                'api-key': options.subscriptionKey,
                            }
                            : {}),
                        // Explicit headers always win — they are merged last
                        ...options.headers,
                    };
                }
                catch (err) {
                    const cause = err instanceof Error ? err.message : String(err);
                    const msg = `[azure-ai-sdk] Failed to acquire Azure token — endpoint=${endpoint} scope=${scope} credentialType=${credentialType} cause=${cause}`;
                    debugLog('ERROR', msg);
                    logger?.error(msg);
                    throw new Error(msg, { cause: err instanceof Error ? err : undefined });
                }
            };
        })();
    // Resolve the endpoint style.
    //
    // 'auto' (default) — infer from hostname:
    //   cognitiveservices.azure.com  →  'cognitive-services'
    //   anything else                →  'foundry'
    //
    // Callers may override with an explicit 'endpointStyle' to handle gateways
    // (e.g. APIM) whose hostname does not match the backend's hostname pattern.
    //
    const resolvedStyle = (() => {
        const style = options.endpointStyle ?? 'auto';
        if (style === 'cognitive-services')
            return 'cognitive-services';
        if (style === 'foundry')
            return 'foundry';
        // 'auto' — sniff hostname
        return endpoint.includes('cognitiveservices.azure.com')
            ? 'cognitive-services'
            : 'foundry';
    })();
    const isCognitiveServices = resolvedStyle === 'cognitive-services';
    const apiVersion = options.apiVersion ?? '2024-10-21';
    const buildUrl = (modelId, urlSuffix = '/chat/completions') => {
        if (isCognitiveServices) {
            // Strip a trailing `/openai` that callers may have included in the endpoint.
            // We always append `/openai/deployments/...` ourselves, so including it in
            // the endpoint would produce a doubled path segment:
            //   https://my-org.azure-api.net/openai/openai/deployments/...  ← wrong
            //   https://my-org.azure-api.net/openai/deployments/...         ← correct
            const base = endpoint.replace(/\/openai\/?$/i, '');
            // For non-standard paths (e.g. Anthropic's /anthropic/v1/messages)
            // don't wrap in the OpenAI deployment path structure
            if (urlSuffix !== '/chat/completions') {
                return `${base}${urlSuffix}`;
            }
            return `${base}/openai/deployments/${encodeURIComponent(modelId)}/chat/completions?api-version=${apiVersion}`;
        }
        // Foundry inference: OpenAI-compatible chat lives under `.../models/chat/completions`.
        // Anthropic (Claude) on the same host uses `.../anthropic/v1/messages` — there is no
        // `/models` segment on that route (see Azure AI Foundry Anthropic integration).
        if (urlSuffix !== '/chat/completions' && /\/models\/?$/i.test(endpoint)) {
            const base = endpoint.replace(/\/models\/?$/i, '');
            return `${base}${urlSuffix}`;
        }
        return `${endpoint}${urlSuffix}`;
    };
    const createChatModel = (modelId, settings = {}) => new AzureFoundryChatLanguageModel(modelId, settings, {
        provider: 'azure-foundry.chat',
        url: buildUrl,
        modelInBody: !isCognitiveServices,
        headers: getHeaders,
        fetch: options.fetch,
        generateId: options.generateId,
    });
    const provider = function (modelId, settings) {
        if (new.target) {
            throw new Error('The AzureFoundry model function cannot be called with the new keyword.');
        }
        return createChatModel(modelId, settings);
    };
    provider.specificationVersion = 'v3';
    provider.languageModel = createChatModel;
    provider.chat = createChatModel;
    provider.chatModel = createChatModel;
    const noEmbeddings = (modelId) => {
        throw new NoSuchModelError({ modelId, modelType: 'embeddingModel' });
    };
    provider.embeddingModel = noEmbeddings;
    provider.textEmbeddingModel = noEmbeddings;
    provider.imageModel = (modelId) => {
        throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
    };
    debugLog('INFO', `provider created — endpoint=${endpoint} style=${resolvedStyle}`);
    return provider;
}
// Credential classes are no longer re-exported from this module.
// Import them directly from '@azure/identity' when needed.
//# sourceMappingURL=azure-foundry-provider.js.map