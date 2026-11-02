import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Next resolves "@/..." from tsconfig paths; Vitest does not read that file,
  // so without this alias any test importing app code the way the app imports
  // it fails with "Cannot find package '@/...'".
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Node 22 provides File and crypto.subtle, so the pure logic needs no DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
