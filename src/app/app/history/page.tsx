import { createClient } from "@/lib/supabase/server";
import { getDateRange, formatShortDate, getEntryNumericValue, calculateStreak, meetsTarget } from "@/lib/dates/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MetricDefinition, DailyEntry } from "@/types/db";
import type { TrendData } from "@/types/domain";
import { TrendingUp, TrendingDown, Minus, Flame, BarChart3 } from "lucide-react";

export default async function HistoryPage() {
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

  const dates7 = getDateRange(7);
  const dates30 = getDateRange(30);

  // Fetch metrics and 30 days of entries
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
      .eq("user_id", user.id)
      .gte("entry_date", dates30[0])
      .lte("entry_date", dates30[dates30.length - 1]),
  ]);

  const metrics = (metricsRes.data || []) as MetricDefinition[];
  const entries = (entriesRes.data || []) as DailyEntry[];

  // Build user-relevant metrics (shared + own personal)
  const relevantMetrics = metrics.filter(
    (m) => m.scope === "shared" || m.owner_user_id === user.id
  );

  // Build trend data
  const trends: TrendData[] = relevantMetrics
    .filter((m) => m.input_type !== "short_text")
    .map((metric) => {
      const metricEntries = entries.filter(
        (e) => e.metric_definition_id === metric.id
      );

      // 7-day values
      const recent7 = metricEntries.filter((e) => dates7.includes(e.entry_date));
      const prior7 = metricEntries.filter(
        (e) =>
          !dates7.includes(e.entry_date) &&
          dates30.indexOf(e.entry_date) < dates30.length - 7
      );

      const sum7 = recent7.reduce((acc, e) => {
        const v = getEntryNumericValue(e, metric.input_type);
        return acc + (v ?? 0);
      }, 0);

      const sum7Prior = prior7.slice(0, 7).reduce((acc, e) => {
        const v = getEntryNumericValue(e, metric.input_type);
        return acc + (v ?? 0);
      }, 0);

      const currentValue =
        metric.input_type === "count" || metric.input_type === "boolean"
          ? sum7
          : recent7.length > 0
          ? sum7 / recent7.length
          : null;

      const previousValue =
        metric.input_type === "count" || metric.input_type === "boolean"
          ? sum7Prior
          : prior7.length > 0
          ? sum7Prior / Math.min(prior7.length, 7)
          : null;

      const changePercent =
        currentValue != null && previousValue != null && previousValue > 0
          ? Math.round(((currentValue - previousValue) / previousValue) * 100)
          : null;

      // Streak
      const dailyValues = metricEntries
        .map((e) => ({
          date: e.entry_date,
          value: getEntryNumericValue(e, metric.input_type) as number | boolean | null,
        }))
        .filter((v) => v.value != null);

      const streak =
        metric.target_value != null
          ? calculateStreak(
              metricEntries.map((e) => ({
                date: e.entry_date,
                value: meetsTarget(
                  getEntryNumericValue(e, metric.input_type),
                  metric.target_value,
                  metric.target_operator
                ),
              }))
            )
          : calculateStreak(dailyValues);

      // Daily chart data (7 days)
      const chartData = dates7.map((d) => {
        const e = metricEntries.find((e) => e.entry_date === d);
        return {
          date: d,
          value: e ? getEntryNumericValue(e, metric.input_type) : null,
        };
      });

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

  // Recent notes
  const { data: notes } = await supabase
    .from("daily_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">History</h1>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Trend Cards */}
      <div className="space-y-3">
        {trends.map((trend) => (
          <TrendCard key={trend.metricId} trend={trend} />
        ))}
        {trends.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No metric data yet. Start logging on the Today page.
          </p>
        )}
      </div>

      {/* Recent Notes */}
      {notes && notes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Notes
          </h2>
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatShortDate(note.entry_date)}
                  </p>
                  <p className="text-sm">{note.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TrendCard({ trend }: { trend: TrendData }) {
  const isUp = trend.changePercent != null && trend.changePercent > 0;
  const isDown = trend.changePercent != null && trend.changePercent < 0;
  const isNeutral = trend.changePercent === 0 || trend.changePercent === null;

  const formatValue = (v: number | null) => {
    if (v === null) return "—";
    if (trend.metricInputType === "boolean") return `${v} days`;
    if (Number.isInteger(v)) return v.toString();
    return v.toFixed(1);
  };

  const label =
    trend.metricInputType === "count" || trend.metricInputType === "boolean"
      ? "7-day total"
      : "7-day avg";

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
        <div className="flex items-end gap-1 h-12">
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
                <span className="text-[9px] text-muted-foreground">
                  {formatShortDate(d.date).split(" ")[1]}
                </span>
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
