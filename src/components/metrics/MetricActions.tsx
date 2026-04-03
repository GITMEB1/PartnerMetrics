"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { archiveMetric, restoreMetric } from "@/server/actions/metrics";
import type { MetricDefinition } from "@/types/db";
import { Archive, RotateCcw, Loader2 } from "lucide-react";

type MetricActionsProps = {
  metric: MetricDefinition;
  userId: string;
};

export function MetricActions({ metric, userId }: MetricActionsProps) {
  const [isPending, startTransition] = useTransition();

  const canEdit = metric.created_by === userId || metric.scope === "shared";

  if (!canEdit) return null;

  function handleArchive() {
    startTransition(async () => {
      if (metric.is_active) {
        await archiveMetric(metric.id);
      } else {
        await restoreMetric(metric.id);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleArchive}
      disabled={isPending}
      title={metric.is_active ? "Archive" : "Restore"}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : metric.is_active ? (
        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}
