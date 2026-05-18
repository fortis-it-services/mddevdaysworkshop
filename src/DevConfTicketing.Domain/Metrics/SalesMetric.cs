using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Sales metrics showing ticket sales volumes")]
public record SalesMetric
{
    [Description("Total number of tickets sold")]
    [JsonPropertyName("totalTicketsSold")]
    public int TotalTicketsSold { get; init; }

    [Description("Sales broken down by event")]
    [JsonPropertyName("salesByEvent")]
    public IReadOnlyList<EventSalesBreakdown> SalesByEvent { get; init; } = [];

    [Description("Sales broken down by ticket type")]
    [JsonPropertyName("salesByTicketType")]
    public IReadOnlyList<TicketTypeSalesBreakdown> SalesByTicketType { get; init; } = [];
}

[Description("Sales breakdown for a single event")]
public record EventSalesBreakdown
{
    [Description("Event identifier")]
    [JsonPropertyName("eventId")]
    public required string EventId { get; init; }

    [Description("Event title")]
    [JsonPropertyName("eventTitle")]
    public required string EventTitle { get; init; }

    [Description("Number of tickets sold for this event")]
    [JsonPropertyName("ticketsSold")]
    public int TicketsSold { get; init; }
}

[Description("Sales breakdown for a single ticket type")]
public record TicketTypeSalesBreakdown
{
    [Description("Ticket type identifier")]
    [JsonPropertyName("ticketTypeId")]
    public required string TicketTypeId { get; init; }

    [Description("Ticket type name")]
    [JsonPropertyName("ticketTypeName")]
    public required string TicketTypeName { get; init; }

    [Description("Number of tickets sold for this type")]
    [JsonPropertyName("ticketsSold")]
    public int TicketsSold { get; init; }
}
