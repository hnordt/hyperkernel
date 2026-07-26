<script lang="ts">
  let { children } = $props();
</script>

<p>{@render children()}</p>

<style>
  p {
    font-family: var(--font-family);
    font-size: var(--text-size);
    font-weight: var(--text-weight);
    text-box: trim-both cap alphabetic;
  }
</style>
