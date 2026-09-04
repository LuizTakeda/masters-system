import z from "zod";

//##################################################
// Common Device Schemas
//##################################################

export const IotDeviceAttributeSchema = z.object({
  object_id: z
    .string()
    .min(1, "object_id is required")
    .describe("Protocol parameter to be mapped"),
  name: z
    .string()
    .min(1, "Attribute name is required")
    .describe("Attribute name to publish in Context Broker"),
  type: z
    .string()
    .min(1, "Attribute type is required")
    .describe("Attribute type to publish"),
});
export type IotDeviceAttributeType = z.infer<typeof IotDeviceAttributeSchema>;

export const IotDeviceStaticAttributeSchema = z.object({
  name: z
    .string()
    .min(1, "Static attribute name is required")
    .describe("Attribute name to publish"),
  type: z
    .string()
    .min(1, "Static attribute type is required")
    .describe("Attribute type to publish"),
  value: z.any().describe("Static attribute value to publish"),
});
export type IotDeviceStaticAttributeType = z.infer<
  typeof IotDeviceStaticAttributeSchema
>;

export const IotDeviceCommandSchema = z.object({
  name: z
    .string()
    .min(1, "Command name is required")
    .describe("Command identifier"),
  type: z.string().default("command").describe("Must be 'command'"),
  value: z
    .string()
    .optional()
    .describe("Command representation depending on protocol"),
});
export type IotDeviceCommandType = z.infer<typeof IotDeviceCommandSchema>;

export const IotDeviceSchema = z.object({
  _id: z.string().optional(),
  device_id: z
    .string()
    .min(1, "device_id is required")
    .describe("Unique identifier within a service"),
  service: z.string().optional().describe("Service tenant name"),
  service_path: z.string().optional().describe("Subservice path"),
  entity_name: z
    .string()
    .optional()
    .describe("Entity name used for Context Broker publication"),
  entity_type: z
    .string()
    .optional()
    .describe("Entity type used for Context Broker publication"),
  transport: z
    .string()
    .optional()
    .describe("Transport protocol (e.g. MQTT or HTTP)"),
  protocol: z.string().describe("Protocol identifier (e.g. IoTA-JSON)"),
  apikey: z.string().optional().describe("API key for the service group"),
  timezone: z.string().optional().describe("Device timezone"),
  endpoint: z
    .string()
    .optional()
    .describe("Endpoint URL when device uses push commands"),
  registrationId: z
    .string()
    .optional()
    .describe("Context Source Registration ID in Orion"),
  creationDate: z.string().optional().describe("Creation timestamp"),
  internalId: z.string().nullable().optional(),
  attributes: z.array(IotDeviceAttributeSchema).optional().default([]),
  static_attributes: z
    .array(IotDeviceStaticAttributeSchema)
    .optional()
    .default([]),
  commands: z.array(IotDeviceCommandSchema).optional().default([]),
});
export type IotDeviceType = z.infer<typeof IotDeviceSchema>;

//##################################################
// Get Devices
//##################################################

// ### Query ###
export const GetDevicesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(20).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  detailed: z
    .enum(["on", "off"])
    .default("off")
    .optional()
    .describe("on returns full device details, off returns summary"),
  entity: z.string().optional().describe("Filter by entity name"),
  protocol: z.string().optional().describe("Filter by protocol"),
  device_id: z.string().optional().describe("Filter by device_id"),
});
export type GetDevicesQueryType = z.infer<typeof GetDevicesQuerySchema>;

// ### Response ###
export const GetDevicesResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  devices: z.array(IotDeviceSchema).default([]),
});
export type GetDevicesResponseType = z.infer<typeof GetDevicesResponseSchema>;

//##################################################
// Create Device
//##################################################

export const CreateDeviceItemSchema = z.object({
  device_id: z.string().min(1, "device_id is required"),
  protocol: z.string().min(1, "protocol is required").default("IoTA-JSON"),
  entity_name: z.string().optional(),
  entity_type: z.string().optional().default("Device"),
  transport: z.string().optional().default("MQTT"),
  apikey: z.string().optional(),
  timezone: z.string().optional(),
  endpoint: z.string().optional(),
  attributes: z.array(IotDeviceAttributeSchema).optional().default([]),
  static_attributes: z
    .array(IotDeviceStaticAttributeSchema)
    .optional()
    .default([]),
  commands: z.array(IotDeviceCommandSchema).optional().default([]),
});
export type CreateDeviceItemType = z.infer<typeof CreateDeviceItemSchema>;

// ### Body ###
export const CreateDevicesBodySchema = z.object({
  devices: z
    .array(CreateDeviceItemSchema)
    .min(1, "At least one device is required"),
});
export type CreateDevicesBodyType = z.infer<typeof CreateDevicesBodySchema>;

//##################################################
// Get Device by ID
//##################################################

// ### Params ###
export const GetDeviceParamsSchema = z.object({
  device_id: z.string().min(1, "device_id is required"),
});
export type GetDeviceParamsType = z.infer<typeof GetDeviceParamsSchema>;

// ### Response ###
export const GetDeviceResponseSchema = IotDeviceSchema;
export type GetDeviceResponseType = z.infer<typeof GetDeviceResponseSchema>;

//##################################################
// Update Device
//##################################################

// ### Params ###
export const UpdateDeviceParamsSchema = z.object({
  device_id: z.string().min(1, "device_id is required"),
});
export type UpdateDeviceParamsType = z.infer<typeof UpdateDeviceParamsSchema>;

// ### Body ###
export const UpdateDeviceBodySchema = z.object({
  entity_name: z.string().optional(),
  entity_type: z.string().optional(),
  transport: z.string().optional(),
  apikey: z.string().optional(),
  timezone: z.string().optional(),
  endpoint: z.string().optional(),
  attributes: z.array(IotDeviceAttributeSchema).optional(),
  static_attributes: z.array(IotDeviceStaticAttributeSchema).optional(),
  commands: z.array(IotDeviceCommandSchema).optional(),
});
export type UpdateDeviceBodyType = z.infer<typeof UpdateDeviceBodySchema>;

//##################################################
// Delete Device
//##################################################

// ### Params ###
export const DeleteDeviceParamsSchema = z.object({
  device_id: z.string().min(1, "device_id is required"),
});
export type DeleteDeviceParamsType = z.infer<typeof DeleteDeviceParamsSchema>;
