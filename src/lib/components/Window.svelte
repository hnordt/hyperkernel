<script lang="ts">
  import type { Snippet } from "svelte";

  import Heading from "$lib/components/Heading.svelte";

  type Props = {
    title: string;
    children: Snippet;
  };

  let { title, children }: Props = $props();
</script>

<section>
  <header>
    <Heading level={2}>{title}</Heading>
  </header>

  <div>
    {@render children()}
  </div>
</section>

<style>
  section {
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);

    min-block-size: var(--min-window-block-size);
    min-inline-size: calc(var(--min-window-block-size) * 1.25);

    position: absolute;
    top: 3rem;
    left: 3rem;

    > header {
      border-bottom: 1px solid var(--border);
      padding: var(--padding);
    }

    > div {
      padding: var(--padding);
    }
  }
</style>
