using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Tax summary entry grouped by tax rate")]
public record TaxSummaryEntry
{
    [Description("Tax rate percentage")]
    [JsonPropertyName("taxRatePercentage")]
    public decimal TaxRatePercentage { get; init; }

    [Description("Display name of the tax rate")]
    [JsonPropertyName("taxRateName")]
    public required string TaxRateName { get; init; }

    [Description("Total net amount at this tax rate")]
    [JsonPropertyName("netAmount")]
    public decimal NetAmount { get; init; }

    [Description("Total tax amount at this rate")]
    [JsonPropertyName("taxAmount")]
    public decimal TaxAmount { get; init; }

    [Description("Total gross amount at this rate")]
    [JsonPropertyName("grossAmount")]
    public decimal GrossAmount { get; init; }
}
