import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { EventMetric } from "@/types/dashboard";

interface TopEventsTableProps {
  data: EventMetric[];
  title?: string;
  description?: string;
}

export function TopEventsTable({ data, title = "Top Events", description = "By revenue" }: TopEventsTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No events data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="text-right">Tickets Sold</TableHead>
              <TableHead className="text-right">Occupancy</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((event) => (
              <TableRow key={event.eventId}>
                <TableCell className="font-medium">{event.eventTitle}</TableCell>
                <TableCell className="text-right">{event.ticketsSold}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={event.occupancyRate >= 80 ? "destructive" : "secondary"}>
                    {event.occupancyRate.toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{event.revenue.toFixed(2)} €</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
