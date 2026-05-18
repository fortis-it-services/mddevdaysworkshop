import { useState } from "react";
import { CircleDollarSign, Ticket, CalendarDays, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/dashboard/KpiCard";
import { SalesTrendChart } from "@/components/shared/dashboard/SalesTrendChart";
import { TopEventsTable } from "@/components/shared/dashboard/TopEventsTable";
import { DateRangePicker } from "@/components/shared/dashboard/DateRangePicker";
import { useDashboardOverview, useEventTrend } from "@/hooks/useDashboard";
import type { DateRangePreset } from "@/types/dashboard";

export default function AdminDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("ThisMonth");
  const { data: overview, isLoading } = useDashboardOverview(preset);

  // Use first top event for trend visualization
  const firstEventId = overview?.topEvents[0]?.eventId;
  const { data: trendData } = useEventTrend(firstEventId, preset);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your event ticketing platform.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your event ticketing platform.</p>
        </div>
        <DateRangePicker value={preset} onChange={setPreset} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={`${(overview?.totalRevenue ?? 0).toFixed(2)} ${overview?.currency ?? "€"}`}
          icon={CircleDollarSign}
          description="Gross revenue"
        />
        <KpiCard
          title="Tickets Sold"
          value={String(overview?.totalTicketsSold ?? 0)}
          icon={Ticket}
          description="Total tickets"
        />
        <KpiCard
          title="Active Events"
          value={String(overview?.activeEvents ?? 0)}
          icon={CalendarDays}
          description="Published events"
        />
        <KpiCard
          title="Avg. Order Value"
          value={`${(overview?.averageOrderValue ?? 0).toFixed(2)} ${overview?.currency ?? "€"}`}
          icon={ShoppingCart}
          description="Per order"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesTrendChart data={trendData ?? []} />
        <TopEventsTable data={overview?.topEvents ?? []} />
      </div>
    </div>
  );
}
