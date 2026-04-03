"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface HistoryFiltersProps {
  metrics: { id: string; name: string }[];
  members: { id: string; name: string }[];
}

export function HistoryFilters({ metrics, members }: HistoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDays = searchParams.get("days") || "7";
  const currentMember = searchParams.get("member") || "all";
  const currentMetric = searchParams.get("metric") || "all";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex bg-muted p-1 rounded-lg">
        <button
          onClick={() => updateParam("days", "7")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentDays === "7" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => updateParam("days", "30")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentDays === "30" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Last 30 Days
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={currentMember}
          onChange={(e) => updateParam("member", e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Every Member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={currentMetric}
          onChange={(e) => updateParam("metric", e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">Every Metric</option>
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
