import { LanguageModelV3CallOptions, SharedV3Warning } from '@ai-sdk/provider';
import { ParseResult } from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { ChatAdapter, ParsedResponse, ParsedStreamChunk } from './types.js';
export declare const anthropicResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    role: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"text">;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"tool_use">;
        id: z.ZodString;
        name: z.ZodString;
        input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>]>>;
    model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stop_sequence: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        input_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        output_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
declare const anthropicChunkSchema: z.ZodUnion<readonly [z.ZodObject<{
    type: z.ZodLiteral<"message_start">;
    message: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        role: z.ZodString;
        content: z.ZodArray<z.ZodUnknown>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            input_tokens: z.ZodNumber;
            output_tokens: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"content_block_start">;
    index: z.ZodNumber;
    content_block: z.ZodObject<{
        type: z.ZodString;
        text: z.ZodOptional<z.ZodString>;
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        input: z.ZodOptional<z.ZodUnknown>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"content_block_delta">;
    index: z.ZodNumber;
    delta: z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"text_delta">;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"input_json_delta">;
        partial_json: z.ZodString;
    }, z.core.$strip>]>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"content_block_stop">;
    index: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"message_delta">;
    delta: z.ZodObject<{
        stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stop_sequence: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
    usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        output_tokens: z.ZodNumber;
    }, z.core.$strip>>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"message_stop">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ping">;
}, z.core.$strip>]>;
type AnthropicResponse = z.infer<typeof anthropicResponseSchema>;
type AnthropicChunk = z.infer<typeof anthropicChunkSchema>;
export declare class AnthropicAdapter implements ChatAdapter<AnthropicResponse, AnthropicChunk> {
    readonly responseSchema: z.ZodObject<{
        id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        content: z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
            type: z.ZodLiteral<"text">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"tool_use">;
            id: z.ZodString;
            name: z.ZodString;
            input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, z.core.$strip>]>>;
        model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        stop_sequence: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            input_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            output_tokens: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
    readonly chunkSchema: z.ZodUnion<readonly [z.ZodObject<{
        type: z.ZodLiteral<"message_start">;
        message: z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            role: z.ZodString;
            content: z.ZodArray<z.ZodUnknown>;
            model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
                input_tokens: z.ZodNumber;
                output_tokens: z.ZodNumber;
            }, z.core.$strip>>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"content_block_start">;
        index: z.ZodNumber;
        content_block: z.ZodObject<{
            type: z.ZodString;
            text: z.ZodOptional<z.ZodString>;
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            input: z.ZodOptional<z.ZodUnknown>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"content_block_delta">;
        index: z.ZodNumber;
        delta: z.ZodUnion<readonly [z.ZodObject<{
            type: z.ZodLiteral<"text_delta">;
            text: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"input_json_delta">;
            partial_json: z.ZodString;
        }, z.core.$strip>]>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"content_block_stop">;
        index: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"message_delta">;
        delta: z.ZodObject<{
            stop_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stop_sequence: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>;
        usage: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            output_tokens: z.ZodNumber;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"message_stop">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"ping">;
    }, z.core.$strip>]>;
    readonly urlSuffix = "/anthropic/v1/messages";
    readonly additionalHeaders: {
        'anthropic-version': string;
    };
    private finishReason;
    private inputTokens;
    private outputTokens;
    private readonly toolCallAccumulators;
    private readonly openTextIds;
    private readonly generateId;
    constructor(generateId: () => string);
    buildRequest(options: LanguageModelV3CallOptions, modelId: string, modelInBody: boolean): {
        body: Record<string, unknown>;
        warnings: SharedV3Warning[];
    };
    parseResponse(raw: AnthropicResponse): ParsedResponse;
    parseChunk(chunk: ParseResult<AnthropicChunk>): ParsedStreamChunk[];
    flush(): ParsedStreamChunk[];
}
export {};
//# sourceMappingURL=anthropic-adapter.d.ts.map