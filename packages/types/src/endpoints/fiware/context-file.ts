import z from "zod";

//##################################################
// Get Context File
//##################################################

// ### Response ###
export const GetContextFileResponseSchema = z.object({
  name: z.string().nullable(),
  file: z.record(z.string(), z.any()).describe("JSON-LD @context object"),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type GetContextFileResponseType = z.infer<typeof GetContextFileResponseSchema>;

//##################################################
// Upsert Context File (Create / Update)
//##################################################

// ### Body ###
export const UpsertContextFileBodySchema = z.object({
  file: z.record(z.string(), z.any()).describe("JSON-LD @context definition"),
});
export type UpsertContextFileBodyType = z.infer<typeof UpsertContextFileBodySchema>;
