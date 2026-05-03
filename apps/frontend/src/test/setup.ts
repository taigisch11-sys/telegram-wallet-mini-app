import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 208,
    right: 390,
    width: 390,
    height: 208,
    toJSON: () => {}
  };
};

afterEach(() => {
  cleanup();
  delete window.Telegram;
});
