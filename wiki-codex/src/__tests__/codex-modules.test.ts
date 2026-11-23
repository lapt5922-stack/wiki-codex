import { describe, expect, it } from "vitest";
import {
  CODEX_MODULES,
  EDITORIAL_STATUS_META,
  normalizeEditorialStatus
} from "@/lib/codex-modules";

describe("Aethel Codex Master Project Direction — 14 Modules & 6 Editorial States", () => {
  it("defines all 14 structured Codex modules with unique ID prefixes", () => {
    expect(CODEX_MODULES.length).toBe(14);
    const prefixes = new Set(CODEX_MODULES.map((m) => m.idPrefix));
    expect(prefixes.size).toBe(14);
    expect(prefixes.has("WRLD")).toBe(true);
    expect(prefixes.has("KING")).toBe(true);
    expect(prefixes.has("CHAR")).toBe(true);
    expect(prefixes.has("ORG")).toBe(true);
    expect(prefixes.has("LOC")).toBe(true);
    expect(prefixes.has("HIST")).toBe(true);
    expect(prefixes.has("EVT")).toBe(true);
    expect(prefixes.has("LORE")).toBe(true);
    expect(prefixes.has("PWR")).toBe(true);
    expect(prefixes.has("ITEM")).toBe(true);
    expect(prefixes.has("CUL")).toBe(true);
    expect(prefixes.has("REL")).toBe(true);
    expect(prefixes.has("TECH")).toBe(true);
    expect(prefixes.has("RACE")).toBe(true);
  });

  it("supports all 6 canonical editorial states with backward-compatible normalization", () => {
    expect(Object.keys(EDITORIAL_STATUS_META).length).toBe(6);
    expect(normalizeEditorialStatus("canon")).toBe("canon");
    expect(normalizeEditorialStatus("verified")).toBe("verified");
    expect(normalizeEditorialStatus("unverified")).toBe("unverified");
    expect(normalizeEditorialStatus("inferred")).toBe("inferred");
    expect(normalizeEditorialStatus("original_lore")).toBe("original_lore");
    expect(normalizeEditorialStatus("draft")).toBe("draft");
    // Backward compatibility for legacy records
    expect(normalizeEditorialStatus("hypothesis")).toBe("inferred");
    expect(normalizeEditorialStatus("apocrypha")).toBe("original_lore");
  });
});
