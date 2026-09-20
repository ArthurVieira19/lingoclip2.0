import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Pure-logic test files run under the "node" environment (no DOM at all), so
// only unmount when a DOM is actually present — otherwise this is a no-op.
afterEach(() => {
  if (typeof document !== "undefined") {
    cleanup()
  }
})
