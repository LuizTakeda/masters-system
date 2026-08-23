import z, { number } from "zod";

// ==========================================
// List Roles
// ==========================================

export const ListRolesSchema = z.object({
  command: z.literal("listRoles"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).max(50),
  offset: z.number().nonnegative()
})
export type ListRolesType = z.infer<typeof ListRolesSchema>;

// ## Verbose Response 
export const ListRolesResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listRoles"),
      error: z.string().optional(),
      data: z.object({
        totalCount: z.number().int().nonnegative(),
        roles: z.array(z.string()).optional().default([])
      }).optional()
    })
  )
});
export type ListRolesResponseType = z.infer<typeof ListRolesResponseSchema>;

// ## Verbose Response 
export const ListRolesResponseVerboseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listRoles"),
      error: z.string().optional(),
      data: z.object({
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
      }).optional()
    })
  )
});
export type ListRolesResponseVerboseType = z.infer<typeof ListRolesResponseVerboseSchema>;

// ==========================================
// Get Role
// ==========================================

export const GetRoleSchema = z.object({
  command: z.literal("getRole"),
  rolename: z.string().min(1).max(100),
});
export type GetRoleType = z.infer<typeof GetRoleSchema>;

// ## Response
export const GetRoleResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("getRole"),
      error: z.string().optional(),
      data: z.object({
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
      }).optional()
    })
  )
});
export type GetRoleResponseType = z.infer<typeof GetRoleResponseSchema>;

// ==========================================
// Create Role
// ==========================================

export const CreateRoleSchema = z.object({
  command: z.literal("createRole"),
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

export type CreateRoleType = z.infer<typeof CreateRoleSchema>;

// ## Response
export const CreateRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createRole"),
    error: z.string().optional()
  }))
});
export type CreateRoleResponseType = z.infer<typeof CreateRoleResponseSchema>;

// ==========================================
// Delete Role
// ==========================================

export const DeleteRoleSchema = z.object({
  command: z.literal("deleteRole"),
  rolename: z.string().min(1).max(100)
});
export type DeleteRoleType = z.infer<typeof DeleteRoleSchema>;

// ## Response
export const DeleteRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("deleteRole"),
    error: z.string().optional()
  }))
});
export type DeleteRoleResponseType = z.infer<typeof DeleteRoleResponseSchema>;

// ==========================================
// Add Role ACL
// ==========================================

export const AddRoleACLSchema = z.object({
  command: z.literal("addRoleACL"),
  rolename: z.string().min(1).max(100),
  "acltype": z.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type (e.g., publishClientSend, subscribePattern)"),
  topic: z.string().describe("MQTT topic filter (e.g., '#', '+/sensors')"),
  priority: z.number().describe("Rule priority"),
  allow: z.boolean().describe("If true, allows access; if false, explicitly denies it"),
});
export type AddRoleACLType = z.infer<typeof AddRoleACLSchema>;

// ## Response
export const AddRoleACLResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addRoleACL"),
    error: z.string().optional()
  }))
});
export type AddRoleACLResponseType = z.infer<typeof AddRoleACLResponseSchema>;

// ==========================================
// Remove Role ACL
// ==========================================

export const RemoveRoleACLSchema = z.object({
  command: z.literal("removeRoleACL"),
  rolename: z.string().min(1).max(100),
  acltype: z.enum(["publishClientSend", "publishClientReceive", "subscribePattern", "unsubscribePattern"]).describe("Permission type"),
  topic: z.string().min(1).describe("MQTT topic filter"),
});
export type RemoveRoleACLType = z.infer<typeof RemoveRoleACLSchema>;

// ## Response
export const RemoveRoleACLResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeRoleACL"),
    error: z.string().optional()
  }))
});
export type RemoveRoleACLResponseType = z.infer<typeof RemoveRoleACLResponseSchema>;
