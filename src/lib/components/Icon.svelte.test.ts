import { test, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import Icon from "./Icon.svelte";

test("exposes a titled icon as an image", async () => {
  const screen = await render(Icon, {
    name: "cloud",
    title: "Cloud",
  });

  await expect
    .element(screen.getByRole("img", { name: "Cloud" }))
    .toBeVisible();
});
