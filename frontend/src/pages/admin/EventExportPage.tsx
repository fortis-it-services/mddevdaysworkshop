import { useParams } from "react-router-dom";
import { Download, FileSpreadsheet, Users, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { withSpan } from "@/lib/telemetry";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  filename: string;
  path: string;
}

export default function EventExportPage() {
  const { id } = useParams<{ id: string }>();

  const exportOptions: ExportOption[] = [
    {
      id: "attendees",
      title: "Attendee List",
      description: "Export all attendees with check-in status",
      icon: Users,
      filename: `attendees-${id}.csv`,
      path: `/events/${id}/export/attendees`,
    },
    {
      id: "orders",
      title: "Orders",
      description: "Export all orders with payment status",
      icon: FileSpreadsheet,
      filename: `orders-${id}.csv`,
      path: `/events/${id}/export/orders`,
    },
    {
      id: "tax-report",
      title: "Tax Report",
      description: "Export tax report grouped by tax rate",
      icon: Receipt,
      filename: `tax-report-${id}.csv`,
      path: `/events/${id}/export/tax-report`,
    },
  ];

  const handleExport = async (option: ExportOption) => {
    await withSpan("dashboard.exportCsv", async (span) => {
      span.setAttribute("export.type", option.id);
      span.setAttribute("export.eventId", id ?? "");
      const response = await fetch(`${API_BASE}${option.path}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = option.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">Download event data as CSV files.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exportOptions.map((option) => (
          <Card key={option.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => handleExport(option)}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
