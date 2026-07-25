<script lang="ts">
  import { onMount } from "svelte";
  import { z } from "zod";

  const themeSchema = z.object({
    canvas: z.string().regex(/^#[0-9a-f]{6}$/i),
    surface: z.string().regex(/^#[0-9a-f]{6}$/i),
    text: z.string().regex(/^#[0-9a-f]{6}$/i),
    spacing: z.number().int().min(8).max(24),
    radius: z.number().int().min(0).max(24),
    elevation: z.number().int().min(0).max(16),
  });

  type Theme = z.infer<typeof themeSchema>;

  const themeStorageKey = "hyperkernel-theme";

  const defaultTheme: Theme = {
    canvas: "#fafafa",
    surface: "#ffffff",
    text: "#0a0a0a",
    spacing: 12,
    radius: 10,
    elevation: 4,
  };

  let theme = $state<Theme>({ ...defaultTheme });
  let isThemeOpen = $state(true);

  let surfaceShadow = $derived(
    theme.elevation === 0
      ? "none"
      : `0 ${theme.elevation}px ${theme.elevation}px rgb(0 0 0 / 0.03)`,
  );

  onMount(() => {
    try {
      const storedTheme = localStorage.getItem(themeStorageKey);

      if (storedTheme) {
        const result = themeSchema.safeParse(JSON.parse(storedTheme));

        if (result.success) {
          theme = result.data;
        }
      }
    } catch {
      // Keep using the defaults when storage is unavailable or malformed.
    }
  });

  function saveTheme() {
    try {
      localStorage.setItem(themeStorageKey, JSON.stringify(theme));
    } catch {
      // Theme controls still work for the current session when storage is unavailable.
    }
  }

  function resetTheme() {
    theme = { ...defaultTheme };
    saveTheme();
  }
</script>

<svelte:head>
  <title>Hyperkernel theme preview</title>
</svelte:head>

<div
  class="fixed inset-0 isolate h-dvh bg-x-canvas text-x-text"
  style:--color-x-canvas={theme.canvas}
  style:--color-x-surface={theme.surface}
  style:--color-x-text={theme.text}
  style:--spacing-x-surface={`${theme.spacing / 16}rem`}
  style:--radius-x-surface={`${theme.radius / 16}rem`}
  style:--radius-x-control={`${Math.min(theme.radius, 10) / 16}rem`}
  style:--theme-surface-shadow={surfaceShadow}
>
  <div
    class="relative h-full pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
  >
    <section
      class="absolute top-4 left-4 size-64 rounded-x-surface border border-x-surface bg-x-surface [box-shadow:var(--theme-surface-shadow)] sm:top-8 sm:left-8"
    >
      <header class="border-b border-x-surface-separator p-x-surface">
        <h2 class="text-x-heading">Documents</h2>
      </header>

      <div class="p-x-surface text-x-body">No documents found</div>
    </section>

    <div
      class="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:w-72"
    >
      {#if isThemeOpen}
        <form
          id="theme-config"
          class="w-full rounded-x-surface bg-x-surface p-4 shadow-xl ring-1 ring-x-text/10"
        >
          <header class="flex items-center justify-between gap-4">
            <h2 class="text-base font-medium sm:text-sm">Theme</h2>
            <button
              type="button"
              class="relative rounded-x-control px-2 py-1.5 text-base text-x-text/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:text-sm"
              onclick={resetTheme}
            >
              Reset
              <span
                class="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
                aria-hidden="true"
              ></span>
            </button>
          </header>

          <fieldset class="mt-4 grid grid-cols-3 gap-3">
            <legend class="sr-only">Colors</legend>

            <label class="grid gap-2 text-base sm:text-sm" for="theme-canvas">
              Canvas
              <input
                id="theme-canvas"
                name="canvas"
                type="color"
                class="size-10 cursor-pointer rounded-x-control border-0 bg-transparent p-0 sm:size-8"
                bind:value={theme.canvas}
                oninput={saveTheme}
              />
            </label>

            <label class="grid gap-2 text-base sm:text-sm" for="theme-surface">
              Surface
              <input
                id="theme-surface"
                name="surface"
                type="color"
                class="size-10 cursor-pointer rounded-x-control border-0 bg-transparent p-0 sm:size-8"
                bind:value={theme.surface}
                oninput={saveTheme}
              />
            </label>

            <label class="grid gap-2 text-base sm:text-sm" for="theme-text">
              Text
              <input
                id="theme-text"
                name="text"
                type="color"
                class="size-10 cursor-pointer rounded-x-control border-0 bg-transparent p-0 sm:size-8"
                bind:value={theme.text}
                oninput={saveTheme}
              />
            </label>
          </fieldset>

          <div class="mt-5 grid gap-4">
            <div class="grid gap-2">
              <div class="flex justify-between gap-4">
                <label class="text-base sm:text-sm" for="theme-spacing"
                  >Spacing</label
                >
                <div class="text-base text-x-text/60 tabular-nums sm:text-sm">
                  {theme.spacing}px
                </div>
              </div>
              <input
                id="theme-spacing"
                name="spacing"
                type="range"
                min="8"
                max="24"
                step="1"
                class="w-full [accent-color:var(--color-x-text)]"
                bind:value={theme.spacing}
                oninput={saveTheme}
              />
            </div>

            <div class="grid gap-2">
              <div class="flex justify-between gap-4">
                <label class="text-base sm:text-sm" for="theme-radius"
                  >Radius</label
                >
                <div class="text-base text-x-text/60 tabular-nums sm:text-sm">
                  {theme.radius}px
                </div>
              </div>
              <input
                id="theme-radius"
                name="radius"
                type="range"
                min="0"
                max="24"
                step="1"
                class="w-full [accent-color:var(--color-x-text)]"
                bind:value={theme.radius}
                oninput={saveTheme}
              />
            </div>

            <div class="grid gap-2">
              <div class="flex justify-between gap-4">
                <label class="text-base sm:text-sm" for="theme-elevation"
                  >Elevation</label
                >
                <div class="text-base text-x-text/60 tabular-nums sm:text-sm">
                  {theme.elevation}px
                </div>
              </div>
              <input
                id="theme-elevation"
                name="elevation"
                type="range"
                min="0"
                max="16"
                step="1"
                class="w-full [accent-color:var(--color-x-text)]"
                bind:value={theme.elevation}
                oninput={saveTheme}
              />
            </div>
          </div>
        </form>
      {/if}

      <button
        type="button"
        class="relative rounded-x-control bg-x-surface px-3 py-2 text-base font-medium shadow-xl ring-1 ring-x-text/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:text-sm"
        aria-controls="theme-config"
        aria-expanded={isThemeOpen}
        onclick={() => (isThemeOpen = !isThemeOpen)}
      >
        {isThemeOpen ? "Done" : "Theme"}
        <span
          class="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
          aria-hidden="true"
        ></span>
      </button>
    </div>
  </div>
</div>
