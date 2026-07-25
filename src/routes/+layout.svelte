<script lang="ts">
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/inter/wght-italic.css";

  import favicon from "$lib/assets/favicon.svg";

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
