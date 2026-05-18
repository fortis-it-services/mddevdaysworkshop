using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Occupancy metrics per ticket type for a specific event")]
public record OccupancyMetric
{
    [Description("Ticket type identifier")]
    [JsonPropertyName("ticketTypeId")]
    public required string TicketTypeId { get; init; }

    [Description("Ticket type name")]
    [JsonPropertyName("ticketTypeName")]
    public required string TicketTypeName { get; init; }

    [Description("Number of tickets sold")]
    [JsonPropertyName("sold")]
    public int Sold { get; init; }

    [Description("Total number of tickets available")]
    [JsonPropertyName("available")]
    public int Available { get; init; }

    [Description("Occupancy rate as a percentage (0-100)")]
    [JsonPropertyName("occupancyRate")]
    public decimal OccupancyRate { get; init; }
}
