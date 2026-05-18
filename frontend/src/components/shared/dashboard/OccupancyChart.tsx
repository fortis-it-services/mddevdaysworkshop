import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { OccupancyMetric } from "@/types/dashboard";

interface OccupancyChartProps {
  data: OccupancyMetric[];
  title?: string;
  description?: string;
}

export function OccupancyChart({ data, title = "Occupancy", description = "Tickets sold vs available" }: OccupancyChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No occupancy data available.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.ticketTypeName,
    sold: item.sold,
    remaining: item.available - item.sold,
    occupancyRate: item.occupancyRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} aria-label="Occupancy chart">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis dataKey="name" type="category" fontSize={12} width={120} />
            <Tooltip />
            <Bar dataKey="sold" stackId="a" fill="hsl(var(--primary))" name="Sold" />
            <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" name="Remaining" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
