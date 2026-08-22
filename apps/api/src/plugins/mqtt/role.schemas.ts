import z from "zod";

// ### listRoles ###

export const ListRolesSchema = z.object({
  command: z.literal("listRoles"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).max(50),
  offset: z.number().nonnegative()
})

export type ListRolesType = z.infer<typeof ListRolesSchema>;

// Verbose Response 
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

// Verbose Response 
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

// ### getRole ###

export const GetRoleSchema = z.object({
  command: z.literal("getRole"),
  rolename: z.string().min(1).max(100),
});

export type GetRoleType = z.infer<typeof GetRoleSchema>;

// Response
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

// ### createRole ###

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

// Response
export const CreateRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createRole"),
    error: z.string().optional()
  }))
});

export type CreateRoleResponseType = z.infer<typeof CreateRoleResponseSchema>;

