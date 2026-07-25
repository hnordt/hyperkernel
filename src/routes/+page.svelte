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
  class="theme-preview"
  style:--color-x-canvas={theme.canvas}
  style:--color-x-surface={theme.surface}
  style:--color-x-text={theme.text}
  style:--spacing-x-surface={`${theme.spacing / 16}rem`}
  style:--radius-x-surface={`${theme.radius / 16}rem`}
  style:--radius-x-control={`${Math.min(theme.radius, 10) / 16}rem`}
  style:--theme-surface-shadow={surfaceShadow}
>
  <div class="safe-area">
    <section class="documents-surface">
      <header>
        <h2>Documents</h2>
      </header>

      <div class="documents-empty">No documents found</div>
    </section>

    <div class="theme-controls">
      {#if isThemeOpen}
        <form id="theme-config" class="theme-form">
          <header class="form-header">
            <h2>Theme</h2>
            <button type="button" class="reset-button" onclick={resetTheme}>
              Reset
              <span class="touch-target" aria-hidden="true"></span>
            </button>
          </header>

          <fieldset class="color-fields">
            <legend class="visually-hidden">Colors</legend>

            <label for="theme-canvas">
              Canvas
              <input
                id="theme-canvas"
                name="canvas"
                type="color"
                bind:value={theme.canvas}
                oninput={saveTheme}
              />
            </label>

            <label for="theme-surface">
              Surface
              <input
                id="theme-surface"
                name="surface"
                type="color"
                bind:value={theme.surface}
                oninput={saveTheme}
              />
            </label>

            <label for="theme-text">
              Text
              <input
                id="theme-text"
                name="text"
                type="color"
                bind:value={theme.text}
                oninput={saveTheme}
              />
            </label>
          </fieldset>

          <div class="range-fields">
            <div class="range-field">
              <div class="range-header">
                <label for="theme-spacing">Spacing</label>
                <div class="range-value">{theme.spacing}px</div>
              </div>
              <input
                id="theme-spacing"
                name="spacing"
                type="range"
                min="8"
                max="24"
                step="1"
                bind:value={theme.spacing}
                oninput={saveTheme}
              />
            </div>

            <div class="range-field">
              <div class="range-header">
                <label for="theme-radius">Radius</label>
                <div class="range-value">{theme.radius}px</div>
              </div>
              <input
                id="theme-radius"
                name="radius"
                type="range"
                min="0"
                max="24"
                step="1"
                bind:value={theme.radius}
                oninput={saveTheme}
              />
            </div>

            <div class="range-field">
              <div class="range-header">
                <label for="theme-elevation">Elevation</label>
                <div class="range-value">{theme.elevation}px</div>
              </div>
              <input
                id="theme-elevation"
                name="elevation"
                type="range"
                min="0"
                max="16"
                step="1"
                bind:value={theme.elevation}
                oninput={saveTheme}
              />
            </div>
          </div>
        </form>
      {/if}

      <button
        type="button"
        class="theme-toggle"
        aria-controls="theme-config"
        aria-expanded={isThemeOpen}
        onclick={() => (isThemeOpen = !isThemeOpen)}
      >
        {isThemeOpen ? "Done" : "Theme"}
        <span class="touch-target" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</div>

<style>
  .theme-preview {
    position: fixed;
    inset: 0;
    isolation: isolate;
    height: 100dvh;
    color: var(--color-x-text);
    background: var(--color-x-canvas);
  }

  .safe-area {
    position: relative;
    height: 100%;
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
  }

  .documents-surface {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 16rem;
    height: 16rem;
    margin: 0;
    background: var(--color-x-surface);
    border: 1px solid color-mix(in srgb, var(--color-x-text) 4%, transparent);
    border-radius: var(--radius-x-surface);
    box-shadow: var(--theme-surface-shadow);
  }

  .documents-surface header {
    padding: var(--spacing-x-surface);
    border-bottom: 1px solid
      color-mix(in srgb, var(--color-x-text) 6%, transparent);
  }

  .documents-surface h2 {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 500;
    line-height: 1rem;
    letter-spacing: 0.0125em;
  }

  .documents-empty {
    padding: var(--spacing-x-surface);
    font-size: 0.6875rem;
    line-height: 1rem;
    letter-spacing: 0.0125em;
  }

  .theme-controls {
    position: fixed;
    right: 1rem;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 1rem;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .theme-form {
    width: 100%;
    padding: 1rem;
    background: var(--color-x-surface);
    border: 0;
    border-radius: var(--radius-x-surface);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--color-x-text) 10%, transparent),
      0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
  }

  .form-header,
  .range-header {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .form-header h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
  }

  button {
    position: relative;
    border: 0;
  }

  button:focus-visible {
    outline: 2px solid #2b7fff;
    outline-offset: 2px;
  }

  .reset-button {
    padding: 0.375rem 0.5rem;
    color: color-mix(in srgb, var(--color-x-text) 60%, transparent);
    font-size: 1rem;
    line-height: 1.5rem;
    background: transparent;
    border-radius: var(--radius-x-control);
  }

  .touch-target {
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, 3rem);
    height: max(100%, 3rem);
    translate: -50% -50%;
  }

  .color-fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    min-width: 0;
    margin: 1rem 0 0;
    padding: 0;
    border: 0;
  }

  .color-fields label {
    display: grid;
    gap: 0.5rem;
    font-size: 1rem;
    line-height: 1.5rem;
  }

  .color-fields input {
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: var(--radius-x-control);
  }

  .range-fields {
    display: grid;
    gap: 1rem;
    margin-top: 1.25rem;
  }

  .range-field {
    display: grid;
    gap: 0.5rem;
  }

  .range-header label,
  .range-value {
    font-size: 1rem;
    line-height: 1.5rem;
  }

  .range-value {
    color: color-mix(in srgb, var(--color-x-text) 60%, transparent);
    font-variant-numeric: tabular-nums;
  }

  input[type="range"] {
    width: 100%;
    margin: 0;
    accent-color: var(--color-x-text);
  }

  .theme-toggle {
    padding: 0.5rem 0.75rem;
    color: var(--color-x-text);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
    background: var(--color-x-surface);
    border-radius: var(--radius-x-control);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--color-x-text) 10%, transparent),
      0 20px 25px -5px rgb(0 0 0 / 0.1),
      0 8px 10px -6px rgb(0 0 0 / 0.1);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    border: 0;
    clip: rect(0, 0, 0, 0);
  }

  @media (pointer: fine) {
    .touch-target {
      display: none;
    }
  }

  @media (min-width: 40rem) {
    .documents-surface {
      top: 2rem;
      left: 2rem;
    }

    .theme-controls {
      left: auto;
      width: 18rem;
    }

    .form-header h2,
    .reset-button,
    .color-fields label,
    .range-header label,
    .range-value,
    .theme-toggle {
      font-size: 0.875rem;
      line-height: 1.25rem;
    }

    .color-fields input {
      width: 2rem;
      height: 2rem;
    }
  }
</style>
