import { LanguageModelV3, ProviderV3 } from '@ai-sdk/provider';
import { FetchFunction } from '@ai-sdk/provider-utils';
import type { TokenCredential } from '@azure/identity';
import { AzureFoundryChatModelId, AzureFoundryChatSettings } from './azure-foundry-chat-options.js';
export interface AzureFoundryProviderSettings {
    /**
     * Azure resource base URL. Two formats are supported:
     *
     * Azure OpenAI / Cognitive Services (cognitiveservices.azure.com):
     *   https://<resource>.cognitiveservices.azure.com
     *   → calls /openai/deployments/{model}/chat/completions?api-version=...
     *
     * AI Foundry inference (services.ai.azure.com):
     *   https://<project>.services.ai.azure.com/models
     *   → calls /chat/completions with model in the request body
     *
     * Can also be provided via the AZURE_AI_FOUNDRY_ENDPOINT environment variable.
     *
     * Alternatively, provide `resourceName` (and optionally `projectId`) to have
     * the endpoint constructed automatically.
     */
    endpoint?: string;
    /**
     * Azure AI Foundry resource name (the subdomain portion of the hostname).
     *
     * Constructs: https://{resourceName}.services.ai.azure.com/models
     *
     * `projectId` may be provided alongside this for configuration purposes but
     * does not change the URL — the `/models` endpoint serves all deployed models.
     *
     * Takes precedence over `endpoint` when both are set.
     * Can also be provided via the AZURE_FOUNDRY_RESOURCE environment variable.
     */
    resourceName?: string;
    /**
     * Azure AI Foundry project name.
     * Accepted as a configuration convenience but does not affect the URL —
     * the provider always uses the resource-level `/models` inference endpoint,
     * which works for all deployed models regardless of project scoping.
     * Can also be provided via the AZURE_FOUNDRY_PROJECT environment variable.
     */
    projectId?: string;
    /**
     * Controls how the chat completions URL is constructed.
     *
     * - `'auto'` (default) — infer from the hostname:
     *     `cognitiveservices.azure.com` → `'cognitive-services'`
     *     all others                   → `'foundry'`
     * - `'cognitive-services'` — Azure OpenAI deployment-path style:
     *     `{endpoint}/openai/deployments/{model}/chat/completions?api-version=...`
     *     Model is placed in the URL path; `api-version` query param is appended.
     * - `'foundry'` — AI Foundry inference style:
     *     `{endpoint}/chat/completions`  (model sent in request body)
     *
     * Set this explicitly when routing through a gateway (e.g. APIM) whose
     * hostname does not contain `cognitiveservices.azure.com` but whose backend
     * expects the deployment-path URL format.
     *
     * @example
     * ```ts
     * // APIM gateway fronting an Azure OpenAI backend
     * createAzureFoundry({
     *   endpoint: 'https://my-org.azure-api.net',
     *   endpointStyle: 'cognitive-services',
     * });
     * ```
     */
    endpointStyle?: 'auto' | 'cognitive-services' | 'foundry';
    /**
     * API version query parameter appended to every request.
     * Only relevant for the `'cognitive-services'` endpoint style.
     * Defaults to '2024-10-21'.
     */
    apiVersion?: string;
    /**
     * Azure token credential to use for authentication.
     * Defaults to DefaultAzureCredential which supports:
     *   - Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
     *   - Workload identity (Kubernetes)
     *   - Managed identity (Azure-hosted compute)
     *   - Azure CLI (`az login`)
     *   - Azure PowerShell
     *   - Visual Studio Code
     */
    credential?: TokenCredential;
    /**
     * OAuth2 scope to request when obtaining a bearer token.
     *
     * The default scope is inferred from the endpoint:
     *   - `*.services.ai.azure.com` → `'https://ai.azure.com/.default'`
     *   - all other endpoints       → `'https://cognitiveservices.azure.com/.default'`
     *
     * When routing through Azure API Management (APIM), set this to the scope
     * of the APIM's Entra app registration:
     *   `'api://<apim-app-client-id>/.default'`
     *
     * The APIM instance must be configured to validate JWT tokens from this
     * audience and forward requests to the backend on behalf of the caller.
     */
    scope?: string;
    /**
     * Direct API key for Azure AI Foundry endpoints.
     *
     * When set, this value is used directly as the Bearer token and **Entra
     * identity is bypassed entirely**. This is convenient for local testing or
     * environments where `az login` is not available.
     *
     * For production workloads prefer leaving this unset and relying on
     * `DefaultAzureCredential` (managed identity, workload identity, etc.).
     *
     * Can also be provided via the `AZURE_FOUNDRY_API_KEY` environment variable.
     *
     * @example
     * ```ts
     * // Quick local test without az login
     * createAzureFoundry({
     *   resourceName: 'my-resource',
     *   projectId: 'my-project',
     *   apiKey: process.env.AZURE_FOUNDRY_API_KEY,
     * });
     * ```
     */
    apiKey?: string;
    /**
     * APIM subscription key sent **alongside** the Entra bearer token.
     *
     * Use this when routing through Azure API Management that requires a
     * subscription key in addition to a valid Entra JWT. The Entra bearer token
     * is always obtained and sent; this key is forwarded as supplemental headers:
     *   - `Ocp-Apim-Subscription-Key`
     *   - `api-key`
     *
     * Values in `headers` take precedence if the same key appears in both.
     *
     * @example
     * ```ts
     * // APIM policy requires both an Entra token AND a subscription key
     * createAzureFoundry({
     *   endpoint: 'https://my-org.azure-api.net',
     *   endpointStyle: 'cognitive-services',
     *   scope: 'api://<apim-app-client-id>/.default',
     *   subscriptionKey: process.env.APIM_SUBSCRIPTION_KEY,
     * });
     * ```
     */
    subscriptionKey?: string;
    /**
     * Custom headers to include in every request.
     * These take precedence over any headers set by `apiKey`.
     */
    headers?: Record<string, string>;
    /**
     * Custom fetch implementation. Useful for testing / middleware.
     */
    fetch?: FetchFunction;
    generateId?: () => string;
    /**
     * Logger for diagnostic output. Defaults to `console`.
     *
     * Set to `null` to silence all SDK logging. You can also supply a custom
     * object with `{ error, warn, info }` methods to route logs to your own
     * logging infrastructure.
     *
     * @example
     * // Silence logging
     * createAzureFoundry({ ..., logger: null });
     *
     * @example
     * // Route to a custom logger
     * createAzureFoundry({ ..., logger: myLogger });
     */
    logger?: Pick<Console, 'error' | 'warn' | 'info'> | null;
    /**
     * Path to write debug log lines to. Defaults to
     * `<os.tmpdir()>/azure-ai-sdk-debug.log` when not set.
     * Can also be overridden via the `AZURE_AI_SDK_DEBUG_LOG` environment variable.
     * The file is overwritten on each provider init (fresh log per run).
     *
     * @example
     * // In opencode.json options:
     * { "debugLogFile": "/tmp/azure-ai-sdk-debug.log" }
     */
    debugLogFile?: string;
}
export interface AzureFoundryProvider extends ProviderV3 {
    /**
     * Create a language model instance for the given deployment name.
     */
    (modelId: AzureFoundryChatModelId, settings?: AzureFoundryChatSettings): LanguageModelV3;
    /**
     * Create a language model instance for the given deployment name.
     */
    languageModel(modelId: AzureFoundryChatModelId, settings?: AzureFoundryChatSettings): LanguageModelV3;
    /**
     * Create a chat model instance for the given deployment name.
     */
    chat(modelId: AzureFoundryChatModelId, settings?: AzureFoundryChatSettings): LanguageModelV3;
    /**
     * Same as {@link chat} — alias matching `@ai-sdk/openai-compatible` / OpenCode
     * conventions (`chatModel`).
     */
    chatModel?(modelId: AzureFoundryChatModelId, settings?: AzureFoundryChatSettings): LanguageModelV3;
}
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
export declare function createAzureFoundry(options?: AzureFoundryProviderSettings): AzureFoundryProvider;
//# sourceMappingURL=azure-foundry-provider.d.ts.map