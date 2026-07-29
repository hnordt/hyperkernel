import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-auto";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [
    sveltekit({
      experimental: {
        remoteFunctions: true,
      },
      compilerOptions: {
        experimental: {
          async: true,
        },
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      adapter: adapter(),
    }),
  ],
  test: {
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            provider: playwright(),
            instances: [
              {
                browser: "chromium",
                headless: true,
              },
            ],
            enabled: true,
          },
          include: [
            "src/**/*.svelte.{test,spec}.ts",
            "../../packages/ui/src/**/*.svelte.{test,spec}.ts",
          ],
          exclude: ["src/lib/server/**"],
        },
      },
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: [
            "src/**/*.{test,spec}.ts",
            "../../packages/sqlite/src/**/*.{test,spec}.ts",
          ],
          exclude: ["**/*.svelte.{test,spec}.ts"],
        },
      },
    ],
  },
});
