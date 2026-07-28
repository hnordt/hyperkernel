import { expect, test } from "vitest";
import * as kernel from "@hyperkernel/kernel";

test("resolves the kernel workspace through its package name", () => {
  expect(Object.prototype.toString.call(kernel)).toBe("[object Module]");
});
