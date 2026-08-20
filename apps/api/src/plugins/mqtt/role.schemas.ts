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
