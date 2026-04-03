import type { MetricDefinition, DailyEntry, DailyNote, Profile } from "./db";

// ─── Composite view types ───

/** A metric definition with its current entry value for a given date */
export type MetricWithEntry = {
  definition: MetricDefinition;
  entry: DailyEntry | null;
};

/** All data needed for the Today page */
export type TodayPageData = {
  currentUser: Profile;
  partner: Profile | null;
  householdName: string;
  householdId: string;
  userMetrics: MetricWithEntry[];
  partnerMetrics: MetricWithEntry[];
  sharedMetricIds: string[];
  userNote: DailyNote | null;
  partnerNote: DailyNote | null;
  date: string; // ISO date string YYYY-MM-DD
};

/** Summary stats for the household strip */
export type HouseholdSummaryData = {
  userName: string;
  partnerName: string | null;
  userLogged: number;
  userTotal: number;
  partnerLogged: number;
  partnerTotal: number;
  sharedTargetsHit: number;
  sharedTargetsTotal: number;
};

/** A single history row for a metric */
export type HistoryEntry = {
  date: string;
  value: number | boolean | string | null;
  metricName: string;
  metricInputType: MetricDefinition["input_type"];
  userName: string;
};

/** Trend data for a metric over a period */
export type TrendData = {
  metricId: string;
  metricName: string;
  metricInputType: MetricDefinition["input_type"];
  currentPeriodValue: number | null;
  previousPeriodValue: number | null;
  changePercent: number | null;
  streak: number;
  unit: string | null;
  targetValue: number | null;
  targetOperator: MetricDefinition["target_operator"];
  dailyValues: { date: string; value: number | null }[];
};

/** Form data for creating/editing a metric */
export type MetricFormData = {
  name: string;
  description?: string;
  scope: MetricDefinition["scope"];
  input_type: MetricDefinition["input_type"];
  unit?: string;
  target_value?: number;
  target_operator?: MetricDefinition["target_operator"];
  icon?: string;
  color_token?: string;
};
