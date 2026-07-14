import { combineHeaders, createEventSourceResponseHandler, createJsonResponseHandler, generateId, postJsonToApi, } from '@ai-sdk/provider-utils';
import { azureFoundryFailedResponseHandler } from './azure-foundry-error.js';
import { resolveAdapter } from './adapters/index.js';
import { VERSION } from './version.js';
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toV3Usage(flat) {
    return {
        inputTokens: { total: flat.inputTokens, noCache: undefined, cacheRead: flat.cachedInputTokens, cacheWrite: undefined },
        outputTokens: { total: flat.outputTokens, text: undefined, reasoning: flat.reasoningTokens },
    };
}
// ---------------------------------------------------------------------------
// Language model implementation
// ---------------------------------------------------------------------------
export class AzureFoundryChatLanguageModel {
    specificationVersion = 'v3';
    modelId;
    supportedUrls = {};
    settings;
    config;
    _generateId;
    constructor(modelId, settings, config) {
        this.modelId = modelId;
        this.settings = settings;
        this.config = config;
        this._generateId = config.generateId ?? generateId;
    }
    get provider() {
        return this.config.provider;
    }
    // -------------------------------------------------------------------------
    // doGenerate
    // -------------------------------------------------------------------------
    async doGenerate(options) {
        const adapter = resolveAdapter(this.modelId, this.settings.adapterType, this._generateId);
        const { body, warnings } = adapter.buildRequest(options, this.modelId, this.config.modelInBody);
        const headers = await this.config.headers();
        const { value: response, responseHeaders } = await postJsonToApi({
            url: this.config.url(this.modelId, adapter.urlSuffix),
            headers: combineHeaders(headers, adapter.additionalHeaders, options.headers, {
                'x-ms-useragent': `@nquandt/azure-ai-sdk/${VERSION}`,
            }),
            body,
            failedResponseHandler: azureFoundryFailedResponseHandler,
            successfulResponseHandler: createJsonResponseHandler(adapter.responseSchema),
            abortSignal: options.abortSignal,
            fetch: this.config.fetch,
        });
        const parsed = adapter.parseResponse(response);
        return {
            content: parsed.content,
            finishReason: parsed.finishReason,
            usage: toV3Usage(parsed.usage),
            warnings,
            request: { body },
            response: { headers: responseHeaders },
        };
    }
    // -------------------------------------------------------------------------
    // doStream
    // -------------------------------------------------------------------------
    async doStream(options) {
        const adapter = resolveAdapter(this.modelId, this.settings.adapterType, this._generateId);
        const { body, warnings } = adapter.buildRequest(options, this.modelId, this.config.modelInBody);
        const headers = await this.config.headers();
        const { value: stream, responseHeaders: streamResponseHeaders } = await postJsonToApi({
            url: this.config.url(this.modelId, adapter.urlSuffix),
            headers: combineHeaders(headers, adapter.additionalHeaders, options.headers, {
                'x-ms-useragent': `@nquandt/azure-ai-sdk/${VERSION}`,
            }),
            body: { ...body, stream: true },
            failedResponseHandler: azureFoundryFailedResponseHandler,
            successfulResponseHandler: createEventSourceResponseHandler(adapter.chunkSchema),
            abortSignal: options.abortSignal,
            fetch: this.config.fetch,
        });
        const streamStartPart = {
            type: 'stream-start',
            warnings,
        };
        const coreStream = stream.pipeThrough(new TransformStream({
            start(controller) {
                controller.enqueue(streamStartPart);
            },
            transform(chunk, controller) {
                for (const part of adapter.parseChunk(chunk)) {
                    controller.enqueue(part);
                }
            },
            flush(controller) {
                for (const part of adapter.flush()) {
                    if (part.type === 'finish') {
                        const v3Part = {
                            type: 'finish',
                            finishReason: part.finishReason,
                            usage: toV3Usage(part.usage),
                        };
                        controller.enqueue(v3Part);
                    }
                    else {
                        controller.enqueue(part);
                    }
                }
            },
        }));
        return {
            stream: coreStream,
            request: { body },
            response: { headers: streamResponseHeaders },
        };
    }
}
//# sourceMappingURL=azure-foundry-chat-language-model.js.map