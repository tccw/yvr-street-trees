import { AlertColor } from "@mui/material/Alert"

export interface AlertDetailsProps {
    isAlertVisible: boolean
    alertMessage: string
    alertSeverity: AlertColor | undefined
}

export interface TreeFilter {
    trees?: string[];
    diameters?: number[];
    heights?: number[];
    // Hierarchical genus/species taxonomy from the stats file. Carried on
    // the filter object so FilterPanel/utils can derive tri-state node
    // selection and count selection *nodes* (not expanded leaves) without
    // extra fetches.
    treeTaxonomy?: TreeTaxonomy;
  }

/** One cultivar-level leaf in the taxonomy tree (a single common_name). */
export interface TreeTaxonomyCommonName {
    common_name: string;
    cultivar_name: string;
    total_count: number;
    color: string | null;
  }

/** A species node: all common names (cultivars) of one genus+species pair. */
export interface TreeTaxonomySpecies {
    species: string;
    scientific_name: string;
    total_count: number;
    common_names: TreeTaxonomyCommonName[];
  }

/** A genus node: all species within one genus. */
export interface TreeTaxonomyGenus {
    genus: string;
    total_count: number;
    species: TreeTaxonomySpecies[];
  }

/** One hit in the taxonomy search index. */
export interface TreeTaxonomySearchRef {
    genus: string;
    species: string;
    cultivar_name: string;
    /** Present on "GENUS SPECIES" (scientific name) index entries. */
    common_name?: string;
  }

/** Hierarchical filtering data emitted alongside tree_stats in the stats JSON. */
export interface TreeTaxonomy {
    genera: TreeTaxonomyGenus[];
    search_index: Record<string, TreeTaxonomySearchRef[]>;
  }
