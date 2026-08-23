//##################################################
// Get Clients 
//##################################################

import z from "zod";

// ### Query ###
export const GetClientsQuerySchema = z.object({
  count: z.coerce.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.coerce.number().nonnegative().describe("Where in the list to start")
});
export type GetClientsQueryType = z.infer<typeof GetClientsQuerySchema>;

// ### Response ###
export const GetClientsResponseSchema = z.object({
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
});
export type GetClientsResponseType = z.infer<typeof GetClientsResponseSchema>;

//##################################################
// Get Client Names 
//##################################################

// ### Query ###
export const GetClientNamesQuerySchema = z.object({
  count: z.coerce.number().min(-1).describe("-1 for all, or a positive integer for a limited count"),
  offset: z.coerce.number().nonnegative().describe("Where in the list to start")
});
export type GetClientNamesQueryType = z.infer<typeof GetClientsQuerySchema>;

// ### Response ###
export const GetClientNamesResponseSchema = z.object({
  totalCount: z.number(),
  clients: z.array(z.string())
});
export type GetClientNamesResponseType = z.infer<typeof GetClientNamesResponseSchema>;

//##################################################
// Get Client 
//##################################################

// ### Params ###
export const GetClientParamsSchema = z.object({
  username: z.string().min(1, "Username is required").max(100)
});
export type GetClientParamsType = z.infer<typeof GetClientParamsSchema>;

// ### Response ###
export const GetClientResponseSchema = z.object({
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
});
export type GetClientResponseType = z.infer<typeof GetClientResponseSchema>;

//##################################################
// Create Client 
//##################################################

// ### Body ###
export const CreateClientBodySchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
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
export type CreateClientBodyType = z.infer<typeof CreateClientBodySchema>;

//##################################################
// Delete Client 
//##################################################

// ### Params ###
export const DeleteClientParamsSchema = z.object({
  username: z.string().min(1, "Username is required").max(100)
});
export type DeleteClientParamsType = z.infer<typeof DeleteClientParamsSchema>;



