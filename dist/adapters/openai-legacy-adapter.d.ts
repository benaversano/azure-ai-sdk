import { LanguageModelV3CallOptions, SharedV3Warning } from '@ai-sdk/provider';
import { OpenAIAdapter } from './openai-adapter.js';
export declare class OpenAILegacyAdapter extends OpenAIAdapter {
    readonly responseSchema: import("zod").ZodObject<{
        id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        model: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        created: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
        choices: import("zod").ZodArray<import("zod").ZodObject<{
            index: import("zod").ZodNumber;
            message: import("zod").ZodObject<{
                role: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodLiteral<"assistant">>>;
                content: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                tool_calls: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodObject<{
                    id: import("zod").ZodString;
                    type: import("zod").ZodLiteral<"function">;
                    function: import("zod").ZodObject<{
                        name: import("zod").ZodString;
                        arguments: import("zod").ZodString;
                    }, import("zod/v4/core").$strip>;
                }, import("zod/v4/core").$strip>>>>;
            }, import("zod/v4/core").$strip>;
            finish_reason: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            matched_stop: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodNumber]>>>;
            logprobs: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnknown>>;
            content_filter_results: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnknown>>;
        }, import("zod/v4/core").$strip>>;
        usage: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
            prompt_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            completion_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            total_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            prompt_tokens_details: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
                cached_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            }, import("zod/v4/core").$strip>>>;
            completion_tokens_details: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
                reasoning_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            }, import("zod/v4/core").$strip>>>;
        }, import("zod/v4/core").$strip>>>;
    }, import("zod/v4/core").$strip>;
    readonly chunkSchema: import("zod").ZodObject<{
        id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        model: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
        choices: import("zod").ZodArray<import("zod").ZodObject<{
            index: import("zod").ZodNumber;
            delta: import("zod").ZodObject<{
                role: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodEnum<{
                    assistant: "assistant";
                }>>>;
                content: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                reasoning_content: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                tool_calls: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodArray<import("zod").ZodObject<{
                    index: import("zod").ZodNumber;
                    id: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                    type: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodLiteral<"function">>>;
                    function: import("zod").ZodObject<{
                        name: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                        arguments: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
                    }, import("zod/v4/core").$strip>;
                }, import("zod/v4/core").$strip>>>>;
            }, import("zod/v4/core").$strip>;
            finish_reason: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
            matched_stop: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodNumber]>>>;
            logprobs: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnknown>>;
            content_filter_results: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnknown>>;
        }, import("zod/v4/core").$strip>>;
        usage: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
            prompt_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            completion_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            total_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            prompt_tokens_details: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
                cached_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            }, import("zod/v4/core").$strip>>>;
            completion_tokens_details: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodObject<{
                reasoning_tokens: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodNumber>>;
            }, import("zod/v4/core").$strip>>>;
        }, import("zod/v4/core").$strip>>>;
    }, import("zod/v4/core").$strip>;
    buildRequest(options: LanguageModelV3CallOptions, modelId: string, modelInBody: boolean): {
        body: Record<string, unknown>;
        warnings: SharedV3Warning[];
    };
}
//# sourceMappingURL=openai-legacy-adapter.d.ts.map