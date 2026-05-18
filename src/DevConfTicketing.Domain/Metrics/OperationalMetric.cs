using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Operational KPIs for order processing")]
public record OperationalMetric
{
    [Description("Number of orders currently in pending status")]
    [JsonPropertyName("pendingOrders")]
    public int PendingOrders { get; init; }

    [Description("Cancellation rate as a percentage (0-100)")]
    [JsonPropertyName("cancellationRate")]
    public decimal CancellationRate { get; init; }

    [Description("Average processing time from order creation to payment in minutes")]
    [JsonPropertyName("averageProcessingTimeMinutes")]
    public double AverageProcessingTimeMinutes { get; init; }

    [Description("Total number of orders in the period")]
    [JsonPropertyName("totalOrders")]
    public int TotalOrders { get; init; }

    [Description("Number of cancelled orders")]
    [JsonPropertyName("cancelledOrders")]
    public int CancelledOrders { get; init; }
}
