<script lang="ts">
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/inter/wght-italic.css";

  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <title>Hyperkernel</title>
  <meta
    name="description"
    content="A self-hostable, extensible business platform for building and running modular applications in modern web browsers."
  />
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global {
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    *:not(dialog) {
      margin: 0;
    }

    :root {
      /* Tokens: conceptual hierarchy
      Authored anchors: canvas · ink · accent · on-accent · danger
      ↓
      Semantic tokens: surface · text-muted · border · primary-hover · danger-soft
      ↓
      Component tokens: button-bg · input-border · selected-row-bg */

      --canvas: oklch(98% 0.005 260); /* main background */
      --ink: oklch(18% 0.01 260); /* text, icons, strong strokes */
      --accent: oklch(62% 0.18 250); /* actions, selection, focus */
      --danger: oklch(58% 0.2 25); /* destructive/error semantics */

      --accent-soft: color-mix(in oklch, var(--accent) 12%, var(--canvas));

      --accent-hover: color-mix(in oklch, var(--accent) 88%, var(--ink));

      --surface: color-mix(in oklch, var(--ink) 3%, var(--canvas));
      --surface-hover: color-mix(in oklch, var(--ink) 6%, var(--canvas));

      --border: color-mix(in oklch, var(--ink) 14%, var(--canvas));
      --border-strong: color-mix(in oklch, var(--ink) 25%, var(--canvas));

      --text: var(--ink);
      --text-muted: color-mix(in oklch, var(--ink) 65%, var(--canvas));
    }

    html {
      font-family: "Inter Variable", system-ui;

      /* Lock document scrolling for the application canvas */
      overflow: hidden;

      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    picture,
    img,
    svg,
    canvas,
    video {
      display: block;
      max-inline-size: 100%;
    }

    input,
    textarea,
    select,
    button {
      font: inherit;
    }
  }
</style>
