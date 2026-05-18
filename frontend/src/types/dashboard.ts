export type DateRangePreset = "Today" | "ThisWeek" | "ThisMonth" | "Custom";

export interface DashboardOverview {
  totalRevenue: number;
  totalTicketsSold: number;
  activeEvents: number;
  averageOrderValue: number;
  currency: string;
  topEvents: EventMetric[];
  operationalMetrics: OperationalMetric;
}

export interface EventMetric {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
  ticketsAvailable: number;
  occupancyRate: number;
  revenue: number;
}

export interface SalesMetric {
  totalTicketsSold: number;
  salesByEvent: EventSalesBreakdown[];
  salesByTicketType: TicketTypeSalesBreakdown[];
}

export interface EventSalesBreakdown {
  eventId: string;
  eventTitle: string;
  ticketsSold: number;
}

export interface TicketTypeSalesBreakdown {
  ticketTypeId: string;
  ticketTypeName: string;
  ticketsSold: number;
}

export interface RevenueMetric {
  totalGross: number;
  totalNet: number;
  totalTax: number;
  currency: string;
  averageOrderValue: number;
  revenueByTaxRate: TaxSummaryEntry[];
}

export interface OccupancyMetric {
  ticketTypeId: string;
  ticketTypeName: string;
  sold: number;
  available: number;
  occupancyRate: number;
}

export interface SalesTrendPoint {
  date: string;
  ticketsSold: number;
  revenue: number;
  orderCount: number;
}

export interface TaxSummaryEntry {
  taxRatePercentage: number;
  taxRateName: string;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
}

export interface OperationalMetric {
  pendingOrders: number;
  cancellationRate: number;
  averageProcessingTimeMinutes: number;
  totalOrders: number;
  cancelledOrders: number;
}
