import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { withSpan } from "@/lib/telemetry";
import type {
  DashboardOverview,
  SalesMetric,
  RevenueMetric,
  OccupancyMetric,
  SalesTrendPoint,
  TaxSummaryEntry,
  DateRangePreset,
} from "@/types/dashboard";

function buildQuery(preset?: DateRangePreset, from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (preset && preset !== "Custom") {
    params.set("preset", preset);
  } else if (from && to) {
    params.set("from", from);
    params.set("to", to);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useDashboardOverview(preset: DateRangePreset = "ThisMonth", from?: string, to?: string) {
  const query = buildQuery(preset, from, to);
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard", "overview", preset, from, to],
    queryFn: () =>
      withSpan("dashboard.loadMetrics", () =>
        api.get<DashboardOverview>(`/dashboard/overview${query}`)
      ),
    refetchInterval: 30_000,
  });
}

export function useEventSales(eventId: string | undefined, preset: DateRangePreset = "ThisMonth", from?: string, to?: string) {
  const query = buildQuery(preset, from, to);
  return useQuery<SalesMetric>({
    queryKey: ["dashboard", "sales", eventId, preset, from, to],
    queryFn: () => api.get<SalesMetric>(`/dashboard/events/${eventId}/sales${query}`),
    enabled: !!eventId,
  });
}

export function useEventRevenue(eventId: string | undefined, preset: DateRangePreset = "ThisMonth", from?: string, to?: string) {
  const query = buildQuery(preset, from, to);
  return useQuery<RevenueMetric>({
    queryKey: ["dashboard", "revenue", eventId, preset, from, to],
    queryFn: () => api.get<RevenueMetric>(`/dashboard/events/${eventId}/revenue${query}`),
    enabled: !!eventId,
  });
}

export function useEventOccupancy(eventId: string | undefined) {
  return useQuery<OccupancyMetric[]>({
    queryKey: ["dashboard", "occupancy", eventId],
    queryFn: () => api.get<OccupancyMetric[]>(`/dashboard/events/${eventId}/occupancy`),
    enabled: !!eventId,
  });
}

export function useEventTrend(eventId: string | undefined, preset: DateRangePreset = "ThisMonth", from?: string, to?: string) {
  const query = buildQuery(preset, from, to);
  return useQuery<SalesTrendPoint[]>({
    queryKey: ["dashboard", "trend", eventId, preset, from, to],
    queryFn: () => api.get<SalesTrendPoint[]>(`/dashboard/events/${eventId}/trend${query}`),
    enabled: !!eventId,
  });
}

export function useTaxSummary(preset: DateRangePreset = "ThisMonth", from?: string, to?: string) {
  const query = buildQuery(preset, from, to);
  return useQuery<TaxSummaryEntry[]>({
    queryKey: ["dashboard", "tax-summary", preset, from, to],
    queryFn: () => api.get<TaxSummaryEntry[]>(`/dashboard/tax-summary${query}`),
  });
}
