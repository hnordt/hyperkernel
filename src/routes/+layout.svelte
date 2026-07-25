<script lang="ts">
  import "@fontsource/geist/100.css";
  import "@fontsource/geist/200.css";
  import "@fontsource/geist/300.css";
  import "@fontsource/geist/400.css";
  import "@fontsource/geist/500.css";
  import "@fontsource/geist/600.css";
  import "@fontsource/geist/700.css";
  import "@fontsource/geist/800.css";
  import "@fontsource/geist/900.css";

  import favicon from "$lib/assets/favicon.svg";

  import "@tailwindplus/elements";
  import "./layout.css";

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
