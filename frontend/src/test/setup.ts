import '@testing-library/jest-dom/vitest'

// Recharts uses ResizeObserver to measure container dimensions.
// jsdom does not implement it, so we provide a no-op stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverStub,
});
