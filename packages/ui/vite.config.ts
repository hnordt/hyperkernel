import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for package sources. This can be removed in Svelte 6.
        runes: true,
      },
    }),
  ],
});
