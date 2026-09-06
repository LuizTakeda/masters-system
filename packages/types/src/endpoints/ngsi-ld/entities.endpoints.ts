import z from "zod";
export {
  NgsiLdHeadersSchema,
  type NgsiLdHeadersType,
} from "./types.endpoints.js";

//##################################################
// Common NGSI-LD Member Schemas (clause 5.2)
//##################################################

export const NgsiLdPropertySchema = z
  .object({
    type: z.literal("Property").default("Property"),
    value: z.any().describe("Actual property value"),
    observedAt: z
      .string()
      .optional()
      .describe("Observation timestamp (ISO 8601)"),
    unitCode: z.string().optional().describe("UN/CEFACT unit code"),
    datasetId: z.string().optional().describe("Dataset URI"),
    createdAt: z.string().optional(),
    modifiedAt: z.string().optional(),
  })
  .passthrough();
export type NgsiLdPropertyType = z.infer<typeof NgsiLdPropertySchema>;

export const NgsiLdRelationshipSchema = z
  .object({
    type: z.literal("Relationship").default("Relationship"),
    object: z.string().describe("Target entity URI"),
    observedAt: z
      .string()
      .optional()
      .describe("Observation timestamp (ISO 8601)"),
    datasetId: z.string().optional().describe("Dataset URI"),
    createdAt: z.string().optional(),
    modifiedAt: z.string().optional(),
  })
  .passthrough();
export type NgsiLdRelationshipType = z.infer<typeof NgsiLdRelationshipSchema>;

export const NgsiLdGeoPropertySchema = z
  .object({
    type: z.literal("GeoProperty").default("GeoProperty"),
    value: z.object({
      type: z.string(),
      coordinates: z.any(),
    }),
    observedAt: z.string().optional(),
    createdAt: z.string().optional(),
    modifiedAt: z.string().optional(),
  })
  .passthrough();
export type NgsiLdGeoPropertyType = z.infer<typeof NgsiLdGeoPropertySchema>;

export const NgsiLdEntitySchema = z
  .object({
    id: z.string().min(1, "id is required").describe("Unique Entity URI"),
    type: z.union([z.string(), z.array(z.string())]).describe("Entity Type(s)"),
    "@context": z
      .union([z.string(), z.array(z.any()), z.record(z.any(), z.any())])
      .optional()
      .describe("JSON-LD context reference"),
    scope: z.union([z.string(), z.array(z.string())]).optional(),
    location: NgsiLdGeoPropertySchema.optional(),
    observationSpace: NgsiLdGeoPropertySchema.optional(),
    operationSpace: NgsiLdGeoPropertySchema.optional(),
    createdAt: z.string().optional(),
    modifiedAt: z.string().optional(),
    deletedAt: z.string().optional(),
  })
  .passthrough();
export type NgsiLdEntityType = z.infer<typeof NgsiLdEntitySchema>;

export const NgsiLdEntityKeyValuesSchema = z
  .object({
    id: z.string().min(1),
    type: z.union([z.string(), z.array(z.string())]),
  })
  .passthrough();
export type NgsiLdEntityKeyValuesType = z.infer<
  typeof NgsiLdEntityKeyValuesSchema
>;

//##################################################
// Query Entities (GET /entities)
//##################################################

// ### Query ###
export const QueryEntitiesQuerySchema = z.object({
  id: z.string().optional().describe("Comma-separated list of entity IDs"),
  type: z
    .string()
    .optional()
    .describe("Selection of Entity Types or '*' for wildcard"),
  idPattern: z.string().optional().describe("Regex pattern for entity IDs"),
  attrs: z
    .string()
    .optional()
    .describe("Comma-separated list of attributes to return"),
  q: z
    .string()
    .optional()
    .describe("Simple query language expression (e.g. temperature>25)"),
  georel: z.string().optional(),
  geometry: z.string().optional(),
  coordinates: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(1000)
    .default(20)
    .optional()
    .describe("Max number of entities to return (1-1000)"),
  offset: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(0)
    .optional()
    .describe("Number of elements to skip"),
  options: z
    .enum(["keyValues", "sysAttrs"])
    .optional()
    .describe(
      "keyValues simplifies representation, sysAttrs adds createdAt/modifiedAt",
    ),
  count: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .default(false)
    .optional()
    .describe(
      "If true, total count is returned in NGSILD-Results-Count header",
    ),
});
export type QueryEntitiesQueryType = z.infer<typeof QueryEntitiesQuerySchema>;

// ### Response ###
export const QueryEntitiesResponseSchema = z.array(NgsiLdEntitySchema);
export type QueryEntitiesResponseType = z.infer<
  typeof QueryEntitiesResponseSchema
>;

//##################################################
// Retrieve Entity by ID (GET /entities/{entityId})
//##################################################

// ### Params ###
export const GetEntityParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
});
export type GetEntityParamsType = z.infer<typeof GetEntityParamsSchema>;

// ### Query ###
export const GetEntityQuerySchema = z.object({
  attrs: z.string().optional(),
  options: z.enum(["keyValues", "sysAttrs"]).optional(),
});
export type GetEntityQueryType = z.infer<typeof GetEntityQuerySchema>;

// ### Response ###
export const GetEntityResponseSchema = NgsiLdEntitySchema;
export type GetEntityResponseType = z.infer<typeof GetEntityResponseSchema>;

//##################################################
// Create Entity (POST /entities)
//##################################################

// ### Body ###
export const CreateEntityBodySchema = NgsiLdEntitySchema;
export type CreateEntityBodyType = z.infer<typeof CreateEntityBodySchema>;

//##################################################
// Update Entity Attributes (PATCH /entities/{entityId}/attrs)
//##################################################

// ### Params ###
export const UpdateEntityAttrsParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
});
export type UpdateEntityAttrsParamsType = z.infer<
  typeof UpdateEntityAttrsParamsSchema
>;

// ### Body ###
export const UpdateEntityAttrsBodySchema = z
  .record(z.any(), z.any())
  .describe("Attribute fragments to update or merge");
export type UpdateEntityAttrsBodyType = z.infer<
  typeof UpdateEntityAttrsBodySchema
>;

//##################################################
// Append Entity Attributes (POST /entities/{entityId}/attrs)
//##################################################

// ### Params ###
export const AppendEntityAttrsParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
});
export type AppendEntityAttrsParamsType = z.infer<
  typeof AppendEntityAttrsParamsSchema
>;

// ### Query ###
export const AppendEntityAttrsQuerySchema = z.object({
  options: z.enum(["noOverwrite"]).optional(),
});
export type AppendEntityAttrsQueryType = z.infer<
  typeof AppendEntityAttrsQuerySchema
>;

// ### Body ###
export const AppendEntityAttrsBodySchema = z
  .record(z.any(), z.any())
  .describe("Attributes to append");
export type AppendEntityAttrsBodyType = z.infer<
  typeof AppendEntityAttrsBodySchema
>;

//##################################################
// Partial Update Entity Attribute (PATCH /entities/{entityId}/attrs/{attrId})
//##################################################

// ### Params ###
export const PartialUpdateEntityAttrParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
  attrId: z.string().min(1, "attrId is required"),
});
export type PartialUpdateEntityAttrParamsType = z.infer<
  typeof PartialUpdateEntityAttrParamsSchema
>;

// ### Body ###
export const PartialUpdateEntityAttrBodySchema = z
  .record(z.any(), z.any())
  .describe("Attribute fragment to partially update");
export type PartialUpdateEntityAttrBodyType = z.infer<
  typeof PartialUpdateEntityAttrBodySchema
>;

//##################################################
// Delete Entity Attribute (DELETE /entities/{entityId}/attrs/{attrId})
//##################################################

// ### Params ###
export const DeleteEntityAttrParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
  attrId: z.string().min(1, "attrId is required"),
});
export type DeleteEntityAttrParamsType = z.infer<
  typeof DeleteEntityAttrParamsSchema
>;

// ### Query ###
export const DeleteEntityAttrQuerySchema = z.object({
  datasetId: z.string().optional(),
  deleteAll: z.coerce.boolean().optional(),
});
export type DeleteEntityAttrQueryType = z.infer<
  typeof DeleteEntityAttrQuerySchema
>;

//##################################################
// Delete Entity (DELETE /entities/{entityId})
//##################################################

// ### Params ###
export const DeleteEntityParamsSchema = z.object({
  entityId: z.string().min(1, "entityId is required"),
});
export type DeleteEntityParamsType = z.infer<typeof DeleteEntityParamsSchema>;
