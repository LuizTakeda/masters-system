import z from "zod";
export {
  NgsiLdHeadersSchema,
  type NgsiLdHeadersType,
} from "./types.endpoints.js";

//##################################################
// Common Subscription Member Schemas (clause 5.2)
//##################################################

export const KeyValuePairSchema = z.object({
  key: z.string().describe("The key of the key/value pair"),
  value: z.string().describe("The value of the key/value pair"),
});
export type KeyValuePairType = z.infer<typeof KeyValuePairSchema>;

export const EndpointSchema = z.object({
  uri: z
    .string()
    .min(1, "Endpoint URI is required")
    .describe(
      "URI which conveys the endpoint which will receive the notification",
    ),
  accept: z
    .enum(["application/json", "application/ld+json", "application/geo+json"])
    .default("application/json")
    .optional()
    .describe("MIME type of the notification payload body"),
  timeout: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum period in ms before a notification is assumed failed"),
  cooldown: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      "Minimum period in ms to elapse before retrying the same endpoint",
    ),
  receiverInfo: z
    .array(KeyValuePairSchema)
    .optional()
    .describe(
      "Generic key/value array to convey optional information to the receiver",
    ),
  notifierInfo: z
    .array(KeyValuePairSchema)
    .optional()
    .describe("Generic key/value array to set up communication channel"),
});
export type EndpointType = z.infer<typeof EndpointSchema>;

export const NotificationParamsSchema = z.object({
  attributes: z
    .array(z.string())
    .min(1)
    .optional()
    .describe(
      "Entity attribute names to include in payload (deprecated synonym for pick)",
    ),
  sysAttrs: z
    .boolean()
    .default(false)
    .optional()
    .describe("Include createdAt, modifiedAt, and deletedAt in payload body"),
  format: z
    .enum(["normalized", "concise", "keyValues"])
    .default("normalized")
    .optional()
    .describe(
      "Representation format of entities delivered at notification time",
    ),
  pick: z
    .array(z.string())
    .min(1)
    .optional()
    .describe("Entity members to include in notification payload"),
  omit: z
    .array(z.string())
    .min(1)
    .optional()
    .describe("Entity members to omit from notification payload"),
  showChanges: z
    .boolean()
    .default(false)
    .optional()
    .describe("Include previousValue / previousObject if available"),
  join: z
    .enum(["flat", "inline", "@none"])
    .default("@none")
    .optional()
    .describe("Type of Linked Entity retrieval to apply"),
  joinLevel: z
    .number()
    .int()
    .min(1)
    .default(1)
    .optional()
    .describe("Depth of Linked Entity retrieval to apply"),
  endpoint: EndpointSchema.describe("Notification endpoint details"),
  // System-generated / read-only fields provided by Context Broker
  status: z
    .enum(["ok", "failed"])
    .optional()
    .describe("Status of the notification delivery (read-only)"),
  timesSent: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of times notification has been sent (read-only)"),
  timesFailed: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Number of times delivery has failed (read-only)"),
  lastNotification: z
    .string()
    .optional()
    .describe("Timestamp of last notification sent (read-only)"),
  lastFailure: z
    .string()
    .optional()
    .describe("Timestamp of last failed notification attempt (read-only)"),
  lastSuccess: z
    .string()
    .optional()
    .describe("Timestamp of last successful notification delivery (read-only)"),
});
export type NotificationParamsType = z.infer<typeof NotificationParamsSchema>;

export const EntitySelectorSchema = z.object({
  id: z.string().optional().describe("Entity identifier URI"),
  idPattern: z
    .string()
    .optional()
    .describe("Regex pattern to match entity IDs"),
  type: z
    .string()
    .min(1, "Entity type is required")
    .describe("Selector of Entity Type(s) or '*' for all types"),
});
export type EntitySelectorType = z.infer<typeof EntitySelectorSchema>;

export const GeoQuerySchema = z.object({
  geometry: z
    .string()
    .describe("Type of reference geometry (e.g. Point, Polygon)"),
  coordinates: z.any().describe("Coordinates of the reference geometry"),
  georel: z
    .string()
    .describe("Geo-relationship (e.g. near;maxDistance==1000, within)"),
  geoproperty: z
    .string()
    .optional()
    .default("location")
    .describe("Specifies the GeoProperty to apply the query to"),
});
export type GeoQueryType = z.infer<typeof GeoQuerySchema>;

export const TemporalQuerySchema = z.object({
  timerel: z
    .enum(["before", "after", "between"])
    .describe("Temporal relationship"),
  timeAt: z.string().describe("Starting DateTime in ISO 8601 format"),
  endTimeAt: z
    .string()
    .optional()
    .describe(
      "Ending DateTime in ISO 8601 format (required if timerel='between')",
    ),
  timeproperty: z
    .enum(["observedAt", "createdAt", "modifiedAt", "deletedAt"])
    .default("observedAt")
    .optional()
    .describe("Temporal property to evaluate"),
});
export type TemporalQueryType = z.infer<typeof TemporalQuerySchema>;

export const NotificationTriggerEnum = z.enum([
  "entityCreated",
  "entityUpdated",
  "entityDeleted",
  "attributeCreated",
  "attributeUpdated",
  "attributeDeleted",
]);
export type NotificationTriggerType = z.infer<typeof NotificationTriggerEnum>;

export const SubscriptionStatusEnum = z.enum(["active", "paused", "expired"]);
export type SubscriptionStatusType = z.infer<typeof SubscriptionStatusEnum>;

export const SubscriptionSchema = z
  .object({
    id: z
      .string()
      .optional()
      .describe("Unique Subscription URI identifier (JSON-LD @id)"),
    type: z
      .literal("Subscription")
      .default("Subscription")
      .describe("JSON-LD @type"),
    subscriptionName: z
      .string()
      .optional()
      .describe("Short name given to this Subscription"),
    description: z.string().optional().describe("Subscription description"),
    entities: z
      .array(EntitySelectorSchema)
      .min(1)
      .optional()
      .describe("Entities subscribed to"),
    watchedAttributes: z
      .array(z.string())
      .min(1)
      .optional()
      .describe("Attributes to watch for triggering notifications"),
    timeInterval: z
      .number()
      .positive()
      .optional()
      .describe("Delivery interval in seconds for periodic notifications"),
    throttling: z
      .number()
      .positive()
      .optional()
      .describe(
        "Minimal period in seconds between two consecutive notifications",
      ),
    notificationTrigger: z
      .array(NotificationTriggerEnum)
      .optional()
      .describe("Kind of changes that trigger notification"),
    q: z
      .string()
      .optional()
      .describe("Query expression filter (e.g. temperature>25)"),
    geoQ: GeoQuerySchema.optional().describe("Geoquery filter"),
    csf: z
      .string()
      .optional()
      .describe("Context source filter for Context Source Registrations"),
    isActive: z
      .boolean()
      .default(true)
      .optional()
      .describe("Allows temporarily pausing the subscription"),
    notification: NotificationParamsSchema.describe("Notification details"),
    expiresAt: z
      .string()
      .optional()
      .describe("Expiration date-time for subscription (ISO 8601)"),
    temporalQ: TemporalQuerySchema.optional().describe("Temporal query filter"),
    scopeQ: z.string().optional().describe("Scope query filter"),
    lang: z.string().optional().describe("Language filter"),
    localOnly: z
      .boolean()
      .optional()
      .describe("Limits subscription to locally stored entities"),
    jsonldContext: z
      .string()
      .optional()
      .describe("URI of the JSON-LD @context for notifications"),
    datasetId: z
      .array(z.string())
      .optional()
      .describe("Dataset IDs to select for matched attributes"),
    "@context": z
      .union([z.string(), z.array(z.any()), z.record(z.string(), z.any())])
      .optional()
      .describe("JSON-LD context reference"),
    // System-generated / read-only fields
    status: SubscriptionStatusEnum.optional().describe(
      "Read-only subscription status (active, paused, expired)",
    ),
    createdAt: z
      .string()
      .optional()
      .describe("System-generated creation timestamp (ISO 8601)"),
    modifiedAt: z
      .string()
      .optional()
      .describe("System-generated modification timestamp (ISO 8601)"),
    deletedAt: z
      .string()
      .optional()
      .describe("System-generated deletion timestamp (ISO 8601)"),
  })
  .passthrough();
export type SubscriptionType = z.infer<typeof SubscriptionSchema>;

//##################################################
// Create Subscription (POST /subscriptions)
//##################################################

// ### Query ###
export const CreateSubscriptionQuerySchema = z.object({
  local: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .optional()
    .describe("Limits operation to local context broker"),
});
export type CreateSubscriptionQueryType = z.infer<
  typeof CreateSubscriptionQuerySchema
>;

// ### Body ###
export const CreateSubscriptionBodySchema = SubscriptionSchema;
export type CreateSubscriptionBodyType = z.infer<
  typeof CreateSubscriptionBodySchema
>;

//##################################################
// Query Subscriptions (GET /subscriptions)
//##################################################

// ### Query ###
export const QuerySubscriptionsQuerySchema = z.object({
  options: z
    .enum(["sysAttrs"])
    .optional()
    .describe("When sysAttrs is included, createdAt/modifiedAt are returned"),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(1000)
    .default(20)
    .optional()
    .describe("Max number of subscriptions to return (1-1000)"),
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
  local: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .optional()
    .describe("Limits operation to local context broker"),
});
export type QuerySubscriptionsQueryType = z.infer<
  typeof QuerySubscriptionsQuerySchema
>;

// ### Response ###
export const QuerySubscriptionsResponseSchema = z.array(SubscriptionSchema);
export type QuerySubscriptionsResponseType = z.infer<
  typeof QuerySubscriptionsResponseSchema
>;

//##################################################
// Retrieve Subscription by ID (GET /subscriptions/{subscriptionId})
//##################################################

// ### Params ###
export const GetSubscriptionParamsSchema = z.object({
  subscriptionId: z
    .string()
    .min(1, "subscriptionId is required")
    .describe("Subscription URI identifier"),
});
export type GetSubscriptionParamsType = z.infer<
  typeof GetSubscriptionParamsSchema
>;

// ### Query ###
export const GetSubscriptionQuerySchema = z.object({
  options: z
    .enum(["sysAttrs"])
    .optional()
    .describe("When sysAttrs is included, createdAt/modifiedAt are returned"),
  local: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .optional()
    .describe("Limits operation to local context broker"),
});
export type GetSubscriptionQueryType = z.infer<
  typeof GetSubscriptionQuerySchema
>;

// ### Response ###
export const GetSubscriptionResponseSchema = SubscriptionSchema;
export type GetSubscriptionResponseType = z.infer<
  typeof GetSubscriptionResponseSchema
>;

//##################################################
// Update Subscription by ID (PATCH /subscriptions/{subscriptionId})
//##################################################

// ### Params ###
export const UpdateSubscriptionParamsSchema = z.object({
  subscriptionId: z
    .string()
    .min(1, "subscriptionId is required")
    .describe("Subscription URI identifier"),
});
export type UpdateSubscriptionParamsType = z.infer<
  typeof UpdateSubscriptionParamsSchema
>;

// ### Query ###
export const UpdateSubscriptionQuerySchema = z.object({
  local: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .optional()
    .describe("Limits operation to local context broker"),
});
export type UpdateSubscriptionQueryType = z.infer<
  typeof UpdateSubscriptionQuerySchema
>;

// ### Body (SubscriptionFragment) ###
export const UpdateSubscriptionBodySchema =
  SubscriptionSchema.partial().describe(
    "Subscription fragment containing only fields to update",
  );
export type UpdateSubscriptionBodyType = z.infer<
  typeof UpdateSubscriptionBodySchema
>;

//##################################################
// Delete Subscription by ID (DELETE /subscriptions/{subscriptionId})
//##################################################

// ### Params ###
export const DeleteSubscriptionParamsSchema = z.object({
  subscriptionId: z
    .string()
    .min(1, "subscriptionId is required")
    .describe("Subscription URI identifier"),
});
export type DeleteSubscriptionParamsType = z.infer<
  typeof DeleteSubscriptionParamsSchema
>;

// ### Query ###
export const DeleteSubscriptionQuerySchema = z.object({
  local: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1",
      z.boolean(),
    )
    .optional()
    .describe("Limits operation to local context broker"),
});
export type DeleteSubscriptionQueryType = z.infer<
  typeof DeleteSubscriptionQuerySchema
>;

//##################################################
// NGSI-LD Notification Delivery Payload (clause 5.3.1)
// Webhook payload dispatched to subscriber endpoint
//##################################################

export const NgsiLdNotificationPayloadSchema = z
  .object({
    id: z.string().min(1).describe("Notification identifier URI (JSON-LD @id)"),
    type: z
      .literal("Notification")
      .default("Notification")
      .describe("JSON-LD @type"),
    subscriptionId: z
      .string()
      .min(1)
      .describe("Identifier of originating subscription"),
    notifiedAt: z
      .string()
      .describe("Timestamp ISO 8601 when notification was generated"),
    data: z
      .array(z.record(z.string(), z.any()))
      .describe("The content of notification as NGSI-LD entities"),
    "@context": z
      .union([z.string(), z.array(z.any()), z.record(z.string(), z.any())])
      .optional()
      .describe("JSON-LD context reference"),
  })
  .passthrough();
export type NgsiLdNotificationPayloadType = z.infer<
  typeof NgsiLdNotificationPayloadSchema
>;
