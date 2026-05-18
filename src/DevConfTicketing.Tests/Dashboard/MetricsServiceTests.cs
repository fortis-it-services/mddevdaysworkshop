using DevConfTicketing.Application.Dashboard;
using DevConfTicketing.Application.Interfaces;
using DevConfTicketing.Domain.Events;
using DevConfTicketing.Domain.Metrics;
using DevConfTicketing.Domain.Orders;
using DevConfTicketing.Domain.Tickets;

namespace DevConfTicketing.Tests.Dashboard;

public class MetricsServiceTests
{
    private readonly InMemoryEventRepository _eventRepo = new();
    private readonly InMemoryOrderRepository _orderRepo = new();
    private readonly InMemoryTicketTypeRepository _ticketTypeRepo = new();
    private readonly MetricsService _sut;

    public MetricsServiceTests()
    {
        _sut = new MetricsService(_orderRepo, _eventRepo, _ticketTypeRepo);
    }

    [Fact]
    public async Task GetOverview_NoOrders_ReturnsZeros()
    {
        _eventRepo.Events.Add(new Event
        {
            Id = "e1", Title = "Test Event", Description = "", Location = "",
            StartDate = DateTimeOffset.UtcNow, EndDate = DateTimeOffset.UtcNow.AddDays(1),
            OrganizerId = "org1", Status = EventStatus.Published
        });

        var result = await _sut.GetOverviewAsync(new DateRangeFilter { Preset = DateRangePreset.ThisMonth });

        Assert.Equal(0, result.TotalTicketsSold);
        Assert.Equal(0m, result.TotalRevenue);
        Assert.Equal(0m, result.AverageOrderValue);
        Assert.Equal(1, result.ActiveEvents);
    }

    [Fact]
    public async Task GetOverview_WithPaidOrders_CalculatesCorrectly()
    {
        var evt = new Event
        {
            Id = "e1", Title = "DevConf", Description = "", Location = "",
            StartDate = DateTimeOffset.UtcNow, EndDate = DateTimeOffset.UtcNow.AddDays(1),
            OrganizerId = "org1", Status = EventStatus.Published
        };
        _eventRepo.Events.Add(evt);
        _ticketTypeRepo.TicketTypes.Add(new TicketType
        {
            Id = "tt1", EventId = "e1", Name = "Standard", Description = "",
            Price = 100m, Currency = "EUR", AvailableQuantity = 50, SoldQuantity = 2,
            LineItems = []
        });

        var order = CreatePaidOrder("e1", "o1", 2, 200m, 38m, 238m);
        _orderRepo.Orders.Add(order);

        var result = await _sut.GetOverviewAsync(new DateRangeFilter { Preset = DateRangePreset.ThisMonth });

        Assert.Equal(2, result.TotalTicketsSold);
        Assert.Equal(238m, result.TotalRevenue);
        Assert.Equal(238m, result.AverageOrderValue);
    }

    [Fact]
    public async Task GetEventOccupancy_CalculatesPercentage()
    {
        _ticketTypeRepo.TicketTypes.Add(new TicketType
        {
            Id = "tt1", EventId = "e1", Name = "VIP", Description = "",
            Price = 200m, Currency = "EUR", AvailableQuantity = 80, SoldQuantity = 20,
            LineItems = []
        });

        var result = await _sut.GetEventOccupancyAsync("e1");

        Assert.Single(result);
        Assert.Equal("VIP", result[0].TicketTypeName);
        Assert.Equal(20, result[0].Sold);
        Assert.Equal(100, result[0].Available);
        Assert.Equal(20.0m, result[0].OccupancyRate);
    }

    [Fact]
    public async Task GetOperationalKpis_CancellationRate()
    {
        var evt = new Event
        {
            Id = "e1", Title = "Test", Description = "", Location = "",
            StartDate = DateTimeOffset.UtcNow, EndDate = DateTimeOffset.UtcNow.AddDays(1),
            OrganizerId = "org1"
        };
        _eventRepo.Events.Add(evt);

        _orderRepo.Orders.Add(CreatePaidOrder("e1", "o1", 1, 100m, 19m, 119m));
        _orderRepo.Orders.Add(CreateCancelledOrder("e1", "o2"));
        _orderRepo.Orders.Add(CreateCancelledOrder("e1", "o3"));

        var result = await _sut.GetOperationalKpisAsync(new DateRangeFilter { Preset = DateRangePreset.ThisMonth });

        Assert.Equal(3, result.TotalOrders);
        Assert.Equal(2, result.CancelledOrders);
        Assert.True(result.CancellationRate > 60);
    }

    [Fact]
    public async Task GetTaxSummary_GroupsByTaxRate()
    {
        var evt = new Event
        {
            Id = "e1", Title = "Test", Description = "", Location = "",
            StartDate = DateTimeOffset.UtcNow, EndDate = DateTimeOffset.UtcNow.AddDays(1),
            OrganizerId = "org1"
        };
        _eventRepo.Events.Add(evt);

        var order = new Order
        {
            Id = "o1", OrderCode = "ORD-001", EventId = "e1",
            CustomerEmail = "test@test.com", Status = OrderStatus.Paid,
            TotalNet = 200m, TotalTax = 33m, TotalGross = 233m,
            DiscountAmount = 0m, Currency = "EUR",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), UpdatedAt = DateTimeOffset.UtcNow,
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
                },
                new OrderPosition
                {
                    Index = 1, TicketTypeId = "tt2", TicketTypeName = "Workshop",
                    TicketSecret = "sec2", PositionNet = 100m, PositionTax = 7m, PositionGross = 107m,
                    LineItems =
                    [
                        new OrderLineItem { Name = "Workshop", Quantity = 1, UnitNetAmount = 100m, TaxRatePercentage = 7m, TaxRateName = "MwSt. 7%" }
                    ]
                }
            ]
        };
        _orderRepo.Orders.Add(order);

        var result = await _sut.GetTaxSummaryAsync(new DateRangeFilter { Preset = DateRangePreset.ThisMonth });

        Assert.Equal(2, result.Count);
        var rate19 = result.First(r => r.TaxRatePercentage == 19m);
        Assert.Equal(100m, rate19.NetAmount);
        Assert.Equal(19m, rate19.TaxAmount);
    }

    private static Order CreatePaidOrder(string eventId, string orderId, int positions, decimal net, decimal tax, decimal gross)
    {
        var orderPositions = Enumerable.Range(0, positions).Select(i => new OrderPosition
        {
            Index = i, TicketTypeId = "tt1", TicketTypeName = "Standard",
            TicketSecret = $"sec-{i}", PositionNet = net / positions, PositionTax = tax / positions,
            PositionGross = gross / positions,
            LineItems = [new OrderLineItem { Name = "Ticket", Quantity = 1, UnitNetAmount = net / positions, TaxRatePercentage = 19m, TaxRateName = "MwSt. 19%" }]
        }).ToList();

        return new Order
        {
            Id = orderId, OrderCode = $"ORD-{orderId}", EventId = eventId,
            CustomerEmail = "test@test.com", Status = OrderStatus.Paid,
            TotalNet = net, TotalTax = tax, TotalGross = gross,
            DiscountAmount = 0m, Currency = "EUR",
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), UpdatedAt = DateTimeOffset.UtcNow,
            Positions = orderPositions
        };
    }

    private static Order CreateCancelledOrder(string eventId, string orderId) => new()
    {
        Id = orderId, OrderCode = $"ORD-{orderId}", EventId = eventId,
        CustomerEmail = "test@test.com", Status = OrderStatus.Cancelled,
        TotalNet = 0m, TotalTax = 0m, TotalGross = 0m,
        DiscountAmount = 0m, Currency = "EUR",
        CreatedAt = DateTimeOffset.UtcNow.AddDays(-1), UpdatedAt = DateTimeOffset.UtcNow,
        CancellationDate = DateTimeOffset.UtcNow,
        Positions = []
    };
}

// Simple in-memory test doubles
internal class InMemoryEventRepository : IEventRepository
{
    public List<Event> Events { get; } = [];
    public Task<Event?> GetByIdAsync(string id, CancellationToken ct = default) => Task.FromResult(Events.Find(e => e.Id == id));
    public Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Event>>(Events);
    public Task<IReadOnlyList<Event>> GetByStatusAsync(EventStatus status, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Event>>(Events.Where(e => e.Status == status).ToList());
    public Task<Event> CreateAsync(Event @event, CancellationToken ct = default) { Events.Add(@event); return Task.FromResult(@event); }
    public Task<Event> UpdateAsync(Event @event, CancellationToken ct = default) => Task.FromResult(@event);
    public Task DeleteAsync(string id, CancellationToken ct = default) { Events.RemoveAll(e => e.Id == id); return Task.CompletedTask; }
}

internal class InMemoryOrderRepository : IOrderRepository
{
    public List<Order> Orders { get; } = [];
    public Task<Order?> GetByIdAsync(string eventId, string id, CancellationToken ct = default) => Task.FromResult(Orders.Find(o => o.EventId == eventId && o.Id == id));
    public Task<IReadOnlyList<Order>> GetByEventIdAsync(string eventId, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Order>>(Orders.Where(o => o.EventId == eventId).ToList());
    public Task<Order> CreateAsync(Order order, CancellationToken ct = default) { Orders.Add(order); return Task.FromResult(order); }
    public Task<Order> UpdateAsync(Order order, CancellationToken ct = default) => Task.FromResult(order);
}

internal class InMemoryTicketTypeRepository : ITicketTypeRepository
{
    public List<TicketType> TicketTypes { get; } = [];
    public Task<TicketType?> GetByIdAsync(string eventId, string id, CancellationToken ct = default) => Task.FromResult(TicketTypes.Find(t => t.EventId == eventId && t.Id == id));
    public Task<IReadOnlyList<TicketType>> GetByEventIdAsync(string eventId, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<TicketType>>(TicketTypes.Where(t => t.EventId == eventId).ToList());
    public Task<TicketType> CreateAsync(TicketType ticketType, CancellationToken ct = default) { TicketTypes.Add(ticketType); return Task.FromResult(ticketType); }
    public Task<TicketType> UpdateAsync(TicketType ticketType, CancellationToken ct = default) => Task.FromResult(ticketType);
    public Task DeleteAsync(string eventId, string id, CancellationToken ct = default) { TicketTypes.RemoveAll(t => t.EventId == eventId && t.Id == id); return Task.CompletedTask; }
}
