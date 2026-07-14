import { z } from 'zod';
declare const azureFoundryErrorSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        message: z.ZodString;
        status: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type AzureFoundryErrorData = z.infer<typeof azureFoundryErrorSchema>;
export declare const azureFoundryFailedResponseHandler: import("@ai-sdk/provider-utils").ResponseHandler<import("@ai-sdk/provider").APICallError>;
export {};
//# sourceMappingURL=azure-foundry-error.d.ts.map