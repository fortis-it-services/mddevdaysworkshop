using DevConfTicketing.Application.Dashboard;
using DevConfTicketing.Domain.Metrics;

namespace DevConfTicketing.Api.Endpoints;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/overview", async (
            string? from,
            string? to,
            string? preset,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var filter = BuildFilter(from, to, preset);
            var overview = await metricsService.GetOverviewAsync(filter, ct);
            return Results.Ok(overview);
        })
        .WithName("GetDashboardOverview")
        .WithTags("Dashboard")
        .WithDescription("Get overall dashboard KPIs and top events")
        .Produces<DashboardOverview>();

        group.MapGet("/events/{eventId}/sales", async (
            string eventId,
            string? from,
            string? to,
            string? preset,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var filter = BuildFilter(from, to, preset);
            var sales = await metricsService.GetEventSalesAsync(eventId, filter, ct);
            return Results.Ok(sales);
        })
        .WithName("GetEventSales")
        .WithTags("Dashboard")
        .WithDescription("Get sales metrics for a specific event")
        .Produces<SalesMetric>();

        group.MapGet("/events/{eventId}/revenue", async (
            string eventId,
            string? from,
            string? to,
            string? preset,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var filter = BuildFilter(from, to, preset);
            var revenue = await metricsService.GetEventRevenueAsync(eventId, filter, ct);
            return Results.Ok(revenue);
        })
        .WithName("GetEventRevenue")
        .WithTags("Dashboard")
        .WithDescription("Get revenue metrics for a specific event")
        .Produces<RevenueMetric>();

        group.MapGet("/events/{eventId}/occupancy", async (
            string eventId,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var occupancy = await metricsService.GetEventOccupancyAsync(eventId, ct);
            return Results.Ok(occupancy);
        })
        .WithName("GetEventOccupancy")
        .WithTags("Dashboard")
        .WithDescription("Get occupancy metrics per ticket type for an event")
        .Produces<IReadOnlyList<OccupancyMetric>>();

        group.MapGet("/events/{eventId}/trend", async (
            string eventId,
            string? from,
            string? to,
            string? preset,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var filter = BuildFilter(from, to, preset);
            var trend = await metricsService.GetEventTrendAsync(eventId, filter, ct);
            return Results.Ok(trend);
        })
        .WithName("GetEventTrend")
        .WithTags("Dashboard")
        .WithDescription("Get sales trend time series for an event")
        .Produces<IReadOnlyList<SalesTrendPoint>>();

        group.MapGet("/tax-summary", async (
            string? from,
            string? to,
            string? preset,
            IMetricsService metricsService,
            CancellationToken ct) =>
        {
            var filter = BuildFilter(from, to, preset);
            var summary = await metricsService.GetTaxSummaryAsync(filter, ct);
            return Results.Ok(summary);
        })
        .WithName("GetTaxSummary")
        .WithTags("Dashboard")
        .WithDescription("Get tax summary grouped by tax rate")
        .Produces<IReadOnlyList<TaxSummaryEntry>>();

        return group;
    }

    private static DateRangeFilter BuildFilter(string? from, string? to, string? preset)
    {
        if (!string.IsNullOrEmpty(preset) && Enum.TryParse<DateRangePreset>(preset, ignoreCase: true, out var parsedPreset))
        {
            return new DateRangeFilter { Preset = parsedPreset };
        }

        if (DateTimeOffset.TryParse(from, out var fromDate) && DateTimeOffset.TryParse(to, out var toDate))
        {
            return new DateRangeFilter
            {
                Preset = DateRangePreset.Custom,
                From = fromDate,
                To = toDate
            };
        }

        return new DateRangeFilter { Preset = DateRangePreset.ThisMonth };
    }
}
