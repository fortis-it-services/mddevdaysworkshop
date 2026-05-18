using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("A single data point in a sales trend time series")]
public record SalesTrendPoint
{
    [Description("Date of this data point")]
    [JsonPropertyName("date")]
    public required DateTimeOffset Date { get; init; }

    [Description("Number of tickets sold on this date")]
    [JsonPropertyName("ticketsSold")]
    public int TicketsSold { get; init; }

    [Description("Gross revenue on this date")]
    [JsonPropertyName("revenue")]
    public decimal Revenue { get; init; }

    [Description("Number of orders placed on this date")]
    [JsonPropertyName("orderCount")]
    public int OrderCount { get; init; }
}
