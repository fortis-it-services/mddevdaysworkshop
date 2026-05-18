using System.ComponentModel;
using System.Text.Json.Serialization;

namespace DevConfTicketing.Domain.Metrics;

[Description("Filter for specifying a date range in dashboard queries")]
public record DateRangeFilter
{
    [Description("Preset time range selection")]
    [JsonPropertyName("preset")]
    public DateRangePreset Preset { get; init; } = DateRangePreset.ThisMonth;

    [Description("Custom range start date (used when Preset is Custom)")]
    [JsonPropertyName("from")]
    public DateTimeOffset? From { get; init; }

    [Description("Custom range end date (used when Preset is Custom)")]
    [JsonPropertyName("to")]
    public DateTimeOffset? To { get; init; }

    public (DateTimeOffset Start, DateTimeOffset End) Resolve()
    {
        var now = DateTimeOffset.UtcNow;
        return Preset switch
        {
            DateRangePreset.Today => (now.Date, now),
            DateRangePreset.ThisWeek => (now.Date.AddDays(-(int)now.DayOfWeek + (int)DayOfWeek.Monday), now),
            DateRangePreset.ThisMonth => (new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero), now),
            DateRangePreset.Custom when From.HasValue && To.HasValue => (From.Value, To.Value),
            _ => (now.Date.AddDays(-30), now)
        };
    }
}
