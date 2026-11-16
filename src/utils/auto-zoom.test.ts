import {
  DEFAULT_DIAMETERS,
  DEFAULT_HEIGHTS,
  getAutoZoomTarget,
  isFilterActive,
} from "./auto-zoom";
import { TreeFilter } from "../types/component_types";

const OPTS = {
  wideZoomThreshold: 13,
  standardZoomThreshold: 13.5,
  buffer: 0.01,
};

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}]: expected ${expected}, got ${actual}`);
  }
}

const baseFilter: TreeFilter = {
  trees: [],
  diameters: [...DEFAULT_DIAMETERS],
  heights: [...DEFAULT_HEIGHTS],
};

// 1. Default / no filter active
assertEqual(isFilterActive(baseFilter), false, "default filter is inactive");
assertEqual(
  getAutoZoomTarget(baseFilter, 11.5, OPTS),
  null,
  "no filter active does not zoom even at 11.5"
);

// 2. Wide-valid species filter (1-4 species)
const wideSpeciesFilter: TreeFilter = {
  ...baseFilter,
  trees: ["RED MAPLE", "NORWAY MAPLE"],
};
assertEqual(isFilterActive(wideSpeciesFilter), true, "2 trees is active");
assertEqual(
  getAutoZoomTarget(wideSpeciesFilter, 11.5, OPTS),
  13.01,
  "wide filter zooms from 11.5 to 13.01"
);
assertEqual(
  getAutoZoomTarget(wideSpeciesFilter, 12.99, OPTS),
  13.01,
  "wide filter zooms from 12.99 to 13.01"
);
assertEqual(
  getAutoZoomTarget(wideSpeciesFilter, 13, OPTS),
  null,
  "wide filter does not zoom when already at 13"
);
assertEqual(
  getAutoZoomTarget(wideSpeciesFilter, 14.5, OPTS),
  null,
  "wide filter does not zoom when already at 14.5"
);

// 3. Non-wide-valid species filter (>4 species)
const fiveSpeciesFilter: TreeFilter = {
  ...baseFilter,
  trees: ["A", "B", "C", "D", "E"],
};
assertEqual(
  getAutoZoomTarget(fiveSpeciesFilter, 11.5, OPTS),
  13.51,
  "5 species zooms from 11.5 to 13.51"
);
assertEqual(
  getAutoZoomTarget(fiveSpeciesFilter, 13.01, OPTS),
  13.51,
  "adding 5th species while at 13.01 zooms to 13.51"
);
assertEqual(
  getAutoZoomTarget(fiveSpeciesFilter, 13.5, OPTS),
  null,
  "5 species does not zoom when already at 13.5"
);

// 4. Dropping back from >4 species to <=4 species
const fourSpeciesFilter: TreeFilter = {
  ...baseFilter,
  trees: ["A", "B", "C", "D"],
};
assertEqual(
  getAutoZoomTarget(fourSpeciesFilter, 13.01, OPTS),
  null,
  "4 species at 13.01 does not zoom"
);
assertEqual(
  getAutoZoomTarget(fourSpeciesFilter, 12, OPTS),
  13.01,
  "4 species at 12 zooms to 13.01"
);

// 5. Clearing filter returns null
assertEqual(
  getAutoZoomTarget(baseFilter, 12, OPTS),
  null,
  "clearing filter at 12 does not zoom"
);

// 6. Diameter & height filters
assertEqual(
  getAutoZoomTarget({ ...baseFilter, diameters: [10, 16] }, 11.5, OPTS),
  13.01,
  "narrow diameter filter (<=6cm) is wide-valid -> 13.01"
);
assertEqual(
  getAutoZoomTarget({ ...baseFilter, diameters: [10, 50] }, 12, OPTS),
  13.51,
  "wide diameter filter (>6cm) requires 13.51"
);
assertEqual(
  getAutoZoomTarget({ ...baseFilter, heights: [4, 8] }, 11.5, OPTS),
  13.01,
  "narrow height filter (<=4m) is wide-valid -> 13.01"
);

// 7. Taxonomy-aware whole genus selection (6 leaves in 1 genus = 1 node)
const wholeGenusFilter: TreeFilter = {
  ...baseFilter,
  trees: ["L1", "L2", "L3", "L4", "L5", "L6"],
  treeTaxonomy: {
    search_index: {},
    genera: [
      {
        genus: "ACER",
        total_count: 100,
        species: [
          {
            species: "RUBRUM",
            scientific_name: "ACER RUBRUM",
            total_count: 100,
            common_names: [
              { common_name: "L1", cultivar_name: "", color: "#000", total_count: 10 },
              { common_name: "L2", cultivar_name: "", color: "#000", total_count: 10 },
              { common_name: "L3", cultivar_name: "", color: "#000", total_count: 10 },
              { common_name: "L4", cultivar_name: "", color: "#000", total_count: 10 },
              { common_name: "L5", cultivar_name: "", color: "#000", total_count: 10 },
              { common_name: "L6", cultivar_name: "", color: "#000", total_count: 10 },
            ],
          },
        ],
      },
    ],
  },
};
assertEqual(
  getAutoZoomTarget(wholeGenusFilter, 11.5, OPTS),
  13.01,
  "whole genus with 6 leaves counts as 1 node -> wide-valid -> 13.01"
);

console.log("All auto-zoom tests passed (15 assertions).");
