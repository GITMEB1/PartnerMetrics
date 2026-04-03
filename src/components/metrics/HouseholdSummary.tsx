import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isEntryLogged } from "@/lib/dates/helpers";
import type { HouseholdSummaryData } from "@/types/domain";
import { TrendingUp, Users } from "lucide-react";

type HouseholdSummaryProps = {
  data: HouseholdSummaryData;
};

export function HouseholdSummary({ data }: HouseholdSummaryProps) {
  return (
    <Card className="bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent border-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Household Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryItem
            label={data.userName}
            logged={data.userLogged}
            total={data.userTotal}
          />
          {data.partnerName && (
            <SummaryItem
              label={data.partnerName}
              logged={data.partnerLogged}
              total={data.partnerTotal}
            />
          )}
        </div>
        {data.sharedTargetsTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">
                Shared wins today:{" "}
                <span className="font-semibold text-foreground">
                  {data.sharedTargetsHit}/{data.sharedTargetsTotal}
                </span>{" "}
                targets hit
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  logged,
  total,
}: {
  label: string;
  logged: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((logged / total) * 100) : 0;
  const isComplete = logged === total && total > 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <Badge variant={isComplete ? "success" : "secondary"} className="text-[10px] shrink-0">
        {logged}/{total}
      </Badge>
    </div>
  );
}
