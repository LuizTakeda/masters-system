import z from "zod";
import { queryNumber } from "../../../helpers.js";

//##################################################
// Get Roles
//##################################################

// ### Query ###

export const GetRolesQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1),
  offset: z.coerce.number().nonnegative().optional().default(0)
});

export type GetRolesQueryType = z.infer<typeof GetRolesQuerySchema>;
