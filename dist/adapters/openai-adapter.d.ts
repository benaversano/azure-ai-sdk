import { LanguageModelV3CallOptions, LanguageModelV3FinishReason, SharedV3Warning } from '@ai-sdk/provider';
import { ParseResult } from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { ChatAdapter, ParsedResponse, ParsedStreamChunk } from './types.js';
type ChatMessage = {
    role: 'system';
    content: string;
} | {
    role: 'user';
    content: ChatUserContent[];
} | {
    role: 'assistant';
    content: string | null;
    tool_calls?: ToolCallRequest[];
} | {
    role: 'tool';
    tool_call_id: string;
    content: string;
};
type ChatUserContent = {
    type: 'text';
    text: string;
} | {
    type: 'image_url';
    image_url: {
        url: string;
    };
};
type ToolCallRequest = {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
};
export declare const openAIResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    created: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    choices: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        message: z.ZodObject<{
            role: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"assistant">>>;
            content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tool_calls: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                type: z.ZodLiteral<"function">;
                function: z.ZodObject<{
                    name: z.ZodString;
                    arguments: z.ZodString;
                }, z.core.$strip>;
            }, z.core.$strip>>>>;
        }, z.core.$strip>;
        finish_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        matched_stop: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        logprobs: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        content_filter_results: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
    }, z.core.$strip>>;
    usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        prompt_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        completion_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        total_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        prompt_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            cached_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>>>;
        completion_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            reasoning_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const openAIChunkSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    choices: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        delta: z.ZodObject<{
            role: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                assistant: "assistant";
            }>>>;
            content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            reasoning_content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            tool_calls: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                type: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"function">>>;
                function: z.ZodObject<{
                    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    arguments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                }, z.core.$strip>;
            }, z.core.$strip>>>>;
        }, z.core.$strip>;
        finish_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        matched_stop: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
        logprobs: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        content_filter_results: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
    }, z.core.$strip>>;
    usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        prompt_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        completion_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        total_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        prompt_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            cached_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>>>;
        completion_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            reasoning_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type OpenAIResponse = z.infer<typeof openAIResponseSchema>;
type OpenAIChunk = z.infer<typeof openAIChunkSchema>;
export declare function mapFinishReason(reason: string | null | undefined): LanguageModelV3FinishReason;
export declare function convertToOpenAIMessages(prompt: LanguageModelV3CallOptions['prompt']): ChatMessage[];
export declare class OpenAIAdapter implements ChatAdapter<OpenAIResponse, OpenAIChunk> {
    readonly responseSchema: z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        created: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        choices: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            message: z.ZodObject<{
                role: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"assistant">>>;
                content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                tool_calls: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    type: z.ZodLiteral<"function">;
                    function: z.ZodObject<{
                        name: z.ZodString;
                        arguments: z.ZodString;
                    }, z.core.$strip>;
                }, z.core.$strip>>>>;
            }, z.core.$strip>;
            finish_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            matched_stop: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            logprobs: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
            content_filter_results: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        }, z.core.$strip>>;
        usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            prompt_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            completion_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            total_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            prompt_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                cached_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, z.core.$strip>>>;
            completion_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                reasoning_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    readonly chunkSchema: z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        choices: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            delta: z.ZodObject<{
                role: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                    assistant: "assistant";
                }>>>;
                content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                reasoning_content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                tool_calls: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
                    index: z.ZodNumber;
                    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    type: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"function">>>;
                    function: z.ZodObject<{
                        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                        arguments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                    }, z.core.$strip>;
                }, z.core.$strip>>>>;
            }, z.core.$strip>;
            finish_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            matched_stop: z.ZodOptional<z.ZodNullable<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>>;
            logprobs: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
            content_filter_results: z.ZodOptional<z.ZodNullable<z.ZodUnknown>>;
        }, z.core.$strip>>;
        usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            prompt_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            completion_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            total_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            prompt_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                cached_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, z.core.$strip>>>;
            completion_tokens_details: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                reasoning_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    private finishReason;
    private inputTokens;
    private outputTokens;
    private cachedInputTokens;
    private reasoningTokens;
    private readonly toolCallAccumulators;
    private readonly openTextIds;
    private readonly generateId;
    constructor(generateId: () => string);
    buildRequest(options: LanguageModelV3CallOptions, modelId: string, modelInBody: boolean): {
        body: Record<string, unknown>;
        warnings: SharedV3Warning[];
    };
    parseResponse(raw: OpenAIResponse): ParsedResponse;
    parseChunk(chunk: ParseResult<OpenAIChunk>): ParsedStreamChunk[];
    flush(): ParsedStreamChunk[];
}
export {};
//# sourceMappingURL=openai-adapter.d.ts.map