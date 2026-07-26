<script lang="ts">
  let { children } = $props();
</script>

<div>
  <main>
    {@render children()}
  </main>
</div>

<style>
  div :global {
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }
  }

  div {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    background: var(--canvas);
    color: var(--text);

    position: fixed;
    inset: 0;
    isolation: isolate;

    height: 100dvh;

    > main {
      position: relative;

      height: 100%;

      padding-top: env(safe-area-inset-top);
      padding-right: env(safe-area-inset-right);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
    }
  }
</style>
