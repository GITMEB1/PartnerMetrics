"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signUpSchema, loginSchema, magicLinkSchema } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export type AuthResult = {
  error?: string;
  success?: boolean;
};

export async function signUp(formData: FormData): Promise<AuthResult> {
  let shouldRedirect = false;

  try {
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      displayName: formData.get("displayName") as string,
      householdName: formData.get("householdName") as string,
    };

    const parsed = signUpSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          display_name: parsed.data.displayName,
        },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create account" };
    }

    // Create household if name provided
    if (parsed.data.householdName) {
      const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({ name: parsed.data.householdName, created_by: authData.user.id })
        .select()
        .single();

      if (householdError) {
        return { error: "Account created but failed to create household: " + householdError.message };
      }

      // Add user as owner
      await supabase.from("household_members").insert({
        household_id: household.id,
        user_id: authData.user.id,
        role: "owner",
      });

      // Seed starter metrics
      await seedStarterMetrics(supabase, household.id, authData.user.id);
    }

    shouldRedirect = true;
  } catch (error: any) {
    console.error("signUp Server Error:", error);
    return { error: error?.message || "An internal error occurred." };
  }

  if (shouldRedirect) {
    revalidatePath("/", "layout");
    redirect("/app/today");
  }
  
  return { error: "Unknown outcome" };
}

export async function login(formData: FormData): Promise<AuthResult> {
  let shouldRedirect = false;

  try {
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { error: "Invalid email or password" };
    }

    shouldRedirect = true;
  } catch (error: any) {
    console.error("login Server Error:", error);
    return { error: error?.message || "An internal error occurred." };
  }

  if (shouldRedirect) {
    revalidatePath("/", "layout");
    redirect("/app/today");
  }

  return { error: "Unknown outcome" };
}

export async function sendMagicLink(formData: FormData): Promise<AuthResult> {
  try {
    const raw = { email: formData.get("email") as string };

    const parsed = magicLinkSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("sendMagicLink Server Error:", error);
    return { error: error?.message || "An internal error occurred." };
  }
}

export async function signOut() {
  let shouldRedirect = false;
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    shouldRedirect = true;
  } catch (error) {
    console.error("signOut error:", error);
    // Ignore and redirect anyway
    shouldRedirect = true;
  }

  if (shouldRedirect) {
    revalidatePath("/", "layout");
    redirect("/login");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedStarterMetrics(supabase: any, householdId: string, userId: string) {
  const sharedMetrics = [
    { name: "Hydration", input_type: "amount_decimal", unit: "litres", target_value: 2.0, target_operator: "gte", icon: "droplets", sort_order: 10 },
    { name: "Exercise", input_type: "duration_minutes", unit: "min", target_value: 20, target_operator: "gte", icon: "dumbbell", sort_order: 20 },
    { name: "Sleep", input_type: "amount_decimal", unit: "hours", target_value: 7, target_operator: "gte", icon: "moon", sort_order: 30 },
  ];

  for (const m of sharedMetrics) {
    await supabase.from("metric_definitions").insert({
      household_id: householdId,
      ...m,
      scope: "shared",
      owner_user_id: null,
      visible_to_partner: true,
      is_active: true,
      created_by: userId,
    });
  }
}
