using DevConfTicketing.Application.Interfaces;
using DevConfTicketing.Domain.Events;
using DevConfTicketing.Domain.Metrics;
using DevConfTicketing.Domain.Orders;

namespace DevConfTicketing.Application.Dashboard;

public class MetricsService(
    IOrderRepository orderRepository,
    IEventRepository eventRepository,
    ITicketTypeRepository ticketTypeRepository) : IMetricsService
{
    public async Task<DashboardOverview> GetOverviewAsync(DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var events = await eventRepository.GetAllAsync(cancellationToken);
        var activeEvents = events.Where(e => e.Status == EventStatus.Published).ToList();

        var allOrders = new List<Order>();
        foreach (var evt in events)
        {
            var orders = await orderRepository.GetByEventIdAsync(evt.Id, cancellationToken);
            allOrders.AddRange(orders);
        }

        var filteredOrders = allOrders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .ToList();

        var paidOrders = filteredOrders.Where(o => o.Status == OrderStatus.Paid).ToList();
        var totalRevenue = paidOrders.Sum(o => o.TotalGross);
        var totalTickets = paidOrders.Sum(o => o.Positions.Count);
        var averageOrderValue = paidOrders.Count > 0 ? totalRevenue / paidOrders.Count : 0;
        var currency = paidOrders.FirstOrDefault()?.Currency ?? "EUR";

        var topEvents = await BuildTopEventsAsync(events, allOrders, start, end, cancellationToken);
        var operationalMetrics = CalculateOperationalMetrics(filteredOrders);

        return new DashboardOverview
        {
            TotalRevenue = totalRevenue,
            TotalTicketsSold = totalTickets,
            ActiveEvents = activeEvents.Count,
            AverageOrderValue = averageOrderValue,
            Currency = currency,
            TopEvents = topEvents,
            OperationalMetrics = operationalMetrics
        };
    }

    public async Task<SalesMetric> GetEventSalesAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);
        var filteredOrders = orders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end && o.Status == OrderStatus.Paid)
            .ToList();

        var ticketTypes = await ticketTypeRepository.GetByEventIdAsync(eventId, cancellationToken);

        var salesByTicketType = ticketTypes.Select(tt =>
        {
            var sold = filteredOrders
                .SelectMany(o => o.Positions)
                .Count(p => p.TicketTypeId == tt.Id);
            return new TicketTypeSalesBreakdown
            {
                TicketTypeId = tt.Id,
                TicketTypeName = tt.Name,
                TicketsSold = sold
            };
        }).ToList();

        return new SalesMetric
        {
            TotalTicketsSold = filteredOrders.Sum(o => o.Positions.Count),
            SalesByTicketType = salesByTicketType
        };
    }

    public async Task<RevenueMetric> GetEventRevenueAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);
        var paidOrders = orders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end && o.Status == OrderStatus.Paid)
            .ToList();

        var totalGross = paidOrders.Sum(o => o.TotalGross);
        var totalNet = paidOrders.Sum(o => o.TotalNet);
        var totalTax = paidOrders.Sum(o => o.TotalTax);
        var averageOrderValue = paidOrders.Count > 0 ? totalGross / paidOrders.Count : 0;
        var currency = paidOrders.FirstOrDefault()?.Currency ?? "EUR";

        var revenueByTaxRate = CalculateTaxBreakdown(paidOrders);

        return new RevenueMetric
        {
            TotalGross = totalGross,
            TotalNet = totalNet,
            TotalTax = totalTax,
            Currency = currency,
            AverageOrderValue = averageOrderValue,
            RevenueByTaxRate = revenueByTaxRate
        };
    }

    public async Task<IReadOnlyList<OccupancyMetric>> GetEventOccupancyAsync(string eventId, CancellationToken cancellationToken = default)
    {
        var ticketTypes = await ticketTypeRepository.GetByEventIdAsync(eventId, cancellationToken);

        return ticketTypes.Select(tt =>
        {
            var total = tt.AvailableQuantity + tt.SoldQuantity;
            var occupancyRate = total > 0 ? (decimal)tt.SoldQuantity / total * 100 : 0;
            return new OccupancyMetric
            {
                TicketTypeId = tt.Id,
                TicketTypeName = tt.Name,
                Sold = tt.SoldQuantity,
                Available = total,
                OccupancyRate = Math.Round(occupancyRate, 1)
            };
        }).ToList();
    }

    public async Task<IReadOnlyList<SalesTrendPoint>> GetEventTrendAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var orders = await orderRepository.GetByEventIdAsync(eventId, cancellationToken);
        var paidOrders = orders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end && o.Status == OrderStatus.Paid)
            .ToList();

        var grouped = paidOrders
            .GroupBy(o => o.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new SalesTrendPoint
            {
                Date = g.Key,
                TicketsSold = g.Sum(o => o.Positions.Count),
                Revenue = g.Sum(o => o.TotalGross),
                OrderCount = g.Count()
            })
            .ToList();

        return grouped;
    }

    public async Task<IReadOnlyList<TaxSummaryEntry>> GetTaxSummaryAsync(DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var events = await eventRepository.GetAllAsync(cancellationToken);

        var allPaidOrders = new List<Order>();
        foreach (var evt in events)
        {
            var orders = await orderRepository.GetByEventIdAsync(evt.Id, cancellationToken);
            allPaidOrders.AddRange(orders.Where(o => o.CreatedAt >= start && o.CreatedAt <= end && o.Status == OrderStatus.Paid));
        }

        return CalculateTaxBreakdown(allPaidOrders);
    }

    public async Task<OperationalMetric> GetOperationalKpisAsync(DateRangeFilter filter, CancellationToken cancellationToken = default)
    {
        var (start, end) = filter.Resolve();
        var events = await eventRepository.GetAllAsync(cancellationToken);

        var allOrders = new List<Order>();
        foreach (var evt in events)
        {
            var orders = await orderRepository.GetByEventIdAsync(evt.Id, cancellationToken);
            allOrders.AddRange(orders);
        }

        var filteredOrders = allOrders
            .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
            .ToList();

        return CalculateOperationalMetrics(filteredOrders);
    }

    private async Task<IReadOnlyList<EventMetric>> BuildTopEventsAsync(
        IReadOnlyList<Event> events,
        List<Order> allOrders,
        DateTimeOffset start,
        DateTimeOffset end,
        CancellationToken cancellationToken)
    {
        var eventMetrics = new List<EventMetric>();
        foreach (var evt in events)
        {
            var eventOrders = allOrders
                .Where(o => o.EventId == evt.Id && o.CreatedAt >= start && o.CreatedAt <= end && o.Status == OrderStatus.Paid)
                .ToList();

            var ticketTypes = await ticketTypeRepository.GetByEventIdAsync(evt.Id, cancellationToken);
            var totalAvailable = ticketTypes.Sum(tt => tt.AvailableQuantity + tt.SoldQuantity);
            var totalSold = ticketTypes.Sum(tt => tt.SoldQuantity);
            var occupancyRate = totalAvailable > 0 ? (decimal)totalSold / totalAvailable * 100 : 0;

            eventMetrics.Add(new EventMetric
            {
                EventId = evt.Id,
                EventTitle = evt.Title,
                TicketsSold = totalSold,
                TicketsAvailable = totalAvailable,
                OccupancyRate = Math.Round(occupancyRate, 1),
                Revenue = eventOrders.Sum(o => o.TotalGross)
            });
        }

        return eventMetrics.OrderByDescending(e => e.Revenue).Take(10).ToList();
    }

    private static OperationalMetric CalculateOperationalMetrics(List<Order> orders)
    {
        var totalOrders = orders.Count;
        var pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending);
        var cancelledOrders = orders.Count(o => o.Status is OrderStatus.Cancelled or OrderStatus.Refunded);
        var cancellationRate = totalOrders > 0 ? (decimal)cancelledOrders / totalOrders * 100 : 0;

        var paidOrders = orders.Where(o => o.Status == OrderStatus.Paid && o.UpdatedAt > o.CreatedAt).ToList();
        var avgProcessingTime = paidOrders.Count > 0
            ? paidOrders.Average(o => (o.UpdatedAt - o.CreatedAt).TotalMinutes)
            : 0;

        return new OperationalMetric
        {
            PendingOrders = pendingOrders,
            CancellationRate = Math.Round(cancellationRate, 1),
            AverageProcessingTimeMinutes = Math.Round(avgProcessingTime, 1),
            TotalOrders = totalOrders,
            CancelledOrders = cancelledOrders
        };
    }

    private static IReadOnlyList<TaxSummaryEntry> CalculateTaxBreakdown(List<Order> paidOrders)
    {
        var allLineItems = paidOrders
            .SelectMany(o => o.Positions)
            .SelectMany(p => p.LineItems);

        return allLineItems
            .GroupBy(li => new { li.TaxRatePercentage, li.TaxRateName })
            .Select(g => new TaxSummaryEntry
            {
                TaxRatePercentage = g.Key.TaxRatePercentage,
                TaxRateName = g.Key.TaxRateName,
                NetAmount = g.Sum(li => li.TotalNet),
                TaxAmount = g.Sum(li => li.TaxAmount),
                GrossAmount = g.Sum(li => li.TotalGross)
            })
            .OrderByDescending(t => t.TaxRatePercentage)
            .ToList();
    }
}
