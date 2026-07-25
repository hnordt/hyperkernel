/** @type {import("lint-staged").Configuration} */
export default {
  "*.{js,ts,svelte}": ["eslint --fix", "prettier --write"],
  "*.{md,html,css,json,jsonc,yaml,yml}": "prettier --write",
};
