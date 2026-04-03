"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMetric } from "@/server/actions/metrics";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT_TYPES = [
  { value: "boolean", label: "Yes / No" },
  { value: "count", label: "Counter" },
  { value: "duration_minutes", label: "Duration (min)" },
  { value: "amount_decimal", label: "Amount" },
  { value: "rating_1_to_5", label: "Rating (1-5)" },
  { value: "short_text", label: "Short text" },
];

const SCOPES = [
  { value: "shared", label: "Shared" },
  { value: "personal", label: "Personal" },
];

export function MetricFormDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState("count");
  const [selectedScope, setSelectedScope] = useState("personal");
  const [visibleToPartner, setVisibleToPartner] = useState(true);

  function handleSubmit(formData: FormData) {
    formData.set("input_type", selectedType);
    formData.set("scope", selectedScope);
    formData.set("visible_to_partner", String(visibleToPartner));

    startTransition(async () => {
      setError("");
      const result = await createMetric(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 800);
      }
    });
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto border shadow-xl animate-slide-up safe-bottom">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">New Metric</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>

              <form action={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="metric-name">Name</Label>
                  <Input
                    id="metric-name"
                    name="name"
                    placeholder="e.g. Water intake"
                    required
                  />
                </div>

                {/* Scope */}
                <div className="space-y-1.5">
                  <Label>Scope</Label>
                  <div className="flex gap-2">
                    {SCOPES.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        size="sm"
                        variant={selectedScope === s.value ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setSelectedScope(s.value)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedScope === "personal" && (
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 shadow-sm bg-muted/40">
                    <div className="space-y-0.5">
                      <Label>Publish to Household</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow your partner to see this metric
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      name="visible_to_partner_check"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={visibleToPartner}
                      onChange={(e) => setVisibleToPartner(e.target.checked)}
                    />
                  </div>
                )}

                {/* Input Type */}
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {INPUT_TYPES.map((t) => (
                      <Button
                        key={t.value}
                        type="button"
                        size="sm"
                        variant={selectedType === t.value ? "default" : "outline"}
                        className={cn("text-xs h-9", selectedType === t.value && "ring-1 ring-primary")}
                        onClick={() => setSelectedType(t.value)}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Unit */}
                <div className="space-y-1.5">
                  <Label htmlFor="metric-unit">Unit (optional)</Label>
                  <Input
                    id="metric-unit"
                    name="unit"
                    placeholder="e.g. litres, min, steps"
                  />
                </div>

                {/* Target */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="metric-target">Target (optional)</Label>
                    <Input
                      id="metric-target"
                      name="target_value"
                      type="number"
                      step="any"
                      placeholder="e.g. 2.0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="metric-operator">Operator</Label>
                    <select
                      id="metric-operator"
                      name="target_operator"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">None</option>
                      <option value="gte">≥ At least</option>
                      <option value="lte">≤ At most</option>
                      <option value="eq">= Exactly</option>
                    </select>
                  </div>
                </div>

                {/* Icon */}
                <div className="space-y-1.5">
                  <Label htmlFor="metric-icon">Icon name (optional)</Label>
                  <Input
                    id="metric-icon"
                    name="icon"
                    placeholder="e.g. droplets, dumbbell, moon"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use Lucide icon names
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPending || success}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : success ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : null}
                  {success ? "Created!" : "Create Metric"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
