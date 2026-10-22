import { describe, it, expect } from "vitest";
import { isEmbedRequest } from "./embedMode.js";

describe("isEmbedRequest", () => {
  it("is true only for exactly one embed=1", () => {
    for (const q of ["?embed=1", "?embed=1&d=x", "?d=x&embed=1", "embed=1"]) expect(isEmbedRequest(q), q).toBe(true);
    for (const q of ["", "?", "?embed=0", "?embed=true", "?embed=yes", "?embed=", "?embed", "?embed=01", "?embed=1&embed=0", "?embed=0&embed=1", "?embed=1&embed=1", "?EMBED=1", "?embed[]=1", "?d=embed=1"]) expect(isEmbedRequest(q), q).toBe(false);
  });
});
