// src/setupTests.js
import "@testing-library/jest-dom";

// --- Polyfill ResizeObserver (Radix dùng) ---
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// gán cho cả global và window (phòng lib đọc ở đâu)
global.ResizeObserver = global.ResizeObserver || MockResizeObserver;
window.ResizeObserver = window.ResizeObserver || MockResizeObserver;

// --- matchMedia (một số component check media queries) ---
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),            // deprecated nhưng vài lib vẫn gọi
    removeListener: jest.fn(),         // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// --- scrollIntoView hay bị gọi trong UI ---
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = jest.fn();
}

// --- DOMRect (một số lib đọc) ---
if (!global.DOMRect) {
  global.DOMRect = class DOMRect {
    constructor(x = 0, y = 0, width = 0, height = 0) {
      this.x = x; this.y = y; this.width = width; this.height = height;
      this.top = y; this.left = x; this.right = x + width; this.bottom = y + height;
    }
    static fromRect(r = {}) {
      return new DOMRect(r.x || 0, r.y || 0, r.width || 0, r.height || 0);
    }
    toJSON() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
  };
}

// --- window.open (bạn dùng trong toast) ---
if (!window.open) {
  window.open = jest.fn();
}

// --- Mock getComputedStyle for Ant Design (rc-util) ---
if (!window.getComputedStyle) {
  window.getComputedStyle = jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
    width: '0px',
    height: '0px',
  }));
}
