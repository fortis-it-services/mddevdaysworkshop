using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Event-level metrics for popularity and capacity")]
public record EventMetric
{
    [Description("Event identifier")]
    [JsonPropertyName("eventId")]
    public required string EventId { get; init; }

    [Description("Event title")]
    [JsonPropertyName("eventTitle")]
    public required string EventTitle { get; init; }

    [Description("Total tickets sold for this event")]
    [JsonPropertyName("ticketsSold")]
    public int TicketsSold { get; init; }

    [Description("Total tickets available for this event")]
    [JsonPropertyName("ticketsAvailable")]
    public int TicketsAvailable { get; init; }

    [Description("Occupancy rate as a percentage (0-100)")]
    [JsonPropertyName("occupancyRate")]
    public decimal OccupancyRate { get; init; }

    [Description("Total gross revenue for this event")]
    [JsonPropertyName("revenue")]
    public decimal Revenue { get; init; }
}
