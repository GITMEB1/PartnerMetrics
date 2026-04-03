import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricFormDialog } from "@/components/metrics/MetricFormDialog";
import { MetricActions } from "@/components/metrics/MetricActions";
import type { MetricDefinition, Profile } from "@/types/db";
import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MetricsPage() {
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

  const [metricsRes, membersRes] = await Promise.all([
    supabase
      .from("metric_definitions")
      .select("*")
      .eq("household_id", membership.household_id)
      .order("sort_order"),
    supabase
      .from("household_members")
      .select("user_id, profiles(id, display_name)")
      .eq("household_id", membership.household_id),
  ]);

  const metrics = (metricsRes.data || []) as MetricDefinition[];
  const members = membersRes.data || [];

  const partner = members.find((m) => m.user_id !== user.id);
  const partnerProfile = partner?.profiles as unknown as Profile | null;

  const sharedMetrics = metrics.filter((m) => m.scope === "shared" && m.is_active);
  const myMetrics = metrics.filter((m) => m.scope === "personal" && m.owner_user_id === user.id && m.is_active);
  const partnerMetrics = metrics.filter((m) => m.scope === "personal" && m.owner_user_id !== user.id && m.is_active);
  const archivedMetrics = metrics.filter((m) => !m.is_active);

  const inputTypeLabels: Record<string, string> = {
    boolean: "Yes/No",
    count: "Counter",
    duration_minutes: "Duration",
    amount_decimal: "Amount",
    rating_1_to_5: "Rating",
    short_text: "Text",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Metrics</h1>
          <p className="text-sm text-muted-foreground">
            {metrics.filter((m) => m.is_active).length} active metrics
          </p>
        </div>
        <MetricFormDialog>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </MetricFormDialog>
      </div>

      {/* Shared Metrics */}
      <MetricSection title="Shared" metrics={sharedMetrics} inputTypeLabels={inputTypeLabels} userId={user.id} />

      {/* My Metrics */}
      <MetricSection title="Mine" metrics={myMetrics} inputTypeLabels={inputTypeLabels} userId={user.id} />

      {/* Partner Metrics */}
      {partnerMetrics.length > 0 && (
        <MetricSection
          title={partnerProfile?.display_name || "Partner"}
          metrics={partnerMetrics}
          inputTypeLabels={inputTypeLabels}
          userId={user.id}
          readOnly
        />
      )}

      {/* Archived */}
      {archivedMetrics.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Archived ({archivedMetrics.length})
          </h2>
          <div className="space-y-2">
            {archivedMetrics.map((metric) => (
              <Card key={metric.id} className="opacity-60">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{metric.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {inputTypeLabels[metric.input_type]}
                    </p>
                  </div>
                  <MetricActions metric={metric} userId={user.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricSection({
  title,
  metrics,
  inputTypeLabels,
  userId,
  readOnly,
}: {
  title: string;
  metrics: MetricDefinition[];
  inputTypeLabels: Record<string, string>;
  userId: string;
  readOnly?: boolean;
}) {
  if (metrics.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title} ({metrics.length})
      </h2>
      <div className="space-y-2">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{metric.name}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {inputTypeLabels[metric.input_type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {metric.target_value != null && (
                    <span className="text-xs text-muted-foreground">
                      Target: {metric.target_operator === "gte" ? "≥" : metric.target_operator === "lte" ? "≤" : "="}{" "}
                      {metric.target_value}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </span>
                  )}
                  {metric.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {metric.description}
                    </span>
                  )}
                </div>
              </div>
              {!readOnly && <MetricActions metric={metric} userId={userId} />}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
