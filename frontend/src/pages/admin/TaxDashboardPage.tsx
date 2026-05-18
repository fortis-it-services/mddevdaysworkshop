import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaxSummaryTable } from "@/components/shared/dashboard/TaxSummaryTable";
import { DateRangePicker } from "@/components/shared/dashboard/DateRangePicker";
import { useTaxSummary } from "@/hooks/useDashboard";
import { withSpan } from "@/lib/telemetry";
import type { DateRangePreset } from "@/types/dashboard";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

export default function TaxDashboardPage() {
  const [preset, setPreset] = useState<DateRangePreset>("ThisMonth");
  const { data: taxSummary, isLoading } = useTaxSummary(preset);

  const handleExport = async () => {
    await withSpan("dashboard.exportCsv", async () => {
      const params = new URLSearchParams({ preset });
      const response = await fetch(`${API_BASE}/dashboard/tax-summary?${params}&format=csv`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tax-summary.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Dashboard</h1>
          <p className="text-muted-foreground">Tax summary for accounting.</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker value={preset} onChange={setPreset} />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <TaxSummaryTable data={taxSummary ?? []} />
      )}
    </div>
  );
}
