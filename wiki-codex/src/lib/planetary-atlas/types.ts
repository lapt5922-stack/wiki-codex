export type PolityScaleTier =
  | "IMPERIAL_REALM"
  | "MAJOR_STATE"
  | "REGIONAL_STATE"
  | "PRINCIPALITY"
  | "FREE_CITY"
  | "SPECIAL_ZONE";

export type AtlasBiomeId =
  | "TEMPERATE_PLAINS"
  | "ARID_CANYON"
  | "ASH_VOLCANIC"
  | "SAND_DESERT"
  | "TROPICAL_JUNGLE"
  | "ALPINE_PEAKS"
  | "GLACIAL_ICE"
  | "CORAL_SEA"
  | "ARCHIPELAGO";

export type AtlasDisplayMode = "CLEAN_LOD" | "COLOR_MOSAIC" | "ISOLATED_FOCUS";

export type TerrainBackdropStyle = "PHYSICAL_RELIEF" | "SATELLITE" | "PARCHMENT";

export type AtlasWikiLens =
  | "POLITICAL"
  | "TERRAIN"
  | "CLIMATE"
  | "BIOME"
  | "DEMOGRAPHICS"
  | "DIPLOMACY"
  | "RESOURCES";

export type DiplomacyStatus =
  | "ALLIANCE"
  | "FEDERATION"
  | "TRADE_PACT"
  | "NEUTRAL_PACT"
  | "DISPUTED"
  | "RIVALRY";

export type ContinentId =
  | "AURELIA"
  | "OCCIDENTALIS"
  | "ORIENTIS"
  | "AUSTRALIS"
  | "HESPERIA"
  | "SOLARA"
  | "ARCTIC_ICE"
  | "ANTARCTIC_ICE"
  | "OCEANIC";

export interface Point2D {
  x: number;
  y: number;
}

export interface PlanetaryRegionDef {
  code: string;
  name: string;
  continent: ContinentId;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  defaultBiome: AtlasBiomeId;
}

export interface PlanetaryNation {
  id: string;
  nationNum: number;
  name: string;
  shortName: string;
  capital: string;
  tier: PolityScaleTier;
  lodTier: 0 | 1 | 2 | 3;
  continent: ContinentId;
  regionCode: string;
  regionName: string;
  bloc: string;
  biome: AtlasBiomeId;
  biomeColor: string;
  color: string;
  x: number;
  y: number;
  latLabel: string;
  lonLabel: string;
  elevationM: number;
  avgTempC: number;
  population: number;
  areaKm2: number;
  governmentType: string;
  primaryLanguage: string;
  foundingEra: string;
  validFromTick: number;
  validToTick: number;
  isTriBorder?: boolean;
  summary: string;
  polygon: Point2D[];
  svgPath: string;
  bbox: { minX: number; maxX: number; minY: number; maxY: number };
  neighbors: string[];
}

export interface PlanetaryTopoChain {
  id: string;
  name: string;
  kind: "MOUNTAIN" | "RIVER" | "CURRENT";
  peakElevationM?: number;
  points: Point2D[];
}

export interface PlanetaryVolcano {
  id: string;
  name: string;
  x: number;
  y: number;
  elevationM: number;
}

export interface PlanetaryChokepoint {
  id: string;
  name: string;
  kind: "PASS" | "STRAIT" | "CANAL" | "CROSSING";
  x: number;
  y: number;
  note: string;
}

export interface PlanetaryRoute {
  id: string;
  name: string;
  kind: "TRADE" | "MARITIME" | "SCHOLAR";
  color: string;
  dashed: boolean;
  points: Point2D[];
  description: string;
}

export interface PlanetaryDiplomacy {
  id: string;
  polityAId: string;
  polityBId: string;
  status: DiplomacyStatus;
  treatyTitle: string;
  fromTick: number;
  summary: string;
}

export interface PlanetaryResourceFlow {
  id: string;
  sourceNationId: string;
  targetNationId: string;
  resourceName: string;
  volumeLabel: string;
  dependencyPct: number;
}

export interface PlanetaryBorderCrossing {
  id: string;
  nationAId: string;
  nationBId: string;
  x: number;
  y: number;
  label: string;
  status: DiplomacyStatus;
  significanceScore: number;
}

export interface PlanetaryEraDef {
  id: string;
  tick: number;
  label: string;
  yearRange: string;
  summary: string;
}

export interface PlanetaryAtlasBundle {
  planetName: string;
  circumferenceKm: number;
  canvasWidth: number;
  canvasHeight: number;
  continents: Record<Exclude<ContinentId, "OCEANIC">, Point2D[]>;
  continentLabels: Array<{
    id: ContinentId;
    name: string;
    subtitle: string;
    x: number;
    y: number;
  }>;
  regions: PlanetaryRegionDef[];
  nations: PlanetaryNation[];
  topoChains: PlanetaryTopoChain[];
  volcanoes: PlanetaryVolcano[];
  chokepoints: PlanetaryChokepoint[];
  routes: PlanetaryRoute[];
  diplomacy: PlanetaryDiplomacy[];
  resourceFlows: PlanetaryResourceFlow[];
  borderCrossings: PlanetaryBorderCrossing[];
  eras: PlanetaryEraDef[];
}
