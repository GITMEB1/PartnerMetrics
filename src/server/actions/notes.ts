"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dailyNoteSchema } from "@/lib/validation/schemas";

export type NoteResult = {
  error?: string;
  success?: boolean;
};

export async function upsertNote(formData: FormData): Promise<NoteResult> {
  const raw = {
    entry_date: formData.get("entry_date") as string,
    note: formData.get("note") as string,
  };

  const parsed = dailyNoteSchema.safeParse(raw);
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

  const { error } = await supabase
    .from("daily_notes")
    .upsert(
      {
        household_id: membership.household_id,
        user_id: user.id,
        entry_date: parsed.data.entry_date,
        note: parsed.data.note,
      },
      { onConflict: "user_id,entry_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/app/today");
  return { success: true };
}

export async function deleteNote(entryDate: string): Promise<NoteResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("daily_notes")
    .delete()
    .eq("user_id", user.id)
    .eq("entry_date", entryDate);

  if (error) return { error: error.message };

  revalidatePath("/app/today");
  return { success: true };
}
