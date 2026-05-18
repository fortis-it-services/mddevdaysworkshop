namespace DevConfTicketing.Application.Export;

public interface ICsvExportService
{
    Task<byte[]> ExportAttendeesAsync(string eventId, CancellationToken cancellationToken = default);
    Task<byte[]> ExportOrdersAsync(string eventId, string? status = null, CancellationToken cancellationToken = default);
    Task<byte[]> ExportTaxReportAsync(string eventId, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default);
}
