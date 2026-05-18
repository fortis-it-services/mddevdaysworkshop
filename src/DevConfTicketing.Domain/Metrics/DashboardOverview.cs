using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Aggregated dashboard overview with all KPI cards and top events")]
public record DashboardOverview
{
    [Description("Total gross revenue across all events")]
    [JsonPropertyName("totalRevenue")]
    public decimal TotalRevenue { get; init; }

    [Description("Total number of tickets sold")]
    [JsonPropertyName("totalTicketsSold")]
    public int TotalTicketsSold { get; init; }

    [Description("Number of currently active (published) events")]
    [JsonPropertyName("activeEvents")]
    public int ActiveEvents { get; init; }

    [Description("Average order value (gross)")]
    [JsonPropertyName("averageOrderValue")]
    public decimal AverageOrderValue { get; init; }

    [Description("Currency code for monetary values")]
    [JsonPropertyName("currency")]
    public required string Currency { get; init; }

    [Description("Top events by revenue")]
    [JsonPropertyName("topEvents")]
    public IReadOnlyList<EventMetric> TopEvents { get; init; } = [];

    [Description("Operational KPIs")]
    [JsonPropertyName("operationalMetrics")]
    public required OperationalMetric OperationalMetrics { get; init; }
}
