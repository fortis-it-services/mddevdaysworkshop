using System.ComponentModel;

namespace DevConfTicketing.Domain.Metrics;

[Description("Preset time ranges for dashboard filtering")]
public enum DateRangePreset
{
    [Description("Today only")]
    Today,

    [Description("Current week (Monday to Sunday)")]
    ThisWeek,

    [Description("Current calendar month")]
    ThisMonth,

    [Description("Custom date range defined by From and To")]
    Custom
}
