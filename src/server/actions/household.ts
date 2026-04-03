"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inviteSchema, updateHouseholdSchema } from "@/lib/validation/schemas";
import { randomBytes } from "crypto";

export type ActionResult = {
  error?: string;
  success?: boolean;
  data?: Record<string, unknown>;
};

export async function createInvitation(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") as string };
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get user's household where they are owner
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single();

  if (!membership) return { error: "You must be a household owner to invite" };

  // Check if household already has 2 members
  const { count } = await supabase
    .from("household_members")
    .select("*", { count: "exact", head: true })
    .eq("household_id", membership.household_id);

  if (count && count >= 2) {
    return { error: "Household already has two members" };
  }

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("household_id", membership.household_id)
    .eq("email", parsed.data.email)
    .eq("status", "pending")
    .single();

  if (existing) {
    return { error: "An invitation is already pending for this email" };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { error } = await supabase.from("invitations").insert({
    household_id: membership.household_id,
    email: parsed.data.email,
    token,
    invited_by: user.id,
    status: "pending",
    expires_at: expiresAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/settings");
  return { 
    success: true, 
    data: { 
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}` 
    } 
  };
}

export async function acceptInvitation(token: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (fetchError || !invitation) {
    return { error: "Invalid or expired invitation" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return { error: "This invitation has expired" };
  }

  // Add user to household
  const { error: joinError } = await supabase.from("household_members").insert({
    household_id: invitation.household_id,
    user_id: user.id,
    role: "member",
  });

  if (joinError) {
    if (joinError.code === "23505") {
      return { error: "You are already a member of this household" };
    }
    return { error: joinError.message };
  }

  // Mark invitation as accepted
  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateHousehold(formData: FormData): Promise<ActionResult> {
  const raw = { name: formData.get("name") as string };
  const parsed = updateHouseholdSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single();

  if (!membership) return { error: "Only the household owner can update the name" };

  const { error } = await supabase
    .from("households")
    .update({ name: parsed.data.name })
    .eq("id", membership.household_id);

  if (error) return { error: error.message };

  revalidatePath("/app/settings");
  return { success: true };
}
