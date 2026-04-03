import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return new Response("No household found", { status: 404 });
  }

  // User requested "export all data the user has access to"
  // So we export the same data visible in history
  // Fetch metrics to filter accessible ones
  const [metricsRes, entriesRes, usersRes] = await Promise.all([
    supabase
      .from("metric_definitions")
      .select("*")
      .eq("household_id", membership.household_id),
    supabase
      .from("daily_entries")
      .select("*")
      .eq("household_id", membership.household_id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("household_members")
      .select("user_id, profiles(display_name)")
      .eq("household_id", membership.household_id),
  ]);

  const metrics = metricsRes.data || [];
  const entries = entriesRes.data || [];
  const members = usersRes.data || [];

  const memberMap = new Map(members.map(m => [m.user_id, (m.profiles as any)?.display_name || "Unknown"]));
  const metricMap = new Map(metrics.map(m => [m.id, m]));

  const relevantMetrics = metrics.filter(
    (m) =>
      m.scope === "shared" ||
      m.owner_user_id === user.id ||
      (m.owner_user_id !== user.id && m.visible_to_partner)
  );
  
  const relevantMetricIds = new Set(relevantMetrics.map(m => m.id));
  const accessibleEntries = entries.filter(e => relevantMetricIds.has(e.metric_definition_id));

  // Build CSV
  const header = ["Date", "Member", "Metric", "Type", "Value", "Unit"].join(",");
  
  const rows = accessibleEntries.map(e => {
    const m = metricMap.get(e.metric_definition_id);
    if (!m) return null;
    
    let val = "";
    if (m.input_type === "boolean") val = e.value_boolean ? "Yes" : "No";
    else if (e.value_number !== null) val = e.value_number.toString();
    else if (e.value_text !== null) val = `"${e.value_text.replace(/"/g, '""')}"`;
    
    const memberName = memberMap.get(e.user_id) || "Unknown";
    
    return [
      e.entry_date,
      `"${memberName}"`,
      `"${m.name}"`,
      m.input_type,
      val,
      m.unit || ""
    ].join(",");
  }).filter(Boolean);

  const csv = [header, ...rows].join("\n");
  const timestamp = format(new Date(), "yyyy-MM-dd");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="partner-metrics-export-${timestamp}.csv"`,
    },
  });
}
