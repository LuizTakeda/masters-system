import z from "zod";

//##################################################
// Common Headers
//##################################################

export const NgsiLdHeadersSchema = z.object({
  "ngsild-tenant": z.string().optional().describe("Target tenant identifier"),
  "fiware-service": z
    .string()
    .optional()
    .describe("Target tenant (Fiware alias)"),
  "fiware-servicepath": z.string().optional().describe("Subservice path"),
  link: z.string().optional().describe("JSON-LD Link header for @context"),
});
export type NgsiLdHeadersType = z.infer<typeof NgsiLdHeadersSchema>;

//##################################################
// Common Types Schemas
//##################################################

export const AttributeSchema = z.object({
  id: z.string().describe("Full URI of attribute name"),
  type: z.literal("Attribute").default("Attribute"),
  attributeName: z
    .string()
    .describe("Name of attribute, short name if in @context"),
  attributeCount: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of attribute instances"),
  attributeTypes: z
    .array(z.string())
    .optional()
    .describe("List of attribute types (e.g. Property, Relationship)"),
  typeNames: z
    .array(z.string())
    .optional()
    .describe("Entity types that contain this attribute"),
});
export type AttributeType = z.infer<typeof AttributeSchema>;

export const EntityTypeSchema = z.object({
  id: z.string().describe("Fully Qualified Name (FQN) of the entity type"),
  type: z.literal("EntityType").default("EntityType"),
  typeName: z.string().describe("Name of the entity type"),
  attributeNames: z
    .array(z.string())
    .describe("List of attributes that instances can have"),
});
export type EntityType = z.infer<typeof EntityTypeSchema>;

export const EntityTypeInfoSchema = z.object({
  id: z.string().describe("Fully Qualified Name (FQN) of the entity type"),
  type: z.literal("EntityTypeInfo").default("EntityTypeInfo"),
  typeName: z.string().describe("Name of the entity type"),
  entityCount: z
    .number()
    .int()
    .nonnegative()
    .describe("Number of entity instances"),
  attributeDetails: z
    .array(AttributeSchema)
    .describe("Detailed attribute specifications"),
});
export type EntityTypeInfoType = z.infer<typeof EntityTypeInfoSchema>;

export const EntityTypeListSchema = z.object({
  id: z.string().describe("Unique identifier for the entity type list"),
  type: z.literal("EntityTypeList").default("EntityTypeList"),
  typeList: z
    .array(z.string())
    .describe("List containing the entity type names"),
});
export type EntityTypeListType = z.infer<typeof EntityTypeListSchema>;

//##################################################
// Get Entity Types (GET /types)
//##################################################

// ### Query ###
export const GetEntityTypesQuerySchema = z.object({
  details: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true" || val === "1";
      return Boolean(val);
    }, z.boolean())
    .default(false)
    .optional()
    .describe(
      "If true, returns detailed EntityType array with attribute details",
    ),
});
export type GetEntityTypesQueryType = z.infer<typeof GetEntityTypesQuerySchema>;

// ### Response ###
export const GetEntityTypesSummaryResponseSchema = EntityTypeListSchema;
export type GetEntityTypesSummaryResponseType = z.infer<
  typeof GetEntityTypesSummaryResponseSchema
>;

export const GetEntityTypesDetailedResponseSchema = z.array(EntityTypeSchema);
export type GetEntityTypesDetailedResponseType = z.infer<
  typeof GetEntityTypesDetailedResponseSchema
>;

export const GetEntityTypesResponseSchema = z.union([
  EntityTypeListSchema,
  z.array(EntityTypeSchema),
]);
export type GetEntityTypesResponseType = z.infer<
  typeof GetEntityTypesResponseSchema
>;

//##################################################
// Get Entity Type Info (GET /types/{type})
//##################################################

// ### Params ###
export const GetEntityTypeInfoParamsSchema = z.object({
  type: z.string().min(1, "type parameter is required"),
});
export type GetEntityTypeInfoParamsType = z.infer<
  typeof GetEntityTypeInfoParamsSchema
>;

// ### Response ###
export const GetEntityTypeInfoResponseSchema = EntityTypeInfoSchema;
export type GetEntityTypeInfoResponseType = z.infer<
  typeof GetEntityTypeInfoResponseSchema
>;
