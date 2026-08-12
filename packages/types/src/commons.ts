import z from "zod";

export const ResponseMessageSchema = z.object({
  message: z.string()
})

export type ResponseMessageType = z.infer<typeof ResponseMessageSchema>;

export const HttpErrorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
});

export type HttpErrorType = z.infer<typeof HttpErrorSchema>;