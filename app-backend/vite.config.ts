import { defineConfig } from "vitest/config";
import { VitePluginNode } from "vite-plugin-node";

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  server: {
    strictPort: true,
    port: 3000,
  },
  optimizeDeps: {
    exclude: ['fsevents'],
    include: ['ioredis']
  },
  plugins: [
    VitePluginNode({
      adapter: "express",
      appPath: "./src/index.ts",
    }),
  ],
  build: {
    emptyOutDir: true,
    target: "node18.17.1",
    rollupOptions: {
      external: ['ioredis'],
      output: {
        globals: {
          'ioredis': 'ioredis'
        }
      }
    }
  },
  test: {
    globals: true,
    cache: false,
    threads: false,
    coverage: {
      // TODO uncoment in future
      // lines: 100,
      // branches: 100,
      // functions: 100,
      // statements: 100,
      provider: "v8",
      reporter: ["text", "html", "json", "json-summary", "lcov"],
    },
    // Some tests are flaky due to comunication to external APIs.
    // In order to escape nightmare in CI/CD pipelines we will retrigger and rerun.
    // Retry the test specific number of times if it fails.
    retry: 5,
    globalSetup: ["server/tests/globalSetup/startUp.ts"],

  },
});
