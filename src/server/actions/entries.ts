"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dailyEntrySchema } from "@/lib/validation/schemas";

export type EntryResult = {
  error?: string;
  success?: boolean;
};

export async function upsertEntry(formData: FormData): Promise<EntryResult> {
  const raw = {
    metric_definition_id: formData.get("metric_definition_id") as string,
    entry_date: formData.get("entry_date") as string,
    value_boolean: formData.get("value_boolean") !== null
      ? formData.get("value_boolean") === "true"
      : null,
    value_number: formData.get("value_number") !== null && formData.get("value_number") !== ""
      ? Number(formData.get("value_number"))
      : null,
    value_text: (formData.get("value_text") as string) || null,
  };

  const parsed = dailyEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get user's household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "No household found" };

  // Upsert entry
  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        household_id: membership.household_id,
        metric_definition_id: parsed.data.metric_definition_id,
        user_id: user.id,
        entry_date: parsed.data.entry_date,
        value_boolean: parsed.data.value_boolean ?? null,
        value_number: parsed.data.value_number ?? null,
        value_text: parsed.data.value_text ?? null,
      },
      { onConflict: "metric_definition_id,user_id,entry_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/app/today");
  return { success: true };
}

export async function upsertEntryDirect(data: {
  metric_definition_id: string;
  entry_date: string;
  value_boolean?: boolean | null;
  value_number?: number | null;
  value_text?: string | null;
}): Promise<EntryResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) return { error: "No household found" };

  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        household_id: membership.household_id,
        metric_definition_id: data.metric_definition_id,
        user_id: user.id,
        entry_date: data.entry_date,
        value_boolean: data.value_boolean ?? null,
        value_number: data.value_number ?? null,
        value_text: data.value_text ?? null,
      },
      { onConflict: "metric_definition_id,user_id,entry_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/app/today");
  return { success: true };
}
