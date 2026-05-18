import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TaxSummaryEntry } from "@/types/dashboard";

interface TaxSummaryTableProps {
  data: TaxSummaryEntry[];
  title?: string;
  description?: string;
}

export function TaxSummaryTable({ data, title = "Tax Summary", description = "Breakdown by tax rate" }: TaxSummaryTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">No tax data available.</p>
        </CardContent>
      </Card>
    );
  }

  const totalNet = data.reduce((sum, entry) => sum + entry.netAmount, 0);
  const totalTax = data.reduce((sum, entry) => sum + entry.taxAmount, 0);
  const totalGross = data.reduce((sum, entry) => sum + entry.grossAmount, 0);

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
              <TableHead>Tax Rate</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Gross</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={`${entry.taxRatePercentage}-${entry.taxRateName}`}>
                <TableCell>{entry.taxRateName} ({entry.taxRatePercentage}%)</TableCell>
                <TableCell className="text-right">{entry.netAmount.toFixed(2)} €</TableCell>
                <TableCell className="text-right">{entry.taxAmount.toFixed(2)} €</TableCell>
                <TableCell className="text-right">{entry.grossAmount.toFixed(2)} €</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalNet.toFixed(2)} €</TableCell>
              <TableCell className="text-right">{totalTax.toFixed(2)} €</TableCell>
              <TableCell className="text-right">{totalGross.toFixed(2)} €</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
