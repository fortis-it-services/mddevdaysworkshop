using DevConfTicketing.Application.Export;

namespace DevConfTicketing.Api.Endpoints;

public static class ExportEndpoints
{
    public static RouteGroupBuilder MapExportEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/{eventId}/export/attendees", async (
            string eventId,
            ICsvExportService csvExportService,
            CancellationToken ct) =>
        {
            var bytes = await csvExportService.ExportAttendeesAsync(eventId, ct);
            return Results.File(bytes, "text/csv; charset=utf-8", $"attendees-{eventId}.csv");
        })
        .WithName("ExportAttendees")
        .WithTags("Export")
        .WithDescription("Export attendee list as CSV")
        .Produces(StatusCodes.Status200OK, contentType: "text/csv")
        .RequireAuthorization("AdminPolicy");

        group.MapGet("/{eventId}/export/orders", async (
            string eventId,
            string? status,
            ICsvExportService csvExportService,
            CancellationToken ct) =>
        {
            var bytes = await csvExportService.ExportOrdersAsync(eventId, status, ct);
            return Results.File(bytes, "text/csv; charset=utf-8", $"orders-{eventId}.csv");
        })
        .WithName("ExportOrders")
        .WithTags("Export")
        .WithDescription("Export orders as CSV")
        .Produces(StatusCodes.Status200OK, contentType: "text/csv")
        .RequireAuthorization("AdminPolicy");

        group.MapGet("/{eventId}/export/tax-report", async (
            string eventId,
            string? from,
            string? to,
            ICsvExportService csvExportService,
            CancellationToken ct) =>
        {
            DateTimeOffset? fromDate = DateTimeOffset.TryParse(from, out var f) ? f : null;
            DateTimeOffset? toDate = DateTimeOffset.TryParse(to, out var t) ? t : null;

            var bytes = await csvExportService.ExportTaxReportAsync(eventId, fromDate, toDate, ct);
            return Results.File(bytes, "text/csv; charset=utf-8", $"tax-report-{eventId}.csv");
        })
        .WithName("ExportTaxReport")
        .WithTags("Export")
        .WithDescription("Export tax report as CSV")
        .Produces(StatusCodes.Status200OK, contentType: "text/csv")
        .RequireAuthorization("AdminPolicy");

        return group;
    }
}
