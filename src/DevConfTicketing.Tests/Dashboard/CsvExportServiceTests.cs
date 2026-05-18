using System.Text;

using DevConfTicketing.Application.Export;
using DevConfTicketing.Application.Interfaces;
using DevConfTicketing.Domain.Orders;

namespace DevConfTicketing.Tests.Dashboard;

public class CsvExportServiceTests
{
    private readonly InMemoryOrderRepository _orderRepo = new();
    private readonly CsvExportService _sut;

    public CsvExportServiceTests()
    {
        _sut = new CsvExportService(_orderRepo);
    }

    [Fact]
    public async Task ExportAttendees_StartsWithBom()
    {
        var result = await _sut.ExportAttendeesAsync("e1");

        Assert.True(result.Length >= 3);
        Assert.Equal(0xEF, result[0]);
        Assert.Equal(0xBB, result[1]);
        Assert.Equal(0xBF, result[2]);
    }

    [Fact]
    public async Task ExportAttendees_HasCorrectHeaders()
    {
        var result = await _sut.ExportAttendeesAsync("e1");
        var content = Encoding.UTF8.GetString(result[3..]);

        Assert.StartsWith("Name,Email,Ticket-Typ,Bestellcode,Bestelldatum,Check-in-Status", content);
    }

    [Fact]
    public async Task ExportAttendees_IncludesCheckedInStatus()
    {
        _orderRepo.Orders.Add(new Order
        {
            Id = "o1", OrderCode = "ORD-001", EventId = "e1",
            CustomerEmail = "john@example.com", CustomerName = "John Doe",
            Status = OrderStatus.Paid,
            TotalNet = 100m, TotalTax = 19m, TotalGross = 119m,
            DiscountAmount = 0m, Currency = "EUR",
            CreatedAt = new DateTimeOffset(2025, 6, 1, 10, 0, 0, TimeSpan.Zero),
            UpdatedAt = DateTimeOffset.UtcNow,
            Positions =
            [
                new OrderPosition
                {
                    Index = 0, TicketTypeId = "tt1", TicketTypeName = "Standard",
                    TicketSecret = "sec1", AttendeeName = "John Doe", AttendeeEmail = "john@example.com",
                    PositionNet = 100m, PositionTax = 19m, PositionGross = 119m,
                    CheckedInAt = new DateTimeOffset(2025, 6, 15, 9, 0, 0, TimeSpan.Zero),
                    LineItems = []
                }
            ]
        });

        var result = await _sut.ExportAttendeesAsync("e1");
        var content = Encoding.UTF8.GetString(result[3..]);

        Assert.Contains("John Doe", content);
        Assert.Contains("john@example.com", content);
        Assert.Contains("Standard", content);
        Assert.Contains("ORD-001", content);
        Assert.Contains("Eingecheckt", content);
    }

    [Fact]
    public async Task ExportOrders_HasCorrectHeaders()
    {
        var result = await _sut.ExportOrdersAsync("e1");
        var content = Encoding.UTF8.GetString(result[3..]);

        Assert.StartsWith("Bestellcode,Datum,Kunde,Status,Netto,Steuer,Brutto,Währung", content);
    }

    [Fact]
    public async Task ExportOrders_EscapesCommaInName()
    {
        _orderRepo.Orders.Add(new Order
        {
            Id = "o1", OrderCode = "ORD-001", EventId = "e1",
            CustomerEmail = "test@test.com", CustomerName = "Doe, John",
            Status = OrderStatus.Paid,
            TotalNet = 100m, TotalTax = 19m, TotalGross = 119m,
            DiscountAmount = 0m, Currency = "EUR",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
            Positions = []
        });

        var result = await _sut.ExportOrdersAsync("e1");
        var content = Encoding.UTF8.GetString(result[3..]);

        Assert.Contains("\"Doe, John\"", content);
    }

    [Fact]
    public async Task ExportTaxReport_GroupsByTaxRate()
    {
        _orderRepo.Orders.Add(new Order
        {
            Id = "o1", OrderCode = "ORD-001", EventId = "e1",
            CustomerEmail = "test@test.com", Status = OrderStatus.Paid,
            TotalNet = 100m, TotalTax = 19m, TotalGross = 119m,
            DiscountAmount = 0m, Currency = "EUR",
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow,
            Positions =
            [
                new OrderPosition
                {
                    Index = 0, TicketTypeId = "tt1", TicketTypeName = "Standard",
                    TicketSecret = "sec1", PositionNet = 100m, PositionTax = 19m, PositionGross = 119m,
                    LineItems =
                    [
                        new OrderLineItem { Name = "Ticket", Quantity = 1, UnitNetAmount = 100m, TaxRatePercentage = 19m, TaxRateName = "MwSt. 19%" }
                    ]
                }
            ]
        });

        var result = await _sut.ExportTaxReportAsync("e1");
        var content = Encoding.UTF8.GetString(result[3..]);

        Assert.Contains("19.00%", content);
        Assert.Contains("MwSt. 19%", content);
        Assert.Contains("100.00", content);
    }
}
