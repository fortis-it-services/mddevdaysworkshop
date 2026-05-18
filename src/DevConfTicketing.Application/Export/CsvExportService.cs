using System.Globalization;
using System.Text;

using DevConfTicketing.Application.Interfaces;
using DevConfTicketing.Domain.Orders;

namespace DevConfTicketing.Application.Export;

public class CsvExportService(IOrderRepository orderRepository) : ICsvExportService
{
    private static readonly byte[] Utf8Bom = [0xEF, 0xBB, 0xBF];

    public async Task<byte[]> ExportAttendeesAsync(string eventId, CancellationToken cancellationToken = default)
    {
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);
        var paidOrders = orders.Where(o => o.Status == OrderStatus.Paid).ToList();

        var sb = new StringBuilder();
        sb.AppendLine("Name,Email,Ticket-Typ,Bestellcode,Bestelldatum,Check-in-Status");

        foreach (var order in paidOrders)
        {
            foreach (var position in order.Positions)
            {
                var name = EscapeCsv(position.AttendeeName ?? order.CustomerName ?? "");
                var email = EscapeCsv(position.AttendeeEmail ?? order.CustomerEmail);
                var ticketType = EscapeCsv(position.TicketTypeName);
                var orderCode = EscapeCsv(order.OrderCode);
                var orderDate = order.CreatedAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);
                var checkInStatus = position.CheckedInAt.HasValue
                    ? $"Eingecheckt ({position.CheckedInAt.Value:yyyy-MM-dd HH:mm})"
                    : "Nicht eingecheckt";

                sb.AppendLine($"{name},{email},{ticketType},{orderCode},{orderDate},{EscapeCsv(checkInStatus)}");
            }
        }

        return BuildCsvBytes(sb);
    }

    public async Task<byte[]> ExportOrdersAsync(string eventId, string? status = null, CancellationToken cancellationToken = default)
    {
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var filterStatus))
        {
            orders = orders.Where(o => o.Status == filterStatus).ToList();
        }

        var sb = new StringBuilder();
        sb.AppendLine("Bestellcode,Datum,Kunde,Status,Netto,Steuer,Brutto,Währung");

        foreach (var order in orders.OrderByDescending(o => o.CreatedAt))
        {
            var orderCode = EscapeCsv(order.OrderCode);
            var date = order.CreatedAt.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);
            var customer = EscapeCsv(order.CustomerName ?? order.CustomerEmail);
            var orderStatus = order.Status.ToString();
            var net = order.TotalNet.ToString("F2", CultureInfo.InvariantCulture);
            var tax = order.TotalTax.ToString("F2", CultureInfo.InvariantCulture);
            var gross = order.TotalGross.ToString("F2", CultureInfo.InvariantCulture);
            var currency = order.Currency;

            sb.AppendLine($"{orderCode},{date},{customer},{orderStatus},{net},{tax},{gross},{currency}");
        }

        return BuildCsvBytes(sb);
    }

    public async Task<byte[]> ExportTaxReportAsync(string eventId, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default)
    {
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);
        var paidOrders = orders.Where(o => o.Status == OrderStatus.Paid).ToList();

        if (from.HasValue)
        {
            paidOrders = paidOrders.Where(o => o.CreatedAt >= from.Value).ToList();
        }

        if (to.HasValue)
        {
            paidOrders = paidOrders.Where(o => o.CreatedAt <= to.Value).ToList();
        }

        var taxGroups = paidOrders
            .SelectMany(o => o.Positions)
            .SelectMany(p => p.LineItems)
            .GroupBy(li => new { li.TaxRatePercentage, li.TaxRateName })
            .OrderByDescending(g => g.Key.TaxRatePercentage);

        var sb = new StringBuilder();
        sb.AppendLine("Steuersatz,Steuersatz-Name,Nettobetrag,Steuerbetrag,Bruttobetrag");

        foreach (var group in taxGroups)
        {
            var rate = group.Key.TaxRatePercentage.ToString("F2", CultureInfo.InvariantCulture);
            var rateName = EscapeCsv(group.Key.TaxRateName);
            var net = group.Sum(li => li.TotalNet).ToString("F2", CultureInfo.InvariantCulture);
            var tax = group.Sum(li => li.TaxAmount).ToString("F2", CultureInfo.InvariantCulture);
            var gross = group.Sum(li => li.TotalGross).ToString("F2", CultureInfo.InvariantCulture);

            sb.AppendLine($"{rate}%,{rateName},{net},{tax},{gross}");
        }

        return BuildCsvBytes(sb);
    }

    private static byte[] BuildCsvBytes(StringBuilder sb)
    {
        var contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        var result = new byte[Utf8Bom.Length + contentBytes.Length];
        Utf8Bom.CopyTo(result, 0);
        contentBytes.CopyTo(result, Utf8Bom.Length);
        return result;
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return "";
        }

        if (value.Contains('"') || value.Contains(',') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}
