import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base-class", false && "conditional-class", "another-class");
    expect(result).toContain("base-class");
    expect(result).toContain("another-class");
    expect(result).not.toContain("conditional-class");
  });

  it("handles array input", () => {
    const result = cn(["class1", "class2"]);
    expect(result).toContain("class1");
    expect(result).toContain("class2");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });
});