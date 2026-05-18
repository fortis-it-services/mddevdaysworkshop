import { useState } from "react";
import { useParams } from "react-router-dom";
import { CircleDollarSign, Ticket, BarChart3, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/dashboard/KpiCard";
import { SalesTrendChart } from "@/components/shared/dashboard/SalesTrendChart";
import { OccupancyChart } from "@/components/shared/dashboard/OccupancyChart";
import { RevenuePieChart } from "@/components/shared/dashboard/RevenuePieChart";
import { DateRangePicker } from "@/components/shared/dashboard/DateRangePicker";
import { useEventSales, useEventRevenue, useEventOccupancy, useEventTrend } from "@/hooks/useDashboard";
import type { DateRangePreset } from "@/types/dashboard";

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [preset, setPreset] = useState<DateRangePreset>("ThisMonth");

  const { data: sales, isLoading: salesLoading } = useEventSales(id, preset);
  const { data: revenue } = useEventRevenue(id, preset);
  const { data: occupancy } = useEventOccupancy(id);
  const { data: trend } = useEventTrend(id, preset);

  if (salesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
        <h1 className="text-3xl font-bold tracking-tight">Event Dashboard</h1>
        <DateRangePicker value={preset} onChange={setPreset} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tickets Sold"
          value={String(sales?.totalTicketsSold ?? 0)}
          icon={Ticket}
          description="In selected period"
        />
        <KpiCard
          title="Revenue"
          value={`${(revenue?.totalGross ?? 0).toFixed(2)} ${revenue?.currency ?? "€"}`}
          icon={CircleDollarSign}
          description="Gross"
        />
        <KpiCard
          title="Occupancy"
          value={`${occupancy && occupancy.length > 0 ? (occupancy.reduce((s, o) => s + o.sold, 0) / occupancy.reduce((s, o) => s + o.available, 0) * 100).toFixed(0) : 0}%`}
          icon={BarChart3}
          description="Overall"
        />
        <KpiCard
          title="Cancellation Rate"
          value="—"
          icon={XCircle}
          description="Not available"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SalesTrendChart data={trend ?? []} title="Sales Trend" description="Tickets sold over time for this event" />
        <RevenuePieChart data={sales?.salesByTicketType ?? []} />
      </div>

      <OccupancyChart data={occupancy ?? []} title="Occupancy by Ticket Type" description="Sold vs available per type" />
    </div>
  );
}
