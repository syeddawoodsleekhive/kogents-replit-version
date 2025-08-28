// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import { jest } from "@jest/globals";
import "@testing-library/jest-dom";

// Mock the window.matchMedia function
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

window.IntersectionObserver = MockIntersectionObserver;

// Suppress specific console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Warning: ReactDOM.render is no longer supported") ||
      args[0].includes("Warning: React.createFactory()") ||
      args[0].includes("Warning: Using UNSAFE_"))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Polyfill fetch for Node.js test environment
if (typeof global.fetch === 'undefined') {
  // Use the CommonJS version for Jest compatibility
  global.fetch = (...args) =>
    import('node-fetch').then(mod => mod.default(...args));
}
