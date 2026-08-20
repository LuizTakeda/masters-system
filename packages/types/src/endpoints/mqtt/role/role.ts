import z from "zod";
import { queryNumber } from "../../../helpers.js";

//##################################################
// Get Roles
//##################################################

// ### Query ###

export const GetRolesQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1).describe("Maximum number of roles to return (-1 for all)"),
  offset: z.coerce.number().nonnegative().optional().default(0).describe("Starting point for pagination"),
});

export type GetRolesQueryType = z.infer<typeof GetRolesQuerySchema>;

// ### Reponse ###

export const GetRolesResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  roles: z.array(z.object({
    rolename: z.string(),
    textdescription: z.string().optional(),
    allowwildcardsubs: z.boolean().optional(),
    acls: z.array(z.object({
      acltype: z.string(),
      topic: z.string(),
      priority: z.number().int(),
      allow: z.boolean()
    })).optional().default([])
  }))
});

export type GetRolesResponseType = z.infer<typeof GetRolesResponseSchema>;

//##################################################
// Get Role Names 
//##################################################

// ### Query ###

export const GetRoleNamesQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1).describe("Maximum number of roles to return (-1 for all)"),
  offset: z.coerce.number().nonnegative().optional().default(0).describe("Starting point for pagination"),
});

export type GetRoleNamesQueryType = z.infer<typeof GetRolesQuerySchema>;

// ### Reponse ###

export const GetRoleNamesResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  roles: z.array(z.string()).optional().default([])
}).optional()

export type GetRoleNamesResponseType = z.infer<typeof GetRolesResponseSchema>;