"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertEntryDirect } from "@/server/actions/entries";
import { meetsTarget, isEntryLogged } from "@/lib/dates/helpers";
import { cn } from "@/lib/utils";
import type { MetricDefinition, DailyEntry } from "@/types/db";
import {
  Droplets, Dumbbell, Moon, Briefcase, Search, Send, Smile,
  Footprints, ClipboardCheck, Check, Minus, Plus, Star,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  droplets: Droplets, dumbbell: Dumbbell, moon: Moon, briefcase: Briefcase,
  search: Search, send: Send, smile: Smile, footprints: Footprints,
  "clipboard-check": ClipboardCheck, star: Star,
};

type MetricCardProps = {
  metric: MetricDefinition;
  entry: DailyEntry | null;
  date: string;
  editable: boolean;
};

export function MetricCard({ metric, entry, date, editable }: MetricCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useState<{
    boolean?: boolean | null;
    number?: number | null;
    text?: string | null;
  }>({
    boolean: entry?.value_boolean ?? null,
    number: entry?.value_number ?? null,
    text: entry?.value_text ?? null,
  });
  const [saved, setSaved] = useState(false);

  const Icon = metric.icon ? ICON_MAP[metric.icon] || Star : Star;
  const logged = isEntryLogged(entry);
  const currentNum = optimisticValue.number ?? entry?.value_number ?? null;
  const targetMet = meetsTarget(
    currentNum,
    metric.target_value,
    metric.target_operator
  );

  function saveEntry(updates: {
    value_boolean?: boolean | null;
    value_number?: number | null;
    value_text?: string | null;
  }) {
    if (!editable) return;
    setOptimisticValue((prev) => ({ ...prev, ...updates }));
    setSaved(false);

    startTransition(async () => {
      await upsertEntryDirect({
        metric_definition_id: metric.id,
        entry_date: date,
        value_boolean: updates.value_boolean ?? optimisticValue.boolean,
        value_number: updates.value_number ?? optimisticValue.number,
        value_text: updates.value_text ?? optimisticValue.text,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <Card
      className={cn(
        "transition-all",
        targetMet && "border-success/30 bg-success/[0.03]",
        isPending && "opacity-80"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                targetMet ? "bg-success/15" : "bg-primary/10"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5",
                  targetMet ? "text-success" : "text-primary"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{metric.name}</p>
              {metric.target_value != null && (
                <p className="text-xs text-muted-foreground">
                  Target: {metric.target_value}
                  {metric.unit ? ` ${metric.unit}` : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {saved && (
              <Badge variant="success" className="animate-check-pop text-[10px] px-1.5 py-0">
                <Check className="h-3 w-3 mr-0.5" />
                Saved
              </Badge>
            )}
            {metric.scope === "shared" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Shared
              </Badge>
            )}
          </div>
        </div>

        {/* Input Control */}
        <div className="mt-1">
          {metric.input_type === "boolean" && (
            <BooleanInput
              value={optimisticValue.boolean ?? null}
              onChange={(v) => saveEntry({ value_boolean: v })}
              disabled={!editable}
            />
          )}
          {metric.input_type === "count" && (
            <CountInput
              value={optimisticValue.number ?? 0 as number}
              onChange={(v) => saveEntry({ value_number: v })}
              disabled={!editable}
            />
          )}
          {metric.input_type === "duration_minutes" && (
            <DurationInput
              value={optimisticValue.number ?? null}
              onChange={(v) => saveEntry({ value_number: v })}
              disabled={!editable}
            />
          )}
          {metric.input_type === "amount_decimal" && (
            <AmountInput
              value={optimisticValue.number ?? null}
              unit={metric.unit}
              onChange={(v) => saveEntry({ value_number: v })}
              disabled={!editable}
            />
          )}
          {metric.input_type === "rating_1_to_5" && (
            <RatingInput
              value={optimisticValue.number ?? null}
              onChange={(v) => saveEntry({ value_number: v })}
              disabled={!editable}
            />
          )}
          {metric.input_type === "short_text" && (
            <TextInput
              value={optimisticValue.text ?? null}
              onChange={(v) => saveEntry({ value_text: v })}
              disabled={!editable}
            />
          )}
          {!logged && !optimisticValue.boolean && !optimisticValue.number && !optimisticValue.text && (
            <p className="text-xs text-muted-foreground mt-1">Not logged yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Input Subcomponents ───

function BooleanInput({
  value,
  onChange,
  disabled,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant={value === true ? "success" : "outline"}
        className="flex-1 h-11"
        onClick={() => onChange(true)}
        disabled={disabled}
      >
        <Check className="h-4 w-4 mr-1" />
        Yes
      </Button>
      <Button
        size="lg"
        variant={value === false ? "secondary" : "outline"}
        className="flex-1 h-11"
        onClick={() => onChange(false)}
        disabled={disabled}
      >
        <Minus className="h-4 w-4 mr-1" />
        No
      </Button>
    </div>
  );
}

function CountInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        size="icon"
        variant="outline"
        className="h-11 w-11 rounded-xl"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={disabled || value <= 0}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-2xl font-semibold tabular-nums min-w-[3ch] text-center">
        {value}
      </span>
      <Button
        size="icon"
        variant="outline"
        className="h-11 w-11 rounded-xl"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DurationInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const presets = [10, 20, 30, 45, 60];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={value === p ? "default" : "outline"}
            className="h-9 px-3"
            onClick={() => onChange(p)}
            disabled={disabled}
          >
            {p}m
          </Button>
        ))}
      </div>
      {value && !presets.includes(value) && (
        <p className="text-sm text-muted-foreground">{value} min</p>
      )}
      <Input
        type="number"
        placeholder="Custom minutes"
        className="h-9 text-sm"
        value={value ?? ""}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        disabled={disabled}
      />
    </div>
  );
}

function AmountInput({
  value,
  unit,
  onChange,
  disabled,
}: {
  value: number | null;
  unit: string | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const presets =
    unit === "litres" ? [0.5, 1.0, 1.5, 2.0, 2.5, 3.0] :
    unit === "hours" ? [5, 6, 7, 8, 9, 10] :
    [1, 2, 3, 5, 10];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={value === p ? "default" : "outline"}
            className="h-9 px-3"
            onClick={() => onChange(p)}
            disabled={disabled}
          >
            {p}{unit ? ` ${unit === "litres" ? "L" : unit.charAt(0)}` : ""}
          </Button>
        ))}
      </div>
      <Input
        type="number"
        step="0.1"
        placeholder={`Custom${unit ? ` (${unit})` : ""}`}
        className="h-9 text-sm"
        value={value ?? ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
        disabled={disabled}
      />
    </div>
  );
}

function RatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((r) => (
        <Button
          key={r}
          size="sm"
          variant={value === r ? "default" : "outline"}
          className={cn("flex-1 h-11 text-base font-semibold", value === r && "scale-105")}
          onClick={() => onChange(r)}
          disabled={disabled}
        >
          {r}
        </Button>
      ))}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value ?? "");

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Enter value..."
        className="h-10 text-sm"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== (value ?? "")) onChange(local);
        }}
        disabled={disabled}
      />
      <Button
        size="icon"
        variant="outline"
        className="h-10 w-10 shrink-0"
        onClick={() => onChange(local)}
        disabled={disabled}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}
