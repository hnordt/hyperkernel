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
