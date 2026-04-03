"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { metricDefinitionSchema } from "@/lib/validation/schemas";

export type MetricResult = {
  error?: string;
  success?: boolean;
};

export async function createMetric(formData: FormData): Promise<MetricResult> {
  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    scope: formData.get("scope") as string,
    input_type: formData.get("input_type") as string,
    unit: (formData.get("unit") as string) || undefined,
    target_value: formData.get("target_value")
      ? Number(formData.get("target_value"))
      : undefined,
    target_operator: (formData.get("target_operator") as string) || undefined,
    icon: (formData.get("icon") as string) || undefined,
    color_token: (formData.get("color_token") as string) || undefined,
    visible_to_partner: formData.get("visible_to_partner") !== "false",
  };

  const parsed = metricDefinitionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "No household found" };

  const { error } = await supabase.from("metric_definitions").insert({
    household_id: membership.household_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    scope: parsed.data.scope,
    owner_user_id: parsed.data.scope === "personal" ? user.id : null,
    visible_to_partner: parsed.data.visible_to_partner ?? true,
    input_type: parsed.data.input_type,
    unit: parsed.data.unit || null,
    target_value: parsed.data.target_value ?? null,
    target_operator: parsed.data.target_operator ?? null,
    icon: parsed.data.icon || null,
    color_token: parsed.data.color_token || null,
    sort_order: 100,
    is_active: true,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/metrics");
  revalidatePath("/app/today");
  return { success: true };
}

export async function updateMetric(
  metricId: string,
  formData: FormData
): Promise<MetricResult> {
  const raw = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    scope: formData.get("scope") as string,
    input_type: formData.get("input_type") as string,
    unit: (formData.get("unit") as string) || undefined,
    target_value: formData.get("target_value")
      ? Number(formData.get("target_value"))
      : undefined,
    target_operator: (formData.get("target_operator") as string) || undefined,
    icon: (formData.get("icon") as string) || undefined,
    visible_to_partner: formData.get("visible_to_partner") !== "false",
  };

  const parsed = metricDefinitionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("metric_definitions")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      scope: parsed.data.scope,
      owner_user_id: parsed.data.scope === "personal" ? user.id : null,
      visible_to_partner: parsed.data.visible_to_partner ?? true,
      input_type: parsed.data.input_type,
      unit: parsed.data.unit || null,
      target_value: parsed.data.target_value ?? null,
      target_operator: parsed.data.target_operator ?? null,
      icon: parsed.data.icon || null,
    })
    .eq("id", metricId);

  if (error) return { error: error.message };

  revalidatePath("/app/metrics");
  revalidatePath("/app/today");
  return { success: true };
}

export async function archiveMetric(metricId: string): Promise<MetricResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("metric_definitions")
    .update({ is_active: false })
    .eq("id", metricId);

  if (error) return { error: error.message };

  revalidatePath("/app/metrics");
  revalidatePath("/app/today");
  return { success: true };
}

export async function restoreMetric(metricId: string): Promise<MetricResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("metric_definitions")
    .update({ is_active: true })
    .eq("id", metricId);

  if (error) return { error: error.message };

  revalidatePath("/app/metrics");
  revalidatePath("/app/today");
  return { success: true };
}
