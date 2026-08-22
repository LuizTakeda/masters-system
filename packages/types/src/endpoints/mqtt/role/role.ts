import z from "zod";

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
}).optional();
export type GetRoleNamesResponseType = z.infer<typeof GetRolesResponseSchema>;

//##################################################
// Get Role 
//##################################################

// ### Params ###
export const GetRoleParamsSchema = z.object({
  name: z.string().min(1).max(100)
});
export type GetRoleParamsType = z.infer<typeof GetRoleParamsSchema>;

// ### Reponse ###
export const GetRoleResponseSchema = z.object({
  role: z.object({
    rolename: z.string(),
    textdescription: z.string().optional(),
    allowwildcardsubs: z.boolean().optional(),
    acls: z.array(z.object({
      acltype: z.string().describe("Permission type (e.g., publishClientSend, subscribePattern)"),
      topic: z.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
      priority: z.number().describe("Rule priority"),
      allow: z.boolean().describe("If true, allows access; if false, explicitly denies it"),
    })).default([]),
  }),
});
export type GetRoleResponseType = z.infer<typeof GetRoleResponseSchema>;

//##################################################
// Create Role 
//##################################################

// ### Body ###
export const CreateRoleBodySchema = z.object({
  rolename: z.string().min(1, "Role name is required").max(100),
  textname: z.string().min(1).max(100).optional(),
  textdescription: z.string().min(1).max(256).optional(),
  acls: z.array(z.object({
    acltype: z.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type (e.g., publishClientSend, subscribePattern)"),
    topic: z.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
    priority: z.number().describe("Rule priority"),
    allow: z.boolean().describe("If true, allows access; if false, explicitly denies it"),
  })).optional(),
});
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>;

//##################################################
// Delete Role 
//##################################################

// ### Params ###
export const DeleteRoleParamsSchema = z.object({
  name: z.string().min(1).max(100)
});
export type DeleteRoleParamsType = z.infer<typeof DeleteRoleParamsSchema>;

//##################################################
// Add Role ACL 
//##################################################

// ### Params ###
export const AddRoleAclParamsSchema = z.object({
  name: z.string().min(1).max(100)
});
export type AddRoleAclParamsType = z.infer<typeof GetRoleParamsSchema>;

// ### Body ###
export const AddRoleAclBodySchema = z.object({
  acltype: z.enum([
    "publishClientSend",
    "publishClientReceive",
    "subscribePattern",
    "unsubscribePattern"
  ]).describe("Permission type"),
  topic: z.string().min(1).describe("MQTT topic filter"),
  priority: z.number().describe("Rule priority (higher wins)"),
  allow: z.boolean().describe("Allow or deny access"),
});
export type AddRoleAclBodyType = z.infer<typeof AddRoleAclBodySchema>;

//##################################################
// Remove Role ACL 
//##################################################

// ### Params ###
export const RemoveRoleAclParamsSchema = z.object({
  name: z.string().min(1).max(100)
});
export type RemoveRoleAclParamsType = z.infer<typeof RemoveRoleAclParamsSchema>;

// ### Body ###
export const RemoveRoleAclBodySchema = z.object({
  acltype: z.enum([
    "publishClientSend",
    "publishClientReceive",
    "subscribePattern",
    "unsubscribePattern"
  ]).describe("Permission type to remove"),
  topic: z.string().min(1).describe("MQTT topic filter to remove"),
});
export type RemoveRoleAclBodyType = z.infer<typeof RemoveRoleAclBodySchema>;