import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SalesTrendPoint } from "@/types/dashboard";
import { format, parseISO } from "date-fns";

interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  title?: string;
  description?: string;
}

export function SalesTrendChart({ data, title = "Sales Trend", description = "Tickets sold over time" }: SalesTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">No sales data available for this period.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    dateLabel: format(parseISO(point.date), "dd MMM"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} aria-label="Sales trend chart">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="ticketsSold"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Tickets Sold"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
