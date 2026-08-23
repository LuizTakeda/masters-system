import { z } from "zod";
interface ApiFetchOptions<TSchema extends z.ZodType> extends RequestInit {
    responseSchema?: TSchema;
}
export declare function apiFetch<TSchema extends z.ZodType, TData = z.infer<TSchema>>(input: RequestInfo | URL, options?: ApiFetchOptions<TSchema>): Promise<TData>;
export {};
