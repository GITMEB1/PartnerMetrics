import { createClient } from "@/lib/supabase/server";
import { getDateRange, formatShortDate, getEntryNumericValue, calculateStreak, meetsTarget } from "@/lib/dates/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MetricDefinition, DailyEntry } from "@/types/db";
import type { TrendData } from "@/types/domain";
import { TrendingUp, TrendingDown, Minus, Flame, BarChart3, List } from "lucide-react";
import { HistoryFilters } from "@/components/history/HistoryFilters";

export default async function HistoryPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No household found</p>
      </div>
    );
  }

  // Member fetching for filter
  const { data: householdMembersRes } = await supabase
    .from("household_members")
    .select("*, profiles(display_name)")
    .eq("household_id", membership.household_id);

  const members = householdMembersRes?.map(m => ({
    id: m.user_id,
    name: m.user_id === user.id ? "Me" : (m.profiles as any)?.display_name || "Partner",
  })) || [];

  const daysParam = parseInt(searchParams.days || "7", 10);
  const daysCount = isNaN(daysParam) ? 7 : daysParam;
  
  const datesSelected = getDateRange(daysCount);
  const totalDaysToFetch = daysCount * 2; // For trend comparison
  const fetchDates = getDateRange(totalDaysToFetch);

  const memberFilter = searchParams.member || user.id; // Default to current user
  const metricFilter = searchParams.metric || "all";

  // Fetch metrics and entries
  const [metricsRes, entriesRes] = await Promise.all([
    supabase
      .from("metric_definitions")
      .select("*")
      .eq("household_id", membership.household_id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("daily_entries")
      .select("*")
      .eq("household_id", membership.household_id)
      .gte("entry_date", fetchDates[fetchDates.length - 1])
      .lte("entry_date", fetchDates[0]),
  ]);

  const metrics = (metricsRes.data || []) as MetricDefinition[];
  const allEntries = (entriesRes.data || []) as DailyEntry[];

  // Filter metrics user is allowed to see
  const relevantMetrics = metrics.filter(
    (m) =>
      m.scope === "shared" ||
      m.owner_user_id === user.id ||
      (m.owner_user_id !== user.id && m.visible_to_partner)
  );
  
  const relevantMetricIds = new Set(relevantMetrics.map(m => m.id));

  // Determine allowed entries
  let allowedEntries = allEntries.filter(e => relevantMetricIds.has(e.metric_definition_id));

  // Apply Member Filter onto entries
  if (memberFilter !== "all") {
     allowedEntries = allowedEntries.filter(e => e.user_id === memberFilter);
  }

  // Filter trends to what matches metricFilter
  const metricsToDisplay = metricFilter === "all" 
    ? relevantMetrics 
    : relevantMetrics.filter(m => m.id === metricFilter);

  // Build trend data
  const trends: TrendData[] = metricsToDisplay
    .filter((m) => m.input_type !== "short_text")
    .map((metric) => {
      const metricEntries = allowedEntries.filter(
        (e) => e.metric_definition_id === metric.id
      );

      const recentSelected = metricEntries.filter((e) => datesSelected.includes(e.entry_date));
      const priorSelected = metricEntries.filter(
        (e) =>
          !datesSelected.includes(e.entry_date) &&
          fetchDates.indexOf(e.entry_date) < fetchDates.length - daysCount
      );

      const sumSelected = recentSelected.reduce((acc, e) => {
        const v = getEntryNumericValue(e, metric.input_type);
        return acc + (v ?? 0);
      }, 0);

      const sumPrior = priorSelected.slice(0, daysCount).reduce((acc, e) => {
        const v = getEntryNumericValue(e, metric.input_type);
        return acc + (v ?? 0);
      }, 0);

      const currentValue =
        metric.input_type === "count" || metric.input_type === "boolean"
          ? sumSelected
          : recentSelected.length > 0
          ? sumSelected / recentSelected.length
          : null;

      const previousValue =
        metric.input_type === "count" || metric.input_type === "boolean"
          ? sumPrior
          : priorSelected.length > 0
          ? sumPrior / Math.min(priorSelected.length, daysCount)
          : null;

      const changePercent =
        currentValue != null && previousValue != null && previousValue > 0
          ? Math.round(((currentValue - previousValue) / previousValue) * 100)
          : null;

      // Daily chart data (For all selected days)
      // Group by date because if "member=all" is selected, we combine them
      const chartData = datesSelected.map((d) => {
        const entriesForDate = metricEntries.filter((e) => e.entry_date === d);
        if (entriesForDate.length === 0) return { date: d, value: null };
        const combinedVal = entriesForDate.reduce((acc, e) => {
           const v = getEntryNumericValue(e, metric.input_type);
           return acc + (v ?? 0);
        }, 0);
        const avgVal = metric.input_type === "rating_1_to_5" ? combinedVal / entriesForDate.length : combinedVal;
        return {
          date: d,
          value: avgVal,
          count: entriesForDate.length
        };
      });

      // Streak
      const streakValues = chartData.map(d => ({
         date: d.date, 
         value: metric.target_value != null 
             ? meetsTarget(d.value, metric.target_value, metric.target_operator) 
             : !!d.value
      })).filter(v => typeof v.value !== "undefined" && v.value !== null);

      const streak = calculateStreak(streakValues as any);

      return {
        metricId: metric.id,
        metricName: metric.name,
        metricInputType: metric.input_type,
        currentPeriodValue: currentValue,
        previousPeriodValue: previousValue,
        changePercent,
        streak,
        unit: metric.unit,
        targetValue: metric.target_value,
        targetOperator: metric.target_operator,
        dailyValues: chartData,
      };
    });

  // Recent notes (only for current filter)
  let notesQuery = supabase
    .from("daily_notes")
    .select("*")
    .eq("household_id", membership.household_id)
    .order("entry_date", { ascending: false })
    .limit(5);

  if (memberFilter !== "all") {
    notesQuery = notesQuery.eq("user_id", memberFilter);
  }

  const { data: notes } = await notesQuery;

  // Raw entries list
  const recentRawEntries = [...allowedEntries]
    .filter(e => datesSelected.includes(e.entry_date))
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">History</h1>
          <p className="text-sm text-muted-foreground">{daysCount === 7 ? "Last 7 days" : "Last 30 days"}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
      </div>

      <HistoryFilters metrics={relevantMetrics.map(m => ({ id: m.id, name: m.name }))} members={members} />

      {/* Trend Cards */}
      <div className="space-y-3">
        {trends.map((trend) => (
          <TrendCard key={trend.metricId} trend={trend} daysCount={daysCount} />
        ))}
        {trends.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No metric data found for this selection.
          </p>
        )}
      </div>

      {/* Raw Data List */}
      {recentRawEntries.length > 0 && (
        <section className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center">
            <List className="w-4 h-4 mr-2" />
            Raw Data
          </h2>
          <Card>
            <CardContent className="p-0 overflow-hidden text-sm">
              <div className="divide-y max-h-96 overflow-y-auto">
                 {recentRawEntries.map(entry => {
                    const metricDef = relevantMetrics.find(m => m.id === entry.metric_definition_id);
                    if (!metricDef) return null;
                    const val = getEntryNumericValue(entry, metricDef.input_type) ?? entry.value_text;
                    const memberName = members.find(m => m.id === entry.user_id)?.name || "Unknown";
                    
                    return (
                       <div key={entry.id} className="flex justify-between p-3 items-center hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col">
                             <span className="font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">{metricDef.name}</span>
                             <span className="text-xs text-muted-foreground">{formatShortDate(entry.entry_date)} • {memberName}</span>
                          </div>
                          <div className="font-medium tabular-nums pl-2 text-right">
                             {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val} {val !== null && typeof val !== 'boolean' && metricDef.unit && <span className="text-xs text-muted-foreground ml-0.5">{metricDef.unit}</span>}
                          </div>
                       </div>
                    );
                 })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Recent Notes */}
      {notes && notes.length > 0 && (
        <section className="pt-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Notes
          </h2>
          <div className="space-y-2">
            {notes.map((note) => {
              const memberName = members.find(m => m.id === note.user_id)?.name || "Unknown";
              return (
                <Card key={note.id}>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatShortDate(note.entry_date)} • {memberName}
                    </p>
                    <p className="text-sm">{note.note}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function TrendCard({ trend, daysCount }: { trend: TrendData, daysCount: number }) {
  const isUp = trend.changePercent != null && trend.changePercent > 0;
  const isDown = trend.changePercent != null && trend.changePercent < 0;

  const formatValue = (v: number | null) => {
    if (v === null) return "—";
    if (trend.metricInputType === "boolean") return `${v} days`;
    if (Number.isInteger(v)) return v.toString();
    return v.toFixed(1);
  };

  const label =
    trend.metricInputType === "count" || trend.metricInputType === "boolean"
      ? `${daysCount}-day total`
      : `${daysCount}-day avg`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium">{trend.metricName}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <div className="flex items-center gap-2">
            {trend.streak > 0 && (
              <Badge variant="warning" className="text-[10px]">
                <Flame className="h-3 w-3 mr-0.5" />
                {trend.streak}d
              </Badge>
            )}
            {trend.changePercent != null && (
              <Badge
                variant={isUp ? "success" : isDown ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {isUp ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : isDown ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                ) : (
                  <Minus className="h-3 w-3 mr-0.5" />
                )}
                {Math.abs(trend.changePercent)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-[2px] h-12">
           {/* If daysCount is 30, it might be too squeezed, but with tiny gap and no labels it works visually as sparkline */}
          {trend.dailyValues.map((d, i) => {
            const maxVal = Math.max(
              ...trend.dailyValues.map((v) => v.value ?? 0),
              1
            );
            const height = d.value != null ? (d.value / maxVal) * 100 : 0;
            const hitTarget =
              trend.targetValue != null &&
              d.value != null &&
              meetsTarget(d.value, trend.targetValue, trend.targetOperator);

            const showLabel = daysCount <= 7;

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full relative" style={{ height: "48px" }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-sm transition-all ${
                      hitTarget
                        ? "bg-success/60"
                        : d.value != null
                        ? "bg-primary/40"
                        : "bg-muted"
                    }`}
                    style={{
                      height: `${Math.max(height, d.value != null ? 8 : 4)}%`,
                    }}
                  />
                </div>
                {showLabel && (
                  <span className="text-[9px] text-muted-foreground">
                    {formatShortDate(d.date).split(" ")[1]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Current value */}
        <div className="mt-3 pt-3 border-t flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">
            {formatValue(trend.currentPeriodValue)}
          </span>
          {trend.unit && (
            <span className="text-xs text-muted-foreground">{trend.unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
