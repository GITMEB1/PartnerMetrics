import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role, households(id, name)")
    .eq("user_id", user.id)
    .single();

  // Get members
  const householdId = membership?.household_id;
  let members: { userId: string; displayName: string; role: string }[] = [];
  let invitations: { id: string; email: string; status: string; created_at: string }[] = [];

  if (householdId) {
    const { data: membersData } = await supabase
      .from("household_members")
      .select("user_id, role, profiles(display_name)")
      .eq("household_id", householdId);

    members = (membersData || []).map((m) => ({
      userId: m.user_id,
      displayName: (m.profiles as unknown as { display_name: string })?.display_name || "Unknown",
      role: m.role,
    }));

    const { data: inviteData } = await supabase
      .from("invitations")
      .select("id, email, status, created_at")
      .eq("household_id", householdId)
      .eq("status", "pending");

    invitations = inviteData || [];
  }

  const household = membership?.households as unknown as { id: string; name: string } | null;

  return (
    <SettingsClient
      profile={profile}
      household={household}
      members={members}
      invitations={invitations}
      isOwner={membership?.role === "owner"}
      userEmail={user.email || ""}
    />
  );
}
