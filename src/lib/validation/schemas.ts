import { z } from "zod";

// ─── Auth Schemas ───

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters")
    .transform((v) => v.trim()),
  householdName: z
    .string()
    .min(1, "Household name is required")
    .max(50, "Household name must be at most 50 characters")
    .transform((v) => v.trim())
    .optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

// ─── Invite Schema ───

export const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

// ─── Metric Definition Schema ───

export const metricDefinitionSchema = z
  .object({
    name: z
      .string()
      .min(1, "Metric name is required")
      .max(60, "Metric name must be at most 60 characters")
      .transform((v) => v.trim()),
    description: z
      .string()
      .max(200, "Description must be at most 200 characters")
      .optional()
      .transform((v) => v?.trim() || null),
    scope: z.enum(["shared", "personal"]),
    input_type: z.enum([
      "boolean",
      "count",
      "duration_minutes",
      "amount_decimal",
      "rating_1_to_5",
      "short_text",
    ]),
    unit: z
      .string()
      .max(20)
      .optional()
      .transform((v) => v?.trim() || null),
    target_value: z.number().positive().optional().nullable(),
    target_operator: z.enum(["gte", "lte", "eq"]).optional().nullable(),
    icon: z.string().max(30).optional().nullable(),
    color_token: z.string().max(30).optional().nullable(),
    visible_to_partner: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.target_value != null && !data.target_operator) return false;
      if (data.target_operator != null && data.target_value == null) return false;
      return true;
    },
    { message: "Target value and operator must both be set or both be empty" }
  );

export type MetricDefinitionInput = z.infer<typeof metricDefinitionSchema>;

// ─── Daily Entry Schema ───

export const dailyEntrySchema = z.object({
  metric_definition_id: z.string().uuid(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  value_boolean: z.boolean().optional().nullable(),
  value_number: z.number().optional().nullable(),
  value_text: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => v?.trim() || null),
});

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;

// ─── Daily Note Schema ───

export const dailyNoteSchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  note: z
    .string()
    .min(1, "Note cannot be empty")
    .max(300, "Note must be at most 300 characters")
    .transform((v) => v.trim()),
});

export type DailyNoteInput = z.infer<typeof dailyNoteSchema>;

// ─── Household Schema ───

export const updateHouseholdSchema = z.object({
  name: z
    .string()
    .min(1, "Household name is required")
    .max(50, "Household name must be at most 50 characters")
    .transform((v) => v.trim()),
});

export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

// ─── Profile Schema ───

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters")
    .transform((v) => v.trim()),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
