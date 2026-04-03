import {
  format,
  subDays,
  startOfDay,
  eachDayOfInterval,
  parseISO,
  differenceInDays,
  isToday as isTodayFn,
  isYesterday as isYesterdayFn,
} from "date-fns";

/** Format a Date or ISO string to YYYY-MM-DD */
export function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/** Get today's date as YYYY-MM-DD */
export function todayString(): string {
  return toDateString(new Date());
}

/** Format for display: "Mon, Apr 2" */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isTodayFn(d)) return "Today";
  if (isYesterdayFn(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

/** Format for short display: "Apr 2" */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d");
}

/** Get an array of date strings for the last N days (inclusive of today) */
export function getDateRange(days: number): string[] {
  const end = startOfDay(new Date());
  const start = subDays(end, days - 1);
  return eachDayOfInterval({ start, end }).map((d) => toDateString(d));
}

/** Calculate streak: how many consecutive days (ending today or yesterday) have a truthy value */
export function calculateStreak(
  dailyValues: { date: string; value: number | boolean | null }[]
): number {
  if (!dailyValues.length) return 0;

  // Sort by date descending
  const sorted = [...dailyValues].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
  );

  // Start counting from the most recent entry
  let streak = 0;
  let expectedDate = startOfDay(new Date());

  // Allow starting from yesterday if today has no entry
  const firstEntryDate = startOfDay(parseISO(sorted[0].date));
  if (differenceInDays(expectedDate, firstEntryDate) === 1) {
    expectedDate = firstEntryDate;
  }

  for (const entry of sorted) {
    const entryDate = startOfDay(parseISO(entry.date));
    const diff = differenceInDays(expectedDate, entryDate);

    if (diff > 0) break; // Gap in dates
    if (diff === 0) {
      const isTruthy =
        entry.value === true ||
        (typeof entry.value === "number" && entry.value > 0);
      if (isTruthy) {
        streak++;
        expectedDate = subDays(expectedDate, 1);
      } else {
        break;
      }
    }
  }

  return streak;
}

/** Check if a value meets a target */
export function meetsTarget(
  value: number | null,
  targetValue: number | null,
  targetOperator: "gte" | "lte" | "eq" | null
): boolean {
  if (value == null || targetValue == null || targetOperator == null) return false;
  switch (targetOperator) {
    case "gte":
      return value >= targetValue;
    case "lte":
      return value <= targetValue;
    case "eq":
      return value === targetValue;
    default:
      return false;
  }
}

/** Extract the numeric value from a daily entry based on input type */
export function getEntryNumericValue(
  entry: {
    value_boolean: boolean | null;
    value_number: number | null;
    value_text: string | null;
  } | null,
  inputType: string
): number | null {
  if (!entry) return null;
  switch (inputType) {
    case "boolean":
      return entry.value_boolean === true ? 1 : entry.value_boolean === false ? 0 : null;
    case "count":
    case "duration_minutes":
    case "amount_decimal":
    case "rating_1_to_5":
      return entry.value_number;
    default:
      return null;
  }
}

/** Check if any value is logged for an entry */
export function isEntryLogged(
  entry: {
    value_boolean: boolean | null;
    value_number: number | null;
    value_text: string | null;
  } | null
): boolean {
  if (!entry) return false;
  return (
    entry.value_boolean !== null ||
    entry.value_number !== null ||
    (entry.value_text !== null && entry.value_text.length > 0)
  );
}
