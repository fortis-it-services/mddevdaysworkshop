import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
}

export function KpiCard({ title, value, description, icon: Icon, trend, trendLabel }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend !== undefined || description) && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <span className={cn("flex items-center gap-0.5", trend >= 0 ? "text-green-600" : "text-red-600")}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {trendLabel ?? description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
