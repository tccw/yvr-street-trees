import { TreeFilter } from "../types/component_types";

export const DEFAULT_DIAMETERS: [number, number] = [0, 115];
export const DEFAULT_HEIGHTS: [number, number] = [0, 40];

export function filterValidForWideZoom(filterObject: any) {
  return (
    validTreesFilter(filterObject.trees, filterObject.treeTaxonomy) ||
    validDiameterFilter(filterObject.diameters) ||
    validHeightsFilter(filterObject.heights)
  );
}

/**
 * Wide-zoom validity for the tree filter, counted in *selection nodes*
 * rather than expanded leaves: selecting a whole genus (which expands to
 * 100+ common names) is still a single user selection, so it stays valid
 * for wide zoom. Without taxonomy data the legacy leaf-count heuristic is
 * used (1-4 common names).
 */
function validTreesFilter(trees: string[], taxonomy?: any) {
  if (!trees || trees.length === 0) return false;
  if (!taxonomy?.genera) {
    return trees.length < 5;
  }
  const selected = new Set(trees);
  let nodes = 0;
  const countedLeaves = new Set<string>();
  for (const genus of taxonomy.genera) {
    let genusTouched = false;
    for (const species of genus.species ?? []) {
      const leaves = species.common_names ?? [];
      const hits = leaves.filter((leaf: any) =>
        selected.has(leaf.common_name)
      );
      if (hits.length === 0) continue;
      genusTouched = true;
      for (const hit of hits) countedLeaves.add(hit.common_name);
      // A fully selected species counts as one node; a partial one counts
      // once per selected leaf (its cultivars are distinct selections).
      nodes += hits.length === leaves.length ? 1 : hits.length;
      if (nodes >= 5) return false;
    }
    // A partially selected genus is one extra node, unless every one of
    // its species was already counted as fully selected.
    if (
      genusTouched &&
      genus.species?.some((s: any) =>
        (s.common_names ?? []).some(
          (leaf: any) => !selected.has(leaf.common_name)
        )
      )
    ) {
      nodes += 1;
      if (nodes >= 5) return false;
    }
  }
  // Leaves not present in the taxonomy (e.g. a common name set by
  // "Filter to this tree" when stats predate the taxonomy).
  for (const name of trees) {
    if (!countedLeaves.has(name)) {
      nodes += 1;
      if (nodes >= 5) return false;
    }
  }
  return nodes > 0;
}

function validDiameterFilter(diameters: number[]) {
  return diameters && diameters[1] - diameters[0] <= 6;
}

function validHeightsFilter(heights: number[]) {
  return heights && heights[1] - heights[0] <= 4;
}

export function isFilterActive(filter: TreeFilter): boolean {
  return (
    (filter.trees?.length ?? 0) > 0 ||
    (filter.diameters != null &&
      (filter.diameters[0] !== DEFAULT_DIAMETERS[0] ||
        filter.diameters[1] !== DEFAULT_DIAMETERS[1])) ||
    (filter.heights != null &&
      (filter.heights[0] !== DEFAULT_HEIGHTS[0] ||
        filter.heights[1] !== DEFAULT_HEIGHTS[1]))
  );
}

export interface AutoZoomOptions {
  wideZoomThreshold: number;
  standardZoomThreshold: number;
  buffer?: number;
}

/**
 * Returns the target zoom level to ease to when a filter is applied,
 * or null if no zoom change is needed (no filter active, or already
 * zoomed in far enough for the filter's trees to render).
 */
export function getAutoZoomTarget(
  nextFilter: TreeFilter,
  currentZoom: number,
  {
    wideZoomThreshold,
    standardZoomThreshold,
    buffer = 0.01,
  }: AutoZoomOptions
): number | null {
  if (!isFilterActive(nextFilter)) {
    return null;
  }

  const requiredZoom = filterValidForWideZoom(nextFilter)
    ? wideZoomThreshold
    : standardZoomThreshold;

  if (currentZoom >= requiredZoom) {
    return null;
  }

  return requiredZoom + buffer;
}
