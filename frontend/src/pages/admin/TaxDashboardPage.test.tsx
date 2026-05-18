import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaxDashboardPage from '@/pages/admin/TaxDashboardPage';
import type { TaxSummaryEntry } from '@/types/dashboard';

vi.mock('@/lib/telemetry', () => ({
  withSpan: (_name: string, fn: (span: unknown) => Promise<unknown>) => fn({}),
  initTelemetry: vi.fn(),
  trackPageView: vi.fn(),
  getTracer: vi.fn(),
  startSpan: vi.fn(() => ({ end: vi.fn(), setAttribute: vi.fn(), setStatus: vi.fn(), recordException: vi.fn() })),
}));

vi.mock('@/hooks/useDashboard');

import { useTaxSummary } from '@/hooks/useDashboard';

const mockTaxSummary: TaxSummaryEntry[] = [
  { taxRatePercentage: 19, taxRateName: 'Standard', netAmount: 840.34, taxAmount: 159.66, grossAmount: 1000 },
  { taxRatePercentage: 7, taxRateName: 'Ermäßigt', netAmount: 186.92, taxAmount: 13.08, grossAmount: 200 },
];

// We capture the URL created for download link assertions without executing the actual fetch
const createObjectURLMock = vi.fn(() => 'blob:mock-url');
const revokeObjectURLMock = vi.fn();

// Preserve the URL constructor — only stub the static blob methods
Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: createObjectURLMock });
Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: revokeObjectURLMock });

// Mock fetch globally so any test that clicks "Export CSV" doesn't cause an
// unhandled rejection when the handler tries to fetch a relative URL in Node.
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['csv-content'], { type: 'text/csv' })),
  ok: true,
} as unknown as Response);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TaxDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaxDashboardPage', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useTaxSummary).mockReturnValue({ data: mockTaxSummary, isLoading: false } as any);
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
  });

  describe('Steuer-Tabelle rendert korrekt', () => {
    it('zeigt die Seitenüberschrift an', () => {
      renderPage();
      expect(screen.getByText('Tax Dashboard')).toBeInTheDocument();
    });

    it('zeigt die Steuersätze in der Tabelle an', () => {
      renderPage();
      expect(screen.getByText('Standard (19%)')).toBeInTheDocument();
      expect(screen.getByText('Ermäßigt (7%)')).toBeInTheDocument();
    });

    it('zeigt korrekte Nettobeträge an', () => {
      renderPage();
      expect(screen.getByText('840.34 €')).toBeInTheDocument();
      expect(screen.getByText('186.92 €')).toBeInTheDocument();
    });

    it('zeigt korrekte Steuerbeträge an', () => {
      renderPage();
      expect(screen.getByText('159.66 €')).toBeInTheDocument();
      expect(screen.getByText('13.08 €')).toBeInTheDocument();
    });

    it('zeigt korrekte Bruttobeträge an', () => {
      renderPage();
      expect(screen.getByText('1000.00 €')).toBeInTheDocument();
      expect(screen.getByText('200.00 €')).toBeInTheDocument();
    });

    it('zeigt die Gesamtzeile mit summierten Werten an', () => {
      renderPage();
      expect(screen.getByText('Total')).toBeInTheDocument();
      // totalNet = 840.34 + 186.92 = 1027.26
      expect(screen.getByText('1027.26 €')).toBeInTheDocument();
      // totalTax = 159.66 + 13.08 = 172.74
      expect(screen.getByText('172.74 €')).toBeInTheDocument();
      // totalGross = 1000 + 200 = 1200
      expect(screen.getByText('1200.00 €')).toBeInTheDocument();
    });

    it('zeigt die Tabellenspaltenüberschriften an', () => {
      renderPage();
      expect(screen.getByText('Tax Rate')).toBeInTheDocument();
      expect(screen.getByText('Net')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Gross')).toBeInTheDocument();
    });
  });

  describe('Loading-Zustand', () => {
    it('zeigt Lade-Meldung wenn Daten laden', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(useTaxSummary).mockReturnValue({ data: undefined, isLoading: true } as any);
      renderPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('zeigt keinen Loading-Zustand wenn Daten geladen sind', () => {
      renderPage();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('CSV-Export-Button auslösbar', () => {
    it('zeigt den Export CSV Button an', () => {
      renderPage();
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    it('CSV-Export-Button ist klickbar', () => {
      renderPage();
      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      expect(exportButton).not.toBeDisabled();
      fireEvent.click(exportButton);
    });

    it('CSV-Export-Button löst Download-Mechanismus aus', async () => {
      renderPage();
      const exportButton = screen.getByRole('button', { name: /Export CSV/i });
      fireEvent.click(exportButton);

      // Allow the async export handler to complete
      await vi.waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Date-Range-Filter funktioniert', () => {
    it('zeigt alle drei Zeitraum-Filter-Buttons an', () => {
      renderPage();
      expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Week' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'This Month' })).toBeInTheDocument();
    });

    it('ruft useTaxSummary mit "Today" auf nach Klick auf Today-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
      expect(vi.mocked(useTaxSummary)).toHaveBeenCalledWith('Today');
    });

    it('ruft useTaxSummary mit "ThisWeek" auf nach Klick auf This Week-Button', () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'This Week' }));
      expect(vi.mocked(useTaxSummary)).toHaveBeenCalledWith('ThisWeek');
    });

    it('startet standardmäßig mit "ThisMonth"-Filter', () => {
      renderPage();
      expect(vi.mocked(useTaxSummary)).toHaveBeenCalledWith('ThisMonth');
    });

    it('rendert den Filter als zugängliche Gruppe', () => {
      renderPage();
      expect(screen.getByRole('group', { name: 'Date range filter' })).toBeInTheDocument();
    });
  });
});
