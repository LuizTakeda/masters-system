import { z } from "zod";

// ==========================================
// List Clients
// ==========================================
export const ListClientsSchema = z.object({
  command: z.literal("listClients"),
  verbose: z.boolean().optional().default(false),
  count: z.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.number().nonnegative().describe("Where in the list to start")
});
export type ListClientsType = z.infer<typeof ListClientsSchema>;

// ## Response
export const ListClientsResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("listClients"),
    error: z.string().optional(),
    data: z.object({
      totalCount: z.number(),
      clients: z.array(z.string())
    }).optional()
  }))
});
export type ListClientsResponseType = z.infer<typeof ListClientsResponseSchema>

// ## Verbose Response
export const ListClientsVerboseResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("listClients"),
      error: z.string().optional(),
      data: z.object({
        totalCount: z.number().int().nonnegative(),
        clients: z.array(
          z.object({
            username: z.string(),
            clientid: z.string().optional(),
            textname: z.string().optional(),
            textdescription: z.string().optional(),
            roles: z.array(
              z.object({
                rolename: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            groups: z.array(
              z.object({
                groupname: z.string(),
                priority: z.number().int().optional()
              })
            ).optional().default([]),
            connections: z.array(
              z.object({
                address: z.string()
              })
            ).optional().default([])
          })
        ).optional().default([])
      }).optional()
    })
  )
});
export type ListClientsVerboseResponseType = z.infer<typeof ListClientsVerboseResponseSchema>;


// ==========================================
// Get Client
// ==========================================
export const GetClientSchema = z.object({
  command: z.literal("getClient"),
  username: z.string().min(1, "Username is required")
});
export type GetClientType = z.infer<typeof GetClientSchema>;

// ## Response
export const GetClientResponseSchema = z.object({
  responses: z.array(
    z.object({
      command: z.literal("getClient"),
      error: z.string().optional(),
      data: z.object({
        client: z.object({
          username: z.string(),
          clientid: z.string().optional(),
          textname: z.string().optional(),
          textdescription: z.string().optional(),
          disabled: z.boolean().optional(),
          roles: z.array(
            z.object({
              rolename: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          groups: z.array(
            z.object({
              groupname: z.string(),
              priority: z.number().int().optional()
            })
          ).optional().default([]),
          connections: z.array(
            z.object({
              address: z.string()
            })
          ).optional().default([])
        })
      }).optional()
    })
  )
});
export type GetClientResponseType = z.infer<typeof GetClientResponseSchema>;

// ==========================================
// Create Client
// ==========================================
export const CreateClientSchema = z.object({
  command: z.literal("createClient"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  clientid: z.string().optional(),
  textname: z.string().optional(),
  textdescription: z.string().optional(),
  groups: z.array(z.object({
    groupname: z.string().min(1),
    priority: z.number().optional()
  })).optional(),
  roles: z.array(z.object({
    rolename: z.string().min(1),
    priority: z.number().optional()
  })).optional()
});
export type CreateClientType = z.infer<typeof CreateClientSchema>;

// ## Response
export const CreateClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("createClient"),
    error: z.string().optional()
  }))
});
export type CreateClientResponseType = z.infer<typeof CreateClientResponseSchema>;

// ==========================================
// Delete Client
// ==========================================
export const DeleteClientSchema = z.object({
  command: z.literal("deleteClient"),
  username: z.string().min(1, "Username is required")
});
export type DeleteClientType = z.infer<typeof DeleteClientSchema>;

// ## Response
export const DeleteClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("deleteClient"),
    error: z.string().optional()
  }))
});
export type DeleteClientResponseType = z.infer<typeof DeleteClientResponseSchema>;

// ==========================================
// Enable Client
// ==========================================
export const EnableClientSchema = z.object({
  command: z.literal("enableClient"),
  username: z.string().min(1, "Username is required")
});

export type EnableClientType = z.infer<typeof EnableClientSchema>;

// ## Response
export const EnableClientResponseSchema = z.object({
  responses: z.array(z.object({
    command: z.literal("enableClient"),
    error: z.string().optional()
  }))
});
export type EnableClientResponseType = z.infer<typeof EnableClientResponseSchema>;

// ==========================================
// Disable Client
// ==========================================
export const DisableClientSchema = z.object({
  command: z.literal("disableClient"),
  username: z.string().min(1, "Username is required")
});

export type DisableClientType = z.infer<typeof DisableClientSchema>;

// ==========================================
// Set Client Password
// ==========================================
export const SetClientPasswordSchema = z.object({
  command: z.literal("setClientPassword"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "New password is required")
});

export type SetClientPasswordType = z.infer<typeof SetClientPasswordSchema>;

// ==========================================
// Add Client Role
// ==========================================
export const AddClientRoleSchema = z.object({
  command: z.literal("addClientRole"),
  username: z.string().min(1, "Username is required"),
  rolename: z.string().min(1, "Role name is required"),
  priority: z.number().optional().describe("Optional priority")
});

export type AddClientRoleType = z.infer<typeof AddClientRoleSchema>;

// ==========================================
// Remove Client Role
// ==========================================
export const RemoveClientRoleSchema = z.object({
  command: z.literal("removeClientRole"),
  username: z.string().min(1, "Username is required"),
  rolename: z.string().min(1, "Role name to remove is required")
});

export type RemoveClientRoleType = z.infer<typeof RemoveClientRoleSchema>;