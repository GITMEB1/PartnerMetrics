import { createClient } from "@/lib/supabase/server";
import { todayString, formatDisplayDate, isEntryLogged, meetsTarget, getEntryNumericValue } from "@/lib/dates/helpers";
import { MetricCard } from "@/components/metrics/MetricCard";
import { HouseholdSummary } from "@/components/metrics/HouseholdSummary";
import { DailyNoteCard } from "@/components/metrics/DailyNoteCard";
import type { MetricDefinition, DailyEntry, Profile } from "@/types/db";
import type { HouseholdSummaryData } from "@/types/domain";
import { CalendarDays } from "lucide-react";

export default async function TodayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const date = todayString();

  // Fetch household membership
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role, households(name)")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold mb-2">No household yet</h2>
        <p className="text-sm text-muted-foreground">
          Create a household in settings or accept an invitation to get started.
        </p>
      </div>
    );
  }

  const householdId = membership.household_id;

  // Fetch all data in parallel
  const [profileRes, membersRes, metricsRes, entriesRes, notesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("household_members").select("user_id, profiles(id, display_name)").eq("household_id", householdId),
    supabase.from("metric_definitions").select("*").eq("household_id", householdId).eq("is_active", true).order("sort_order"),
    supabase.from("daily_entries").select("*").eq("household_id", householdId).eq("entry_date", date),
    supabase.from("daily_notes").select("*").eq("household_id", householdId).eq("entry_date", date),
  ]);

  const currentProfile = profileRes.data;
  const members = membersRes.data || [];
  const metrics = (metricsRes.data || []) as MetricDefinition[];
  const entries = (entriesRes.data || []) as DailyEntry[];
  const notes = notesRes.data || [];

  // Find partner
  const partnerMember = members.find((m) => m.user_id !== user.id);
  const partner = partnerMember?.profiles as unknown as Profile | null;

  // Separate metrics
  const sharedMetrics = metrics.filter((m) => m.scope === "shared");
  const userPersonalMetrics = metrics.filter(
    (m) => m.scope === "personal" && m.owner_user_id === user.id
  );
  const partnerPersonalMetrics = metrics.filter(
    (m) => m.scope === "personal" && m.owner_user_id === partner?.id
  );

  // All metrics the current user logs (shared + their personal)
  const userAllMetrics = [...sharedMetrics, ...userPersonalMetrics];
  const partnerAllMetrics = [...sharedMetrics, ...partnerPersonalMetrics];

  // Get entries by user
  const userEntries = entries.filter((e) => e.user_id === user.id);
  const partnerEntries = entries.filter((e) => e.user_id !== user.id);

  // Notes
  const userNote = notes.find((n) => n.user_id === user.id) || null;
  const partnerNote = notes.find((n) => n.user_id !== user.id) || null;

  // Compute summary
  const userLogged = userAllMetrics.filter((m) =>
    userEntries.some((e) => e.metric_definition_id === m.id && isEntryLogged(e))
  ).length;

  const partnerLogged = partner
    ? partnerAllMetrics.filter((m) =>
        partnerEntries.some((e) => e.metric_definition_id === m.id && isEntryLogged(e))
      ).length
    : 0;

  // Shared targets
  const sharedTargetsTotal = sharedMetrics.filter((m) => m.target_value != null).length;
  const sharedTargetsHit = sharedMetrics.filter((m) => {
    if (m.target_value == null) return false;
    const e = userEntries.find((e) => e.metric_definition_id === m.id);
    const v = getEntryNumericValue(e || null, m.input_type);
    return meetsTarget(v, m.target_value, m.target_operator);
  }).length;

  const summaryData: HouseholdSummaryData = {
    userName: currentProfile?.display_name || "You",
    partnerName: partner?.display_name || null,
    userLogged,
    userTotal: userAllMetrics.length,
    partnerLogged,
    partnerTotal: partner ? partnerAllMetrics.length : 0,
    sharedTargetsHit,
    sharedTargetsTotal,
  };

  const householdName = (membership.households as unknown as { name: string })?.name || "Home";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{formatDisplayDate(date)}</h1>
          <p className="text-sm text-muted-foreground">{householdName}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Summary */}
      <HouseholdSummary data={summaryData} />

      {/* Your Metrics */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Your Metrics
        </h2>
        <div className="space-y-3">
          {userAllMetrics.map((metric) => {
            const entry = userEntries.find(
              (e) => e.metric_definition_id === metric.id
            ) || null;
            return (
              <MetricCard
                key={metric.id}
                metric={metric}
                entry={entry}
                date={date}
                editable={true}
              />
            );
          })}
          {userAllMetrics.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No metrics yet. Add some in the Metrics tab.
            </p>
          )}
        </div>
      </section>

      {/* Daily Note */}
      <DailyNoteCard
        note={userNote?.note || null}
        date={date}
        userName={currentProfile?.display_name || "You"}
        editable={true}
      />

      {/* Partner's Metrics */}
      {partner && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {partner.display_name}&apos;s Metrics
          </h2>
          <div className="space-y-3">
            {partnerAllMetrics.map((metric) => {
              const entry = partnerEntries.find(
                (e) => e.metric_definition_id === metric.id
              ) || null;
              return (
                <MetricCard
                  key={metric.id}
                  metric={metric}
                  entry={entry}
                  date={date}
                  editable={false}
                />
              );
            })}
          </div>
          {partnerNote && (
            <div className="mt-3">
              <DailyNoteCard
                note={partnerNote.note}
                date={date}
                userName={partner.display_name}
                editable={false}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
