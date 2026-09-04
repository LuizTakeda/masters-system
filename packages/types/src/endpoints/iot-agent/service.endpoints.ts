import z from "zod";

//##################################################
// Common Service Schemas
//##################################################

export const IotAgentHeadersSchema = z.object({
  "fiware-service": z
    .string()
    .min(1, "fiware-service header is required")
    .max(50),
  "fiware-servicepath": z.string().min(1).max(51).default("/"),
});
export type IotAgentHeadersType = z.infer<typeof IotAgentHeadersSchema>;

export const IotServiceAttributeSchema = z.object({
  object_id: z
    .string()
    .min(1, "object_id is required")
    .describe("Protocol parameter to be mapped"),
  name: z
    .string()
    .min(1, "Attribute name is required")
    .describe("Attribute name to publish"),
  type: z
    .string()
    .min(1, "Attribute type is required")
    .describe("Attribute type to publish"),
});
export type IotServiceAttributeType = z.infer<typeof IotServiceAttributeSchema>;

export const IotServiceStaticAttributeSchema = z.object({
  name: z
    .string()
    .min(1, "Static attribute name is required")
    .describe("Attribute name to publish"),
  type: z
    .string()
    .min(1, "Static attribute type is required")
    .describe("Attribute type to publish"),
  value: z.any().describe("Attribute value to publish"),
});
export type IotServiceStaticAttributeType = z.infer<
  typeof IotServiceStaticAttributeSchema
>;

export const IotServiceCommandSchema = z.object({
  name: z
    .string()
    .min(1, "Command name is required")
    .describe("Command identifier"),
  type: z
    .string()
    .default("command")
    .describe("Command type, must be 'command'"),
  value: z.string().optional().describe("Command representation"),
});
export type IotServiceCommandType = z.infer<typeof IotServiceCommandSchema>;

export const IotServiceGroupSchema = z.object({
  _id: z.string().optional(),
  apikey: z.string().describe("Key used for devices belonging to this service"),
  token: z.string().optional().describe("Security token for authentication"),
  cbroker: z
    .string()
    .optional()
    .describe("Context Broker endpoint assigned to this service"),
  entity_type: z
    .string()
    .optional()
    .describe("Entity type used in entity publication"),
  resource: z.string().describe("Path in IoTAgent where HTTP data is received"),
  outgoing_route: z
    .string()
    .optional()
    .describe("Identifier for VPN/GRE tunnel"),
  service: z.string().optional().describe("Service tenant name"),
  service_path: z.string().optional().describe("Subservice path"),
  attributes: z.array(IotServiceAttributeSchema).optional().default([]),
  static_attributes: z
    .array(IotServiceStaticAttributeSchema)
    .optional()
    .default([]),
  commands: z.array(IotServiceCommandSchema).optional().default([]),
});
export type IotServiceGroupType = z.infer<typeof IotServiceGroupSchema>;

//##################################################
// Get Services
//##################################################

// ### Query ###
export const GetServicesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  resource: z
    .string()
    .optional()
    .describe("Filter only services for this resource path"),
});
export type GetServicesQueryType = z.infer<typeof GetServicesQuerySchema>;

// ### Response ###
export const GetServicesResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  services: z.array(IotServiceGroupSchema).default([]),
});
export type GetServicesResponseType = z.infer<typeof GetServicesResponseSchema>;

//##################################################
// Create Service
//##################################################

export const CreateServiceItemSchema = z.object({
  apikey: z.string().min(1, "API Key is required"),
  resource: z.string().min(1, "Resource is required").default("/iot/json"),
  cbroker: z.string().optional(),
  entity_type: z.string().optional().default("Thing"),
  token: z.string().optional(),
  outgoing_route: z.string().optional(),
  attributes: z.array(IotServiceAttributeSchema).optional().default([]),
  static_attributes: z
    .array(IotServiceStaticAttributeSchema)
    .optional()
    .default([]),
  commands: z.array(IotServiceCommandSchema).optional().default([]),
});
export type CreateServiceItemType = z.infer<typeof CreateServiceItemSchema>;

// ### Body ###
export const CreateServicesBodySchema = z.object({
  services: z
    .array(CreateServiceItemSchema)
    .min(1, "At least one service must be provided"),
});
export type CreateServicesBodyType = z.infer<typeof CreateServicesBodySchema>;

//##################################################
// Update Service
//##################################################

// ### Query ###
export const UpdateServiceQuerySchema = z.object({
  resource: z.string().min(1, "Resource path is required"),
  apikey: z.string().optional().default(""),
});
export type UpdateServiceQueryType = z.infer<typeof UpdateServiceQuerySchema>;

// ### Body ###
export const UpdateServiceBodySchema = z.object({
  cbroker: z.string().optional(),
  entity_type: z.string().optional(),
  token: z.string().optional(),
  outgoing_route: z.string().optional(),
  attributes: z.array(IotServiceAttributeSchema).optional(),
  static_attributes: z.array(IotServiceStaticAttributeSchema).optional(),
  commands: z.array(IotServiceCommandSchema).optional(),
});
export type UpdateServiceBodyType = z.infer<typeof UpdateServiceBodySchema>;

//##################################################
// Delete Service
//##################################################

// ### Query ###
export const DeleteServiceQuerySchema = z.object({
  resource: z.string().min(1, "Resource path is required"),
  apikey: z.string().optional().default(""),
  device: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean())
    .optional()
    .default(false)
    .describe("Remove devices in service/subservice"),
});
export type DeleteServiceQueryType = z.infer<typeof DeleteServiceQuerySchema>;
