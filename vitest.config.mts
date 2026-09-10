import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node 22 provides File and crypto.subtle, so the pure logic needs no DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
