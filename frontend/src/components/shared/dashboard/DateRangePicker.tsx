import { Button } from "@/components/ui/button";
import type { DateRangePreset } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset) => void;
}

const presets: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "Today" },
  { label: "This Week", value: "ThisWeek" },
  { label: "This Month", value: "ThisMonth" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Date range filter">
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={value === preset.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(preset.value)}
          className={cn(value === preset.value && "pointer-events-none")}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
