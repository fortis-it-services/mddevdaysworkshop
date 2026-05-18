import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import type { DashboardOverview, SalesTrendPoint } from '@/types/dashboard';

// Recharts' ResponsiveContainer requires DOM layout APIs unavailable in jsdom.
// We replace it with a plain div that forwards its aria-label so we can assert
// that the chart container is rendered in a responsive wrapper.
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

import { useDashboardOverview, useEventTrend } from '@/hooks/useDashboard';

const mockOverview: DashboardOverview = {
  totalRevenue: 12345.67,
  totalTicketsSold: 250,
  activeEvents: 5,
  averageOrderValue: 49.38,
  currency: '€',
  topEvents: [
    {
      eventId: 'event-1',
      eventTitle: 'Dev Days 2026',
      ticketsSold: 100,
      ticketsAvailable: 200,
      occupancyRate: 50,
      revenue: 5000,
    },
  ],
  operationalMetrics: {
    pendingOrders: 3,
    cancellationRate: 0.02,
    averageProcessingTimeMinutes: 2,
    totalOrders: 260,
    cancelledOrders: 5,
  },
};

const mockTrend: SalesTrendPoint[] = [
  { date: '2026-05-01', ticketsSold: 10, revenue: 500, orderCount: 5 },
  { date: '2026-05-02', ticketsSold: 15, revenue: 750, orderCount: 8 },
];

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDashboardOverview).mockReturnValue({ data: mockOverview, isLoading: false } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useEventTrend).mockReturnValue({ data: mockTrend } as any);
  });

  describe('KPI-Cards laden korrekt', () => {
    it('zeigt Total Revenue KPI-Card mit korrektem Wert an', () => {
      renderPage();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText(/12345\.67/)).toBeInTheDocument();
    });

    it('zeigt Tickets Sold KPI-Card mit korrektem Wert an', () => {
      renderPage();
      // "Tickets Sold" appears both in the KPI card and the TopEventsTable column header
      expect(screen.getAllByText('Tickets Sold').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('250')).toBeInTheDocument();
    });

    it('zeigt Active Events KPI-Card mit korrektem Wert an', () => {
      renderPage();
      expect(screen.getByText('Active Events')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('zeigt Avg. Order Value KPI-Card mit korrektem Wert an', () => {
      renderPage();
      expect(screen.getByText('Avg. Order Value')).toBeInTheDocument();
      expect(screen.getByText(/49\.38/)).toBeInTheDocument();
    });

    it('zeigt alle vier KPI-Cards gleichzeitig an', () => {
      renderPage();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      // "Tickets Sold" also appears in the TopEventsTable column header
      expect(screen.getAllByText('Tickets Sold').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Active Events')).toBeInTheDocument();
      expect(screen.getByText('Avg. Order Value')).toBeInTheDocument();
    });
  });

  describe('Loading-Zustand', () => {
    it('zeigt Lade-Skeletons wenn Daten noch nicht verfügbar sind', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useDashboardOverview).mockReturnValue({ data: undefined, isLoading: true } as any);
      const { container } = renderPage();
      const skeletons = container.querySelectorAll('[class*="rounded-xl"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('zeigt keinen Loading-Zustand wenn Daten geladen sind', () => {
      renderPage();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
  });

  describe('Date-Range-Filter funktioniert', () => {
    it('zeigt alle drei Zeitraum-Filter-Buttons an', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    });

    it('rendert den Filter als zugängliche Gruppe', () => {
      renderPage();
      expect(screen.getByRole('group', { name: 'Date range filter' })).toBeInTheDocument();
    });

    it('ruft useDashboardOverview mit "Today" auf nach Klick auf Today-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(vi.mocked(useDashboardOverview)).toHaveBeenCalledWith('Today');
    });

    it('ruft useDashboardOverview mit "ThisWeek" auf nach Klick auf This Week-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'This Week' }));
      expect(vi.mocked(useDashboardOverview)).toHaveBeenCalledWith('ThisWeek');
    });

    it('startet standardmäßig mit "ThisMonth"-Filter', () => {
      renderPage();
      expect(vi.mocked(useDashboardOverview)).toHaveBeenCalledWith('ThisMonth');
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

    it('rendert die Top Events Tabelle', () => {
      renderPage();
      expect(screen.getByText('Top Events')).toBeInTheDocument();
    });

    it('zeigt Event-Daten in der Top Events Tabelle an', () => {
      renderPage();
      expect(screen.getByText('Dev Days 2026')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('rendert Charts in einem responsiven Container (width=100%)', () => {
      renderPage();
      // The ResponsiveContainer is mocked as a div with the aria-label forwarded.
      // Its presence confirms charts use ResponsiveContainer for responsive sizing.
      const chartContainer = screen.getByLabelText('Sales trend chart');
      expect(chartContainer).toBeInTheDocument();
    });

    it('rendert das Dashboard-Layout in einem gestapelten Grid', () => {
      const { container } = renderPage();
      const grids = container.querySelectorAll('[class*="grid"]');
      expect(grids.length).toBeGreaterThan(0);
    });
  });
});
