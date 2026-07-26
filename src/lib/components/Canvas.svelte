<script lang="ts">
  let { children } = $props();
</script>

<main>
  <div>
    {@render children()}
  </div>
</main>

<style>
  /* Lock document scrolling */
  :global(html) {
    overflow: hidden;
  }

  main {
    background: var(--canvas);
    color: var(--text);

    position: fixed;
    inset: 0;
    isolation: isolate;

    height: 100dvh;

    > div {
      position: relative;

      height: 100%;

      padding-top: env(safe-area-inset-top);
      padding-right: env(safe-area-inset-right);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
    }
  }
</style>
