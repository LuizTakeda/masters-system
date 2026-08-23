import z from "zod";

//##################################################
// Get Groups
//##################################################

// ### Query ###
export const GetGroupsQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.coerce.number().nonnegative().optional().default(0).describe("Where in the list to start")
});
export type GetGroupsQueryType = z.infer<typeof GetGroupsQuerySchema>;

// ### Response ###
export const GetGroupsResponseSchema = z.object({
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
});
export type GetGroupsResponseType = z.infer<typeof GetGroupsResponseSchema>;

//##################################################
// Get Group Names
//##################################################

// ### Query ###
export const GetGroupNamesQuerySchema = z.object({
  count: z.coerce.number().min(-1).optional().default(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.coerce.number().nonnegative().optional().default(0).describe("Where in the list to start")
});
export type GetGroupNamesQueryType = z.infer<typeof GetGroupNamesQuerySchema>;

// ### Response ###
export const GetGroupNamesResponseSchema = z.object({
  totalCount: z.number(),
  groups: z.array(z.string())
});
export type GetGroupNamesResponseType = z.infer<typeof GetGroupNamesResponseSchema>;

//##################################################
// Get Group
//##################################################

// ### Params ###
export const GetGroupParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type GetGroupParamsType = z.infer<typeof GetGroupParamsSchema>;

// ### Response ###
export const GetGroupResponseSchema = z.object({
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
});
export type GetGroupResponseType = z.infer<typeof GetGroupResponseSchema>;

//##################################################
// Create Group
//##################################################

// ### Body ###
export const CreateGroupBodySchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100),
  roles: z.array(z.object({
    rolename: z.string().min(1),
    priority: z.number().optional()
  })).optional()
});
export type CreateGroupBodyType = z.infer<typeof CreateGroupBodySchema>;

//##################################################
// Delete Group
//##################################################

// ### Params ###
export const DeleteGroupParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type DeleteGroupParamsType = z.infer<typeof DeleteGroupParamsSchema>;

//##################################################
// Add Group Client
//##################################################

// ### Params ###
export const AddGroupClientParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type AddGroupClientParamsType = z.infer<typeof AddGroupClientParamsSchema>;

// ### Body ###
export const AddGroupClientBodySchema = z.object({
  username: z.string().min(1, "Username is required"),
  priority: z.number().optional().describe("Priority of the group for the client")
});
export type AddGroupClientBodyType = z.infer<typeof AddGroupClientBodySchema>;

//##################################################
// Remove Group Client
//##################################################

// ### Params ###
export const RemoveGroupClientParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type RemoveGroupClientParamsType = z.infer<typeof RemoveGroupClientParamsSchema>;

// ### Body ###
export const RemoveGroupClientBodySchema = z.object({
  username: z.string().min(1, "Username is required")
});
export type RemoveGroupClientBodyType = z.infer<typeof RemoveGroupClientBodySchema>;

//##################################################
// Add Group Role
//##################################################

// ### Params ###
export const AddGroupRoleParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type AddGroupRoleParamsType = z.infer<typeof AddGroupRoleParamsSchema>;

// ### Body ###
export const AddGroupRoleBodySchema = z.object({
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional().describe("Optional priority")
});
export type AddGroupRoleBodyType = z.infer<typeof AddGroupRoleBodySchema>;

//##################################################
// Remove Group Role
//##################################################

// ### Params ###
export const RemoveGroupRoleParamsSchema = z.object({
  groupname: z.string().min(1, "Group name is required").max(100)
});
export type RemoveGroupRoleParamsType = z.infer<typeof RemoveGroupRoleParamsSchema>;

// ### Body ###
export const RemoveGroupRoleBodySchema = z.object({
  rolename: z.string().min(1, "Role name is required")
});
export type RemoveGroupRoleBodyType = z.infer<typeof RemoveGroupRoleBodySchema>;

