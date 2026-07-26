<div class="theme-preview">
  <div class="safe-area">
    <section class="documents-surface">
      <header class="padding">
        <h2 class="heading">Documents</h2>
      </header>

      <div class="padding"><p class="text">No documents found</p></div>
    </section>
  </div>
</div>

<style>
  .theme-preview {
    position: fixed;
    inset: 0;
    isolation: isolate;
    height: 100dvh;
    color: var(--text);
    background: var(--canvas);
  }

  .safe-area {
    position: relative;
    height: 100%;
    padding-top: env(safe-area-inset-top);
    padding-right: env(safe-area-inset-right);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
  }

  .documents-surface {
    position: absolute;
    top: 3rem;
    left: 3rem;
    min-width: 16rem;
    min-height: 16rem;
    background: var(--surface);
    border: var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
  }

  .documents-surface header {
    border-bottom: 1px solid var(--border);
  }
</style>
