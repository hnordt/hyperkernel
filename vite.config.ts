import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import adapter from "@sveltejs/adapter-node";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      experimental: {
        remoteFunctions: true,
      },
      typescript: {
        config: (config) => ({
          ...config,
          include: [...config.include, "../drizzle.config.ts"],
        }),
      },
      compilerOptions: {
        experimental: {
          async: true,
        },
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
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
          include: ["src/**/*.svelte.{test,spec}.ts"],
          exclude: ["src/lib/server/**"],
        },
      },
      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.ts"],
          exclude: ["src/**/*.svelte.{test,spec}.ts"],
        },
      },
    ],
  },
});
