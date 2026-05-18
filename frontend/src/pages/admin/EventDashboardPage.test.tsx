import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EventDashboardPage from '@/pages/admin/EventDashboardPage';
import type { SalesMetric, RevenueMetric, OccupancyMetric, SalesTrendPoint } from '@/types/dashboard';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children, 'aria-label': ariaLabel }: { children: React.ReactNode; 'aria-label'?: string }) => (
      <div aria-label={ariaLabel}>{children}</div>
    ),
  };
});

vi.mock('@/lib/telemetry', () => ({
  withSpan: (_name: string, fn: (span: unknown) => Promise<unknown>) => fn({}),
  initTelemetry: vi.fn(),
  trackPageView: vi.fn(),
  getTracer: vi.fn(),
  startSpan: vi.fn(() => ({ end: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn(), recordException: vi.fn() })),
}));

vi.mock('@/hooks/useDashboard');

import { useEventSales, useEventRevenue, useEventOccupancy, useEventTrend } from '@/hooks/useDashboard';

const EVENT_ID = 'event-abc-123';

const mockSales: SalesMetric = {
  totalTicketsSold: 180,
  salesByEvent: [],
  salesByTicketType: [
    { ticketTypeId: 'tt-1', ticketTypeName: 'Standard', ticketsSold: 120 },
    { ticketTypeId: 'tt-2', ticketTypeName: 'VIP', ticketsSold: 60 },
  ],
};

const mockRevenue: RevenueMetric = {
  totalGross: 9000,
  totalNet: 7563.03,
  totalTax: 1436.97,
  currency: '€',
  averageOrderValue: 50,
  revenueByTaxRate: [],
};

const mockOccupancy: OccupancyMetric[] = [
  { ticketTypeId: 'tt-1', ticketTypeName: 'Standard', sold: 120, available: 200, occupancyRate: 60 },
  { ticketTypeId: 'tt-2', ticketTypeName: 'VIP', sold: 60, available: 80, occupancyRate: 75 },
];

const mockTrend: SalesTrendPoint[] = [
  { date: '2026-05-10', ticketsSold: 20, revenue: 1000, orderCount: 10 },
  { date: '2026-05-11', ticketsSold: 35, revenue: 1750, orderCount: 18 },
];

function renderPage(eventId = EVENT_ID) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/admin/events/${eventId}/dashboard`]}>
        <Routes>
          <Route path="/admin/events/:id/dashboard" element={<EventDashboardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventDashboardPage', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useEventSales).mockReturnValue({ data: mockSales, isLoading: false } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useEventRevenue).mockReturnValue({ data: mockRevenue } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useEventOccupancy).mockReturnValue({ data: mockOccupancy } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useEventTrend).mockReturnValue({ data: mockTrend } as any);
  });

  describe('KPI-Cards laden korrekt', () => {
    it('zeigt Tickets Sold KPI-Card mit korrektem Wert an', () => {
      renderPage();
      expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
      expect(screen.getByText('180')).toBeInTheDocument();
    });

    it('zeigt Revenue KPI-Card mit korrektem Wert an', () => {
      renderPage();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText(/9000\.00/)).toBeInTheDocument();
    });

    it('zeigt Occupancy KPI-Card mit berechnetem Prozentwert an', () => {
      renderPage();
      expect(screen.getByText('Occupancy')).toBeInTheDocument();
      // total sold=180, total available=280 → 64%
      expect(screen.getByText(/64%/)).toBeInTheDocument();
    });

    it('zeigt alle vier KPI-Cards gleichzeitig an', () => {
      renderPage();
      expect(screen.getByText('Tickets Sold')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Occupancy')).toBeInTheDocument();
      expect(screen.getByText('Cancellation Rate')).toBeInTheDocument();
    });
  });

  describe('Loading-Zustand', () => {
    it('zeigt Lade-Skeletons wenn Sales-Daten laden', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useEventSales).mockReturnValue({ data: undefined, isLoading: true } as any);
      const { container } = renderPage();
      const skeletons = container.querySelectorAll('[class*="rounded-xl"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('zeigt Dashboard-Inhalt wenn Daten vorhanden', () => {
      renderPage();
      expect(screen.getByText('Event Dashboard')).toBeInTheDocument();
    });
  });

  describe('Date-Range-Filter funktioniert', () => {
    it('zeigt alle drei Zeitraum-Filter-Buttons an', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    });

    it('ruft useEventSales mit "Today" auf nach Klick auf Today-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(vi.mocked(useEventSales)).toHaveBeenCalledWith(EVENT_ID, 'Today');
    });

    it('ruft useEventSales mit "ThisWeek" auf nach Klick auf This Week-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'This Week' }));
      expect(vi.mocked(useEventSales)).toHaveBeenCalledWith(EVENT_ID, 'ThisWeek');
    });

    it('startet standardmäßig mit "ThisMonth"-Filter', () => {
      renderPage();
      expect(vi.mocked(useEventSales)).toHaveBeenCalledWith(EVENT_ID, 'ThisMonth');
    });
  });

  describe('Charts werden gerendert', () => {
    it('rendert den Sales Trend Chart', () => {
      renderPage();
      expect(screen.getByText('Sales Trend')).toBeInTheDocument();
    });

    it('Sales Trend Chart verwendet einen responsiven Container', () => {
      renderPage();
      expect(screen.getByLabelText('Sales trend chart')).toBeInTheDocument();
    });

    it('rendert die Revenue-Verteilung (Pie Chart)', () => {
      renderPage();
      expect(screen.getByText('Distribution by Ticket Type')).toBeInTheDocument();
    });

    it('rendert den Occupancy Chart', () => {
      renderPage();
      expect(screen.getByText('Occupancy by Ticket Type')).toBeInTheDocument();
    });

    it('Occupancy Chart verwendet einen responsiven Container', () => {
      renderPage();
      expect(screen.getByLabelText('Occupancy chart')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('rendert Charts in responsiven Containern', () => {
      renderPage();
      const salesChart = screen.getByLabelText('Sales trend chart');
      const occupancyChart = screen.getByLabelText('Occupancy chart');
      expect(salesChart).toBeInTheDocument();
      expect(occupancyChart).toBeInTheDocument();
    });
  });
});
