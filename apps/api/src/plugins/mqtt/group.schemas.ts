import { z } from "zod";

// ==========================================
// List Groups
// ==========================================
export const ListGroupsSchema = z.object({
  command: z.literal("listGroups"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.number().nonnegative().describe("Where in the list to start")
});
export type ListGroupsType = z.infer<typeof ListGroupsSchema>;

// ## Response (names only)
export const ListGroupsResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("listGroups"),
    error: z.string().optional(),
    data: z.object({
      totalCount: z.number(),
      groups: z.array(z.string())
    }).optional()
  }))
});
export type ListGroupsResponseType = z.infer<typeof ListGroupsResponseSchema>;

// ## Verbose Response
export const ListGroupsVerboseResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listGroups"),
      error: z.string().optional(),
      data: z.object({
        totalCount: z.number().int().nonnegative(),
        groups: z.array(
          z.object({
            groupname: z.string(),
            textname: z.string().optional(),
            textdescription: z.string().optional(),
            roles: z.array(
              z.object({
                rolename: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            clients: z.array(
              z.object({
                username: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([])
          })
        ).optional().default([])
      }).optional()
    })
  )
});
export type ListGroupsVerboseResponseType = z.infer<typeof ListGroupsVerboseResponseSchema>;

// ==========================================
// Get Group
// ==========================================
export const GetGroupSchema = z.object({
  command: z.literal("getGroup"),
  groupname: z.string().min(1, "Group name is required")
});
export type GetGroupType = z.infer<typeof GetGroupSchema>;

// ## Response
export const GetGroupResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("getGroup"),
      error: z.string().optional(),
      data: z.object({
        group: z.object({
          groupname: z.string(),
          textname: z.string().optional(),
          textdescription: z.string().optional(),
          roles: z.array(
            z.object({
              rolename: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          clients: z.array(
            z.object({
              username: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([])
        })
      }).optional()
    })
  )
});
export type GetGroupResponseType = z.infer<typeof GetGroupResponseSchema>;

// ==========================================
// Create Group
// ==========================================
export const CreateGroupSchema = z.object({
  command: z.literal("createGroup"),
  groupname: z.string().min(1, "Group name is required"),
  roles: z.array(z.object({
    rolename: z.string().min(1),
    priority: z.number().optional()
  })).optional()
});
export type CreateGroupType = z.infer<typeof CreateGroupSchema>;

// ## Response
export const CreateGroupResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createGroup"),
    error: z.string().optional()
  }))
});
export type CreateGroupResponseType = z.infer<typeof CreateGroupResponseSchema>;

// ==========================================
// Delete Group
// ==========================================
export const DeleteGroupSchema = z.object({
  command: z.literal("deleteGroup"),
  groupname: z.string().min(1, "Group name is required")
});
export type DeleteGroupType = z.infer<typeof DeleteGroupSchema>;

// ## Response
export const DeleteGroupResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("deleteGroup"),
    error: z.string().optional()
  }))
});
export type DeleteGroupResponseType = z.infer<typeof DeleteGroupResponseSchema>;

// ==========================================
// Add Group Client
// ==========================================
export const AddGroupClientSchema = z.object({
  command: z.literal("addGroupClient"),
  groupname: z.string().min(1, "Group name is required"),
  username: z.string().min(1, "Username is required"),
  priority: z.number().optional().describe("Priority of the group for the client")
});
export type AddGroupClientType = z.infer<typeof AddGroupClientSchema>;

// ## Response
export const AddGroupClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addGroupClient"),
    error: z.string().optional()
  }))
});
export type AddGroupClientResponseType = z.infer<typeof AddGroupClientResponseSchema>;

// ==========================================
// Remove Group Client
// ==========================================
export const RemoveGroupClientSchema = z.object({
  command: z.literal("removeGroupClient"),
  groupname: z.string().min(1, "Group name is required"),
  username: z.string().min(1, "Username is required")
});
export type RemoveGroupClientType = z.infer<typeof RemoveGroupClientSchema>;

// ## Response
export const RemoveGroupClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeGroupClient"),
    error: z.string().optional()
  }))
});
export type RemoveGroupClientResponseType = z.infer<typeof RemoveGroupClientResponseSchema>;

// ==========================================
// Add Group Role
// ==========================================
export const AddGroupRoleSchema = z.object({
  command: z.literal("addGroupRole"),
  groupname: z.string().min(1, "Group name is required"),
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional().describe("Optional priority")
});
export type AddGroupRoleType = z.infer<typeof AddGroupRoleSchema>;

// ## Response
export const AddGroupRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("addGroupRole"),
    error: z.string().optional()
  }))
});
export type AddGroupRoleResponseType = z.infer<typeof AddGroupRoleResponseSchema>;

// ==========================================
// Remove Group Role
// ==========================================
export const RemoveGroupRoleSchema = z.object({
  command: z.literal("removeGroupRole"),
  groupname: z.string().min(1, "Group name is required"),
  rolename: z.string().min(1, "Role name is required")
});
export type RemoveGroupRoleType = z.infer<typeof RemoveGroupRoleSchema>;

// ## Response
export const RemoveGroupRoleResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("removeGroupRole"),
    error: z.string().optional()
  }))
});
export type RemoveGroupRoleResponseType = z.infer<typeof RemoveGroupRoleResponseSchema>;

