import { LanguageModelV3, LanguageModelV3CallOptions } from '@ai-sdk/provider';
import { FetchFunction } from '@ai-sdk/provider-utils';
import { AzureFoundryChatModelId, AzureFoundryChatSettings } from './azure-foundry-chat-options.js';
type AzureFoundryChatConfig = {
    provider: string;
    /**
     * Builds the full chat completions URL for a given deployment/model ID.
     * Accepts an optional URL path suffix that the adapter may override
     * (e.g. '/anthropic/v1/messages' instead of '/chat/completions').
     */
    url: (modelId: string, urlSuffix?: string) => string;
    /**
     * When true, the model ID is sent in the request body as `model`.
     * Used for AI Foundry inference endpoints (services.ai.azure.com/models).
     */
    modelInBody: boolean;
    /**
     * Returns Bearer token headers for every request.
     */
    headers: () => Promise<Record<string, string>>;
    fetch?: FetchFunction;
    generateId?: () => string;
};
export declare class AzureFoundryChatLanguageModel implements LanguageModelV3 {
    readonly specificationVersion: "v3";
    readonly modelId: AzureFoundryChatModelId;
    readonly supportedUrls: Record<string, RegExp[]>;
    private readonly settings;
    private readonly config;
    private readonly _generateId;
    constructor(modelId: AzureFoundryChatModelId, settings: AzureFoundryChatSettings, config: AzureFoundryChatConfig);
    get provider(): string;
    doGenerate(options: LanguageModelV3CallOptions): Promise<Awaited<ReturnType<LanguageModelV3['doGenerate']>>>;
    doStream(options: LanguageModelV3CallOptions): Promise<Awaited<ReturnType<LanguageModelV3['doStream']>>>;
}
export {};
//# sourceMappingURL=azure-foundry-chat-language-model.d.ts.map