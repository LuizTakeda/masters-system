import z from "zod";

//##################################################
// Common
//##################################################

// ### Params ###
export const ContextFileProjectParamsSchema = z.object({
  project: z.coerce.string().min(1).max(100).describe("Unique project identifier"),
});

export type ContextFileProjectParamsType = z.infer<typeof ContextFileProjectParamsSchema>;

//##################################################
// Get Context File
//##################################################

// ### Response ###
export const GetContextFileResponseSchema = z.object({
  name: z.string().nullable(),
  description: z.string().nullable(),
  file: z.record(z.string(), z.any()).describe("JSON-LD @context object"),
  version: z.number().int().default(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type GetContextFileResponseType = z.infer<typeof GetContextFileResponseSchema>;

//##################################################
// Upsert Context File (Create / Update)
//##################################################

// ### Body ###
export const UpsertContextFileBodySchema = z.object({
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  file: z.record(z.string(), z.any()).describe("JSON-LD @context definition"),
});
export type UpsertContextFileBodyType = z.infer<typeof UpsertContextFileBodySchema>;
