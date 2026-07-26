<script lang="ts">
  import "@fontsource-variable/inter/wght.css";
  import "@fontsource-variable/inter/wght-italic.css";

  import favicon from "$lib/assets/favicon.svg";

  import Theme from "$lib/components/Theme.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Theme />

{@render children()}
