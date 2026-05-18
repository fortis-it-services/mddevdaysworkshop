using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Revenue metrics showing financial totals")]
public record RevenueMetric
{
    [Description("Total gross revenue including tax")]
    [JsonPropertyName("totalGross")]
    public decimal TotalGross { get; init; }

    [Description("Total net revenue before tax")]
    [JsonPropertyName("totalNet")]
    public decimal TotalNet { get; init; }

    [Description("Total tax amount collected")]
    [JsonPropertyName("totalTax")]
    public decimal TotalTax { get; init; }

    [Description("Currency code for all amounts")]
    [JsonPropertyName("currency")]
    public required string Currency { get; init; }

    [Description("Average order value (gross)")]
    [JsonPropertyName("averageOrderValue")]
    public decimal AverageOrderValue { get; init; }

    [Description("Revenue broken down by tax rate")]
    [JsonPropertyName("revenueByTaxRate")]
    public IReadOnlyList<TaxSummaryEntry> RevenueByTaxRate { get; init; } = [];
}
