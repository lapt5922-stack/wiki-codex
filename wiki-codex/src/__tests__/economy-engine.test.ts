import { describe, expect, it } from "vitest";
import {
  WORLD_CURRENCIES,
  auditEconomyConsistency,
  convertWorldCurrency,
  createDefaultEconomyProfile,
  generateEconomicSummaryProse,
  normalizeBarsTo100
} from "@/lib/economy-engine";
import { buildAll360NationEntries } from "@/lib/planetary-atlas/nation-dossiers";
import { buildPlanetaryAtlasBundle } from "@/lib/planetary-atlas/generator";
import {
  computeConcentricRingsNormalized,
  resolveNationLensColor
} from "@/lib/planetary-atlas/climate-geology";
import { samplePlanetaryTerrainPixel } from "@/lib/planetary-atlas/terrain-backdrop";

describe("Economy Engine & 360-Nation Economic Consistency", () => {
  it("generates valid economyProfile & emblemConfig for all 360 nations with 100% normalized bars", () => {
    const entries = buildAll360NationEntries("ws-aethelgard");
    expect(entries).toHaveLength(360);

    for (const entry of entries) {
      expect(entry.economyProfile).toBeDefined();
      expect(entry.emblemConfig).toBeDefined();
      expect(entry.tabOverrides?.enabled).toContain("economy");
      expect(entry.tabOverrides?.disabled).toContain("power");

      const ep = entry.economyProfile!;
      const secSum = ep.sectorBreakdown.reduce((s, b) => s + b.percentage, 0);
      const budSum = ep.budgetAllocation.reduce((s, b) => s + b.percentage, 0);
      const demoSum = ep.demographicsBars.reduce((s, b) => s + b.percentage, 0);

      expect(secSum).toBe(100);
      expect(budSum).toBe(100);
      expect(demoSum).toBe(100);
      expect(ep.tradeBalance.exportsShare + ep.tradeBalance.importsShare).toBe(100);
      expect(ep.developmentMeters).toHaveLength(6);
    }

    // Consistency auditor should find 0 issues across all 360 generated nations
    const audit = auditEconomyConsistency(entries);
    expect(audit).toHaveLength(0);
  });

  it("converts between world currencies accurately", () => {
    expect(WORLD_CURRENCIES.length).toBeGreaterThanOrEqual(9);
    const aurToArg = convertWorldCurrency(100, "AUR", "ARG");
    expect(aurToArg).toBe(118);
    const backToAur = convertWorldCurrency(aurToArg, "ARG", "AUR");
    expect(backToAur).toBe(100);
  });

  it("normalizes arbitrary bar percentages cleanly to 100%", () => {
    const res = normalizeBarsTo100([
      { id: "a", percentage: 10 },
      { id: "b", percentage: 10 },
      { id: "c", percentage: 10 }
    ]);
    expect(res.reduce((s, b) => s + b.percentage, 0)).toBe(100);
  });

  it("generates Vietnamese encyclopedic economic summary prose", () => {
    const prof = createDefaultEconomyProfile("Vương quốc Valoria");
    const prose = generateEconomicSummaryProse("Vương quốc Valoria", prof);
    expect(prose).toContain("Vương quốc Valoria");
    expect(prose).toContain("AUR");
    expect(prose).toContain("%");
  });

  it("detects inconsistent bar sums via Economy Consistency Auditor", () => {
    const entries = buildAll360NationEntries("ws-aethelgard").slice(0, 1);
    const broken = structuredClone(entries[0]);
    broken.economyProfile!.sectorBreakdown[0].percentage += 15;
    const issues = auditEconomyConsistency([broken]);
    expect(issues.some((i) => i.kind === "sector-sum")).toBe(true);
  });

  it("supports new Atlas V2 Economic Lenses, Concentric Rings & 5 Terrain Styles", () => {
    const bundle = buildPlanetaryAtlasBundle();
    const valoria = bundle.nations[0];
    expect(resolveNationLensColor(valoria, "ECONOMY")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(resolveNationLensColor(valoria, "CURRENCY")).toMatch(/^#[0-9a-f]{6}$/i);
    expect(resolveNationLensColor(valoria, "TRADE_BALANCE")).toMatch(/^#[0-9a-f]{6}$/i);

    const rings = computeConcentricRingsNormalized(0.5, 0.5, [500, 1500, 3000]);
    expect(rings).toHaveLength(3);
    expect(rings[2].rx).toBeCloseTo(3000 / 64000, 6);

    const nightPx = samplePlanetaryTerrainPixel(0.5, 0.5, "NIGHT_LIGHTS", "WINTER");
    const azurePx = samplePlanetaryTerrainPixel(0.5, 0.5, "AZURE_ATLAS", "SPRING");
    expect(nightPx.r).toBeGreaterThanOrEqual(0);
    expect(azurePx.b).toBeGreaterThanOrEqual(0);
  });
});
