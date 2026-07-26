<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    level: 2;
    children: Snippet;
  };

  let { level, children }: Props = $props();
</script>

{#if level === 2}
  <h2>{@render children()}</h2>
{/if}

<style>
  h2 {
    font-family: var(--font-family);
    font-size: var(--heading-size);
    font-weight: var(--heading-weight);
    text-box: trim-both cap alphabetic;
  }
</style>
