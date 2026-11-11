import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import Checkbox from "@mui/material/Checkbox";
import { boundaryTrasitionZoomLevel } from "../../styles/map-styles.js";
import { ChevronCollapse, Info } from "../../svg-icons.js";
import { titleCase } from "../../utils/utils.js";
import { filterValidForWideZoom } from "../../utils/utils.js";
import { useWindowSize } from "../../hooks/useWindowSize";
import { Slider } from "@mui/material";
import {
    Dot,
  FilterTrigger,
  TriggerBadge,
  GreyBorderBottomTitle,
  LegendLabel,
  OpenCloseButton,
  SelectEntry,
  StyledFilterBoxes,
  StyledFilterPanel,
  StyledFilterTogglePane,
  TaxonomyTree,
  TreeExpandToggle,
  TreeNodeCount,
  TreeNodeLabel,
  TreeNodeRow,
  SearchContainer,
  TreeSearchBox,
  TreeSearchResult,
  TreeSearchResultPath,
  TreeSearchResults,
  SelectedChips,
  SelectedChip,
  RangeChip,
  RangeChipRemove,
  MoreChips,
  ChipRemove,
  ClearAllButton,
  ZoomLink,
} from "./styles";
import {
  TreeTaxonomy,
  TreeTaxonomyCommonName,
  TreeTaxonomyGenus,
  TreeTaxonomySpecies,
} from "../../types/component_types";
import { genusCommonName } from "../../data/genus-common-names";


interface FilterPanelProps {
  updateParent: (filterObject: any) => void;
  currentFilterObject: any;
  treeNamesAndColors: object;
  treeTaxonomy?: TreeTaxonomy | null;
  updateSelected: any;
  selected: any;
  currentZoom: number;
  zoomIn: any;
}

interface SelectOption {
    label: JSX.Element;
    value: string;
}

const INFO_COLOR = '#a6e9ff';
const [diamMIN, heightMIN] = [0, 0];
const [diamMAX, heightMAX] = [115, 40];

const defaults = {
  trees: [] as string[],
  diameters: [diamMIN, diamMAX],
  heights: [heightMIN, heightMAX],
};

const FilterPanel: React.FC<FilterPanelProps> = (props) => {
  const { updateParent, currentFilterObject, treeNamesAndColors, treeTaxonomy, currentZoom, zoomIn } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const [treeCommonNameList, setTreeCommonNameList] = useState<SelectOption[]>([]);
  const [diameterRange, setDiameterRange] = useState(defaults.diameters);
  const [heightRange, setHeightRange] = useState<number[]>(defaults.heights);
  const [expandedGenera, setExpandedGenera] = useState<Record<string, boolean>>({});
  const [expandedSpecies, setExpandedSpecies] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<number | undefined>(undefined);
  // Matches the CSS breakpoint in styles.tsx: on narrow viewports the
  // Selected chips collapse to a single row with an ellipsis chip.
  const isNarrow = useWindowSize(600);
  const MAX_VISIBLE_CHIPS = 3;

  // Scroll the taxonomy tree to the highlighted node. Runs after state
  // settles (expansion + search results cleared) instead of on a raw
  // requestAnimationFrame, and scrolls only the tree container — never
  // the page. Fallback chain is handled by trying leaf, species, genus
  // element ids in order.
  useEffect(() => {
    if (!highlightedNode) return;
    const tree = treeRef.current;
    if (!tree) return;
    const candidateIds = [
      `taxo-leaf-${highlightedNode}`,
      ...highlightedNode.split("|").length === 2
        ? [`taxo-species-${highlightedNode}`, `taxo-genus-${highlightedNode.split("|")[0]}`]
        : [],
      `taxo-genus-${highlightedNode}`,
    ];
    const target = candidateIds
      .map((id) => document.getElementById(CSS.escape(id)))
      .find(Boolean);
    if (target) {
      tree.scrollTop = target.offsetTop - tree.offsetTop - 8;
    }
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightedNode(null),
      2000
    );
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [highlightedNode]);

  const hasTaxonomy = Boolean(treeTaxonomy?.genera?.length);
  const activeTrees: string[] = currentFilterObject.trees ?? [];
  const activeTreeSet = useMemo(() => new Set(activeTrees), [activeTrees]);

  // Leaves (common names) of a genus / species node, for tri-state checks
  // and add/remove-all toggling. The canonical selection state stays the
  // expanded `trees` list — node state is always derived from it.
  const genusLeaves = (genus: TreeTaxonomyGenus): string[] =>
    genus.species.flatMap((s) => s.common_names.map((c) => c.common_name));
  const speciesLeaves = (species: TreeTaxonomySpecies): string[] =>
    species.common_names.map((c) => c.common_name);

  const nodeState = (leaves: string[]): "checked" | "indeterminate" | "unchecked" => {
    let hits = 0;
    for (const leaf of leaves) if (activeTreeSet.has(leaf)) hits++;
    if (hits === 0) return "unchecked";
    if (hits === leaves.length) return "checked";
    return "indeterminate";
  };

  const toggleLeaves = (leaves: string[], on: boolean) => {
    const next = on
      ? new Set([...activeTreeSet, ...leaves])
      : new Set([...activeTreeSet].filter((name) => !leaves.includes(name)));
    updateParent({ ...currentFilterObject, trees: [...next] });
  };

  // Collapse the expanded leaf selection into the tightest set of nodes
  // that fully covers it (genus > species > leaf), so the "Selected"
  // chips stay readable: e.g. all of Acer -> one "Acer" chip; all of
  // palmatum plus one other Acer species -> "Acer palmatum" + "Acer X".
  // Leaves not found in the taxonomy (e.g. legacy "Filter to this tree")
  // become individual chips.
  const selectedNodes = useMemo(() => {
    if (!hasTaxonomy || activeTreeSet.size === 0) return [];
    const nodes: { key: string; label: string; leaves: string[] }[] = [];
    const covered = new Set<string>();
    const fmt = (name: string) => titleCase(name);
    for (const genus of treeTaxonomy!.genera) {
      const gLeaves = genus.species.flatMap((s) =>
        s.common_names.map((c) => c.common_name)
      );
      const gHits = gLeaves.filter((l) => activeTreeSet.has(l));
      if (gHits.length === 0) continue;
      if (gHits.length === gLeaves.length) {
        nodes.push({ key: `g:${genus.genus}`, label: fmt(genus.genus), leaves: gLeaves });
        gHits.forEach((l) => covered.add(l));
        continue;
      }
      for (const species of genus.species) {
        const sLeaves = species.common_names.map((c) => c.common_name);
        const sHits = sLeaves.filter((l) => activeTreeSet.has(l));
        if (sHits.length === 0) continue;
        if (sHits.length === sLeaves.length) {
          nodes.push({
            key: `s:${genus.genus}|${species.species}`,
            label: species.scientific_name,
            leaves: sLeaves,
          });
          sHits.forEach((l) => covered.add(l));
        } else {
          for (const leafName of sHits) {
            nodes.push({
              key: `l:${genus.genus}|${species.species}|${leafName}`,
              label: fmt(leafName),
              leaves: [leafName],
            });
            covered.add(leafName);
          }
        }
      }
    }
    for (const name of activeTreeSet) {
      if (!covered.has(name)) {
        nodes.push({ key: `x:${name}`, label: fmt(name), leaves: [name] });
      }
    }
    return nodes;
  }, [hasTaxonomy, activeTreeSet, treeTaxonomy]);

  const clearAll = () => {
    setDiameterRange(defaults.diameters);
    setHeightRange(defaults.heights);
    setExpandedGenera({});
    setExpandedSpecies({});
    setSearchQuery("");
    setHighlightedNode(null);
    updateParent({
      ...currentFilterObject,
      trees: [],
      diameters: [...defaults.diameters],
      heights: [...defaults.heights],
    });
  };

  // Search hits: match the query against search_index keys (common names
  // and "GENUS SPECIES"), case-insensitive substring, capped for display.
  const searchResults = useMemo(() => {
    if (!hasTaxonomy || !searchQuery.trim()) return [];
    const q = searchQuery.trim().toUpperCase();
    const results: { key: string; label: string; path: string; genus: string; species: string; commonName?: string }[] = [];
    for (const [key, refs] of Object.entries(treeTaxonomy!.search_index)) {
      if (!key.includes(q)) continue;
      for (const ref of refs) {
        results.push({
          key: `${key}|${ref.genus}|${ref.species}|${ref.common_name ?? ""}`,
          label: ref.common_name ? titleCase(ref.common_name) : titleCase(key),
          path: `${titleCase(ref.genus)} ${titleCase(ref.species)}`,
          genus: ref.genus,
          species: ref.species,
          commonName: ref.common_name,
        });
        if (results.length >= 12) return results;
      }
    }
    return results;
  }, [hasTaxonomy, searchQuery, treeTaxonomy]);

  // Picking a search hit: add the leaf (or every leaf of the species for
  // scientific-name hits), expand its ancestors, and highlight the node.
  const onSearchPick = (result: { genus: string; species: string; commonName?: string }) => {
    const genus = treeTaxonomy!.genera.find((g) => g.genus === result.genus);
    const species = genus?.species.find((s) => s.species === result.species);
    if (!genus || !species) return;
    const leaves = result.commonName ? [result.commonName] : speciesLeaves(species);
    toggleLeaves(leaves, true);
    setExpandedGenera((prev) => ({ ...prev, [genus.genus]: true }));
    setExpandedSpecies((prev) => ({ ...prev, [`${genus.genus}|${species.species}`]: true }));
    setHighlightedNode(result.commonName ?? `${genus.genus}|${species.species}`);
    setSearchQuery("");
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Build the full list of options from the treeNamesAndColors prop
  useEffect(() => {
    let nameList: SelectOption[] = [];
    if (treeNamesAndColors) {
      for (const [key, value] of Object.entries(treeNamesAndColors)) {
        nameList.push({
          label: (
            <SelectEntry key={key}>
              <Dot color={(value as any).color}></Dot> {titleCase(key)}
            </SelectEntry>
          ),
          value: key,
        });
      }
    }
    setTreeCommonNameList(nameList);
  }, [treeNamesAndColors]);

  // Sync local slider state when the filter is changed externally
  // (e.g. clicking "Filter to this tree" from the InfoPanel resets trees
  //  but should also keep whatever diameter/height was already set)
  useEffect(() => {
    if (currentFilterObject.diameters) {
      setDiameterRange(currentFilterObject.diameters);
    }
    if (currentFilterObject.heights) {
      setHeightRange(currentFilterObject.heights);
    }
  }, [currentFilterObject]);

  // Derive the controlled value for the Select from the parent filter object.
  // This is the single source of truth – no local tree-selection state needed.
  const selectedTreeOptions = useMemo<SelectOption[]>(() => {
    const activeTrees: string[] = currentFilterObject.trees ?? [];
    return treeCommonNameList.filter((opt) => activeTrees.includes(opt.value));
  }, [treeCommonNameList, currentFilterObject.trees]);

  // A range filter counts as "filtered" when it differs from its default
  // span — the same comparison isAtDefaults() uses, so the Diameter/Height
  // chips and the Selected section's visibility can't disagree.
  const diameters: number[] = currentFilterObject.diameters ?? defaults.diameters;
  const heights: number[] = currentFilterObject.heights ?? defaults.heights;
  const isDiameterFiltered =
    diameters[0] !== diamMIN || diameters[1] !== diamMAX;
  const isHeightFiltered =
    heights[0] !== heightMIN || heights[1] !== heightMAX;
  const rangeFilterCount =
    (isDiameterFiltered ? 1 : 0) + (isHeightFiltered ? 1 : 0);

  function isAtDefaults(): boolean {
    const trees: string[] = currentFilterObject.trees ?? [];
    return trees.length === 0 && !isDiameterFiltered && !isHeightFiltered;
  }

  // Removing a range chip resets just that slider to its default span.
  const clearDiameter = () => {
    setDiameterRange([...defaults.diameters]);
    updateParent({ ...currentFilterObject, diameters: [...defaults.diameters] });
  };
  const clearHeight = () => {
    setHeightRange([...defaults.heights]);
    updateParent({ ...currentFilterObject, heights: [...defaults.heights] });
  };

  const handleTreeClick = (newValue: readonly SelectOption[]) => {
    const treeNames = newValue ? newValue.map((opt) => opt.value) : [];
    updateParent({ ...currentFilterObject, trees: treeNames });
  };

  const handleChangeDiameter = (
    _event: Event,
    newValue: number | number[],
    _activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) return;
    setDiameterRange(newValue);
    updateParent({ ...currentFilterObject, diameters: newValue });
  };

  const handleChangeHeight = (
    _event: Event,
    newValue: number | number[],
    _activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) return;
    setHeightRange(newValue);
    updateParent({ ...currentFilterObject, heights: newValue });
  };

  // Hierarchy rows for the taxonomy tree. Rows use a label + span expand
  // toggle (no nested interactive elements). Every checkbox change writes
  // the expanded common-name list back to the parent filter object.
  const renderTaxonomyTree = () => {
    if (!hasTaxonomy) return null;
    const rows: JSX.Element[] = [];

    // Best-effort common name for a node, used for the "(Common Name)"
    // hint next to genus/species labels.
    //
    // Genus: from the curated GENUS_COMMON_NAMES dictionary — accurate by
    // construction (Acer -> Maple). No fallback: a species name would be
    // wrong at genus level, so unlisted genera show no hint.
    //
    // Species: from the data — the plain (cultivar_name === "NONE") name
    // of the most common leaf, falling back to the most common leaf.
    const hintForSpecies = (commonNames: TreeTaxonomyCommonName[]): string | null => {
      for (const leaf of commonNames) {
        if (leaf.cultivar_name === "NONE" && leaf.common_name) {
          return titleCase(leaf.common_name);
        }
      }
      return commonNames[0]?.common_name ? titleCase(commonNames[0].common_name) : null;
    };
    const renderHint = (hint: string | null) =>
      hint ? (
        <TreeNodeCount title={`Common name: ${hint}`}>
          ({hint})
        </TreeNodeCount>
      ) : null;

    for (const genus of treeTaxonomy!.genera) {
      const genusKey = genus.genus;
      const leaves = genusLeaves(genus);
      const state = nodeState(leaves);
      const genusExpanded = Boolean(expandedGenera[genusKey]);
      const genusHint = genusCommonName(genusKey) ?? null;
      rows.push(
        <TreeNodeRow
          key={`genus-${genusKey}`}
          id={`taxo-genus-${genusKey}`}
          depth={0}
          highlighted={highlightedNode === genusKey}
        >
          <TreeExpandToggle
            onClick={() => setExpandedGenera((prev) => ({ ...prev, [genusKey]: !genusExpanded }))}
            title={genusExpanded ? "Collapse" : "Expand"}
          >
            {genusExpanded ? "▾" : "▸"}
          </TreeExpandToggle>
          <Checkbox
            size="small"
            checked={state === "checked"}
            indeterminate={state === "indeterminate"}
            onChange={() => toggleLeaves(leaves, state !== "checked")}
          />
          <TreeNodeLabel bold>{titleCase(genusKey)}</TreeNodeLabel>
          {renderHint(genusHint)}
          <TreeNodeCount>{genus.total_count.toLocaleString()}</TreeNodeCount>
        </TreeNodeRow>
      );
      if (!genusExpanded) continue;
      for (const species of genus.species) {
        const speciesKey = `${genusKey}|${species.species}`;
        const sLeaves = speciesLeaves(species);
        const sState = nodeState(sLeaves);
        const speciesExpanded = Boolean(expandedSpecies[speciesKey]);
        const speciesHint = hintForSpecies(species.common_names);
        rows.push(
          <TreeNodeRow
            key={`species-${speciesKey}`}
            id={`taxo-species-${speciesKey}`}
            depth={1}
            highlighted={highlightedNode === speciesKey}
          >
            <TreeExpandToggle
              onClick={() => setExpandedSpecies((prev) => ({ ...prev, [speciesKey]: !speciesExpanded }))}
              title={speciesExpanded ? "Collapse" : "Expand"}
            >
              {sLeaves.length > 0 ? (speciesExpanded ? "▾" : "▸") : "·"}
            </TreeExpandToggle>
            <Checkbox
              size="small"
              checked={sState === "checked"}
              indeterminate={sState === "indeterminate"}
              onChange={() => toggleLeaves(sLeaves, sState !== "checked")}
            />
            <TreeNodeLabel>
              <i>{species.scientific_name}</i>
            </TreeNodeLabel>
            {renderHint(speciesHint)}
            <TreeNodeCount>{species.total_count.toLocaleString()}</TreeNodeCount>
          </TreeNodeRow>
        );
        if (!speciesExpanded) continue;
        for (const leaf of species.common_names) {
          const leafState = nodeState([leaf.common_name]);
          rows.push(
            <TreeNodeRow
              key={`leaf-${genusKey}|${species.species}|${leaf.common_name}`}
              id={`taxo-leaf-${leaf.common_name}`}
              depth={2}
              highlighted={highlightedNode === leaf.common_name}
            >
              <TreeExpandToggle>·</TreeExpandToggle>
              <Checkbox
                size="small"
                checked={leafState === "checked"}
                onChange={() => toggleLeaves([leaf.common_name], leafState !== "checked")}
              />
              <Dot color={leaf.color ?? "#b0b0b0"}></Dot>
              <TreeNodeLabel>{titleCase(leaf.common_name)}</TreeNodeLabel>
              <TreeNodeCount>{leaf.total_count.toLocaleString()}</TreeNodeCount>
            </TreeNodeRow>
          );
        }
      }
    }
    return rows;
  };

  return (
    <>
      {!isExpanded && (
        <FilterTrigger
          onClick={handleToggle}
          aria-expanded={false}
          aria-controls="filter-panel"
          title="expand filter panel"
        >
          Filter Map
          {!isAtDefaults() && <TriggerBadge title="filters active" />}
        </FilterTrigger>
      )}
      {isExpanded && (
        <StyledFilterPanel id="filter-panel" className="filter-panel">
          <OpenCloseButton
            onClick={handleToggle}
            title="collapse panel"
            aria-expanded={true}
            aria-controls="filter-panel"
          >
            {ChevronCollapse}
          </OpenCloseButton>
          <StyledFilterTogglePane className="toggle-pane">
            <GreyBorderBottomTitle margin_bottom="10px" font_size="1.3rem">
              Filter by Species, Trunk Diameter, and Tree Height
            </GreyBorderBottomTitle>
            <StyledFilterBoxes grow>
              <LegendLabel> {hasTaxonomy ? "By Genus / Species (Common Name)" : "By Species (Common Name)"} </LegendLabel>
              {hasTaxonomy ? (
                <>
                  <SearchContainer>
                    <TreeSearchBox
                      type="text"
                      placeholder="Search common or scientific name…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <TreeSearchResults>
                        {searchResults.map((result) => (
                          <TreeSearchResult key={result.key} onClick={() => onSearchPick(result)}>
                            <TreeNodeLabel>{result.label}</TreeNodeLabel>
                            <TreeSearchResultPath>{result.path}</TreeSearchResultPath>
                          </TreeSearchResult>
                        ))}
                      </TreeSearchResults>
                    )}
                  </SearchContainer>
                  <TaxonomyTree ref={treeRef}>{renderTaxonomyTree()}</TaxonomyTree>
                </>
              ) : (
                <Select<SelectOption, true>
                  options={treeCommonNameList}
                  isMulti
                  onChange={handleTreeClick}
                  value={selectedTreeOptions}
                  maxMenuHeight={isNarrow ? Math.round(window.innerHeight * 0.4) : 200}
                />
              )}
            </StyledFilterBoxes>
            <StyledFilterBoxes>
                <LegendLabel> By Diameter Range (cm)</LegendLabel>
                <Slider
                    getAriaLabel={() => "Diameter Slider"}
                    value={diameterRange}
                    onChange={handleChangeDiameter}
                    valueLabelDisplay="auto"
                    step={6}
                    marks
                    min={diamMIN}
                    max={diamMAX}
                    disabled={(currentZoom <= boundaryTrasitionZoomLevel)}
                />
                <LegendLabel>  By Height Range (m) </LegendLabel>
                <Slider
                    getAriaLabel={() => "Height Slider"}
                    value={heightRange}
                    onChange={handleChangeHeight}
                    valueLabelDisplay="auto"
                    step={2}
                    marks
                    min={heightMIN}
                    max={heightMAX}
                    disabled={(currentZoom <= boundaryTrasitionZoomLevel)}
                />
            </StyledFilterBoxes>
            { (currentZoom <= boundaryTrasitionZoomLevel) &&
                <StyledFilterBoxes color={INFO_COLOR}>
                    <div style={{"width": "fit-content",
                                    "height": "fit-content"}}>
                        {Info} <b>Height and Diameter Filtering Disabled</b> Please click to {<ZoomLink onClick={zoomIn} href='#'>zoom in</ZoomLink>} in to use filters.
                    </div>
                </StyledFilterBoxes>
                }
                {(currentZoom <= boundaryTrasitionZoomLevel) && (currentFilterObject.trees) && (currentFilterObject.trees.length > 4) && !filterValidForWideZoom(currentFilterObject) &&
                    <StyledFilterBoxes color={INFO_COLOR}>
                    <div style={{"width": "fit-content",
                                    "height": "fit-content"}}>
                        {Info} <b>Trees filter</b> currently supports a <b>max of 4 species/genera when zoomed out</b>. {<ZoomLink onClick={zoomIn} href='#'>Zoom</ZoomLink>} or remove trees from the filter.
                    </div>
                </StyledFilterBoxes>
            }

            {!isAtDefaults() && (
              <StyledFilterBoxes>
                <LegendLabel>
                  Selected ({selectedNodes.length + rangeFilterCount})
                </LegendLabel>
                {selectedNodes.length > 0 || rangeFilterCount > 0 ? (
                  <SelectedChips>
                    {(isNarrow && selectedNodes.length + rangeFilterCount > MAX_VISIBLE_CHIPS
                      ? selectedNodes.slice(0, MAX_VISIBLE_CHIPS)
                      : selectedNodes
                    ).map((node) => (
                      <SelectedChip key={node.key} title="Click × to remove">
                        {node.label}
                        <ChipRemove onClick={() => toggleLeaves(node.leaves, false)}>×</ChipRemove>
                      </SelectedChip>
                    ))}
                    {isDiameterFiltered && (
                      <RangeChip title="Diameter range filter — click × to reset the range">
                        Diameter
                        <RangeChipRemove onClick={clearDiameter}>×</RangeChipRemove>
                      </RangeChip>
                    )}
                    {isHeightFiltered && (
                      <RangeChip title="Height range filter — click × to reset the range">
                        Height
                        <RangeChipRemove onClick={clearHeight}>×</RangeChipRemove>
                      </RangeChip>
                    )}
                    {isNarrow && selectedNodes.length + rangeFilterCount > MAX_VISIBLE_CHIPS && (
                      <MoreChips
                        title={selectedNodes
                          .slice(MAX_VISIBLE_CHIPS)
                          .map((n) => n.label)
                          .join(", ")}
                      >
                        +{selectedNodes.length + rangeFilterCount - MAX_VISIBLE_CHIPS} more
                      </MoreChips>
                    )}
                  </SelectedChips>
                ) : (
                  <SelectEntry>{activeTrees.length} tree name{activeTrees.length === 1 ? "" : "s"} selected</SelectEntry>
                )}
                <ClearAllButton onClick={clearAll}>Clear all filters</ClearAllButton>
              </StyledFilterBoxes>
            )}
          </StyledFilterTogglePane>
        </StyledFilterPanel>
      )}
    </>
  );
};

export default FilterPanel;
