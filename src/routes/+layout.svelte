<script lang="ts">
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/inter/wght-italic.css";

  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
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
      color-scheme: light dark;

      --black: #000;
      --white: #fff;

      --neutral-25: oklch(99.5% 0 0);
      --neutral-50: oklch(98.5% 0 0);
      --neutral-100: oklch(97% 0 0);
      --neutral-200: oklch(92.2% 0 0);
      --neutral-300: oklch(87% 0 0);
      --neutral-400: oklch(70.8% 0 0);
      --neutral-500: oklch(55.6% 0 0);
      --neutral-600: oklch(43.9% 0 0);
      --neutral-700: oklch(37.1% 0 0);
      --neutral-800: oklch(26.9% 0 0);
      --neutral-900: oklch(20.5% 0 0);
      --neutral-950: oklch(14.5% 0 0);

      --blue-50: oklch(97% 0.014 254.604);
      --blue-100: oklch(93.2% 0.032 255.585);
      --blue-200: oklch(88.2% 0.059 254.128);
      --blue-300: oklch(80.9% 0.105 251.813);
      --blue-400: oklch(70.7% 0.165 254.624);
      --blue-500: oklch(62.3% 0.214 259.815);
      --blue-600: oklch(54.6% 0.245 262.881);
      --blue-700: oklch(48.8% 0.243 264.376);
      --blue-800: oklch(42.4% 0.199 265.638);
      --blue-900: oklch(37.9% 0.146 265.522);
      --blue-950: oklch(28.2% 0.091 267.935);

      --red-50: oklch(97.1% 0.013 17.38);
      --red-100: oklch(93.6% 0.032 17.717);
      --red-200: oklch(88.5% 0.062 18.334);
      --red-300: oklch(80.8% 0.114 19.571);
      --red-400: oklch(70.4% 0.191 22.216);
      --red-500: oklch(63.7% 0.237 25.331);
      --red-600: oklch(57.7% 0.245 27.325);
      --red-700: oklch(50.5% 0.213 27.518);
      --red-800: oklch(44.4% 0.177 26.899);
      --red-900: oklch(39.6% 0.141 25.723);
      --red-950: oklch(25.8% 0.092 26.042);

      --accent: var(--blue-500);
      --accent-hover: var(--blue-400);

      --danger: var(--red-500);

      --canvas: var(--neutral-50);

      --surface: var(--neutral-25);

      --border: var(--neutral-50);
      --border-strong: var(--neutral-100);

      --text: var(--neutral-900);
      --text-muted: var(--neutral-500);

      --text-scale: 0.6875rem;

      --heading-size: var(--text-scale);
      --heading-weight: 500;
      --heading-letter-spacing: 0.0125em;
      --heading-line-height: 1.5;

      --text-size: var(--text-scale);
      --tet-weight: 400;
      --text-letter-spacing: 0.0125em;
      --text-line-height: 1.5;

      --padding: var(--text-size);
      --gap: var(--text-size);

      --radius: var(--text-size);
      --shadow: 0 2px 4px 0 hsl(0 0 0 / 0.05);
    }

    .padding {
      padding: var(--padding);
    }

    .heading {
      font-weight: var(--heading-weight);
      font-size: var(--heading-size);
      letter-spacing: var(--heading-letter-spacing);
      line-height: var(--heading-line-height);
      text-box: trim-both cap alphabetic;
    }

    .text {
      font-weight: var(--text-weight);
      font-size: var(--text-size);
      letter-spacing: var(--text-letter-spacing);
      line-height: var(--text-line-height);
      text-box: trim-both cap alphabetic;
    }

    html {
      font-family: "Inter Variable", system-ui;

      overflow: hidden; /* lock document scrolling for the app canvas */

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
