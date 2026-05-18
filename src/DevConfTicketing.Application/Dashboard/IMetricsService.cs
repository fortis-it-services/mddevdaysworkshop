using DevConfTicketing.Domain.Metrics;

namespace DevConfTicketing.Application.Dashboard;

public interface IMetricsService
{
    Task<DashboardOverview> GetOverviewAsync(DateRangeFilter filter, CancellationToken cancellationToken = default);
    Task<SalesMetric> GetEventSalesAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default);
    Task<RevenueMetric> GetEventRevenueAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OccupancyMetric>> GetEventOccupancyAsync(string eventId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SalesTrendPoint>> GetEventTrendAsync(string eventId, DateRangeFilter filter, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaxSummaryEntry>> GetTaxSummaryAsync(DateRangeFilter filter, CancellationToken cancellationToken = default);
    Task<OperationalMetric> GetOperationalKpisAsync(DateRangeFilter filter, CancellationToken cancellationToken = default);
}
