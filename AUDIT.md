# Audit: Task 6 – Admin Dashboard, KPIs & Datenexport

**Datum:** 2026-05-18  
**Aufgabe:** Task 6 – Admin Dashboard, KPIs & Datenexport  
**Grundlage:** `docs/attendee-tasks/task-6-admin-dashboard-kpis.md`

---

## Ergebnis: 13 ✅ / 1 ⚠️ / 1 ❌ (von 15 Kriterien)

| # | Akzeptanzkriterium | Status | Evidenz / Befund |
|---|---|:---:|---|
| 1 | Dashboard-Übersicht zeigt alle KPIs korrekt | ✅ | `AdminDashboardPage.tsx`: 4 KPI-Cards (Gesamtumsatz, Verkaufte Tickets, Aktive Events, Ø Bestellwert) via `GET /api/v1/dashboard/overview` |
| 2 | Verkaufstrend als Chart dargestellt | ✅ | `SalesTrendChart.tsx` (Recharts `LineChart`) in Admin- und Event-Dashboard |
| 3 | Auslastung pro Event sichtbar | ✅ | `OccupancyChart.tsx` (`BarChart`) + Backend-Endpoint `GET /dashboard/events/{id}/occupancy` |
| 4 | Event-spezifisches Dashboard funktioniert | ✅ | `EventDashboardPage.tsx` mit KPI-Cards, PieChart, Trend-Chart und Occupancy-Chart |
| 5 | Steuer-Zusammenfassung für Buchhaltung verfügbar | ✅ | `TaxDashboardPage.tsx` mit `TaxSummaryTable` + CSV-Export-Button; Endpoint `GET /dashboard/tax-summary` |
| 6 | Zeitraum-Filter funktioniert | ✅ | `DateRangePicker.tsx` in allen Dashboard-Seiten; Backend akzeptiert `preset`, `from`, `to` |
| 7 | Responsive Design für alle Charts | ✅ | Alle Charts nutzen Recharts `ResponsiveContainer` mit `width="100%"` |
| 8 | OpenTelemetry Custom Metrics werden emittiert | ⚠️ | `order.created` Counter vorhanden; **fehlend:** `ticket.sold`, `order.amount`-Histogram, `checkout.started`/`checkout.completed` (siehe Detailanalyse) |
| 9 | CSV-Export: Teilnehmerliste mit Check-in-Status | ✅ | `CsvExportService.ExportAttendeesAsync()`: Name, E-Mail, Ticket-Typ, Bestellcode, Datum, Check-in-Status |
| 10 | CSV-Export: Bestellübersicht mit Zahlungsstatus | ✅ | `CsvExportService.ExportOrdersAsync()` mit Status-Filter implementiert |
| 11 | CSV-Export: Steuerbericht gruppiert nach Steuersatz | ✅ | `CsvExportService.ExportTaxReportAsync()` gruppiert nach Steuersatz |
| 12 | Unit Tests für MetricsService Berechnungen | ✅ | `MetricsServiceTests.cs` vorhanden und Tests implementiert |
| 13 | Unit Tests für CSV-Export Formatierung | ✅ | `CsvExportServiceTests.cs` vorhanden (BOM, Header, Escaping, Formatierung) |
| 14 | E2E Test für Dashboard-Seite | ❌ | Kein Playwright-Setup (`playwright.config.ts`) und keine Dashboard-E2E-Tests vorhanden |
| 15 | Frontend-Telemetry: Custom Spans + Page Views | ✅ | `withSpan("dashboard.loadMetrics")` in `useDashboard.ts`, `withSpan("dashboard.exportCsv")` in Export-Seiten, `trackPageView()` in Layouts |

---

## Detailanalyse der Mängel

### ⚠️ Kriterium 8: OpenTelemetry Custom Metrics (teilweise erfüllt)

**Vorhanden:**
- `order.created` Counter in `src/DevConfTicketing.Application/Orders/CreateOrderHandler.cs`
- Infrastruktur-Metriken: `db.cosmos.duration` (Histogram), `db.cosmos.operations` (Counter), `http.requests`, `http.errors`

**Fehlend** (gemäß Aufgabenstellung):

```csharp
// 1. ticket.sold – Counter pro verkauftem Ticket
telemetry.IncrementCounter("ticket.sold", tags: new Dictionary<string, string>
{
    { "event.id", eventId },
    { "ticketType.id", ticketTypeId },
    { "amount", quantity.ToString() }
});

// 2. order.amount – Histogram für Bestellwert-Verteilung
telemetry.RecordHistogram("order.amount", order.TotalAmount);

// 3. checkout.started / checkout.completed – Funnel-Metriken
telemetry.IncrementCounter("checkout.started");
telemetry.IncrementCounter("checkout.completed");
```

**Ort der Ergänzung:** `src/DevConfTicketing.Application/Orders/CreateOrderHandler.cs`

---

### ❌ Kriterium 14: E2E Test für Dashboard-Seite (nicht vorhanden)

**Befund:**
- Kein E2E-Verzeichnis (`e2e/`, `tests/e2e/`, o. Ä.)
- Kein `playwright.config.ts` und keine Playwright-Abhängigkeit in `frontend/package.json`
- Keine Test-Datei für Dashboard-Seite

**Erforderliche Maßnahmen:**
1. Playwright installieren und konfigurieren (`playwright.config.ts`)
2. Testdatei `e2e/dashboard.spec.ts` erstellen mit:
   - KPI-Cards laden korrekt
   - Charts werden gerendert
   - Date-Range-Filter funktioniert
   - CSV-Export-Button auslösbar
   - Responsive-Verhalten (Viewport-Tests)

---

## Zusammenfassung

| Kategorie | Anzahl | Anteil |
|---|:---:|:---:|
| ✅ Vollständig erfüllt | 13 | 86,7 % |
| ⚠️ Teilweise erfüllt | 1 | 6,7 % |
| ❌ Nicht erfüllt | 1 | 6,7 % |
| **Gesamt** | **15** | **100 %** |

### Empfohlene nächste Schritte

1. **Quick-Fix (~15 Min.):** 3 fehlende OpenTelemetry-Metriken in `CreateOrderHandler.cs` ergänzen
2. **Standardaufwand (~2–3 Std.):** Playwright E2E-Test-Suite aufsetzen und Dashboard-Tests schreiben
