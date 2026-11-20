# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Calendar Versioning](https://calver.org/).

## 2026.11.20

### Added

- City of North Vancouver tree inventory (11,902 trees) and 9 neighbourhood boundaries merged into the Metro Van dataset (213,981 trees total).
- Deterministic location-based tree IDs for North Vancouver so `/tree/:id` bookmarks stay stable across future data exports.

### Changed

- Omitted missing height, diameter, and address rows in the tree info panel, and preserved trees without height data when range sliders are at defaults.
- Replaced `1899-12-30` placeholder planting dates with `Unknown` for non-Vancouver trees.

## 2026.11.18

### Added

- New Westminster street tree inventory (17,927 trees) and 15 dissolved neighbourhood boundaries merged with Vancouver (202,079 trees total).
- Bundled Metro tree location SQLite database for `/tree/:id` deep links across both cities (with existing Vancouver tree IDs preserved).
- Metro Van landing copy, info panel footer with Changelog & Open Data attribution, and City of New Westminster tree maintenance contact link.

### Changed

- Updated neighbourhood boundary choropleth to a `Greens` density palette with `#444444` outlines and always-visible orange selection highlights.
- Expanded map panning bounds and lowered minimum zoom to `10` to cover both Vancouver and New Westminster.

## 2026.11.17

### Added

- Fallback screen when WebGL or hardware acceleration is unavailable, with links to browser guides for Chrome, Firefox, Safari, and Opera.

### Fixed

- Missing neighbourhood descriptions in the info panel.
- Filtering trees from citywide or neighbourhood stats in the info panel not auto-zooming to the visibility threshold.

## 2026.11.16

### Added

- Alphabetical (`A–Z`) and frequency (`Freq`) sort toggle for the tree filter list, persisted in `localStorage`.

### Fixed

- Mobile info panel opening when tapping empty map while collapsed.
- Uppercase species epithets in scientific names within the tree filter taxonomy.

## 2026.11.15

### Added

- Hierarchical genus/species tree filter with bundled taxonomy stats and search.
- Shareable `/tree/:id` URLs backed by a lazy-loaded SQLite coordinate database.
- Auto-zoom to the required visibility threshold when applying filters (wide-zoom at level 13 for up to 4 species/genera, or 13.5 otherwise).
- Active orange border highlight on the collapsed **Tree Filter** toggle button.
- Diameter and height range pills in the **Selected** filters summary.
- Embedded Google Street View and Cloudinary tree leaf imagery in the info panel.
- Responsive photo lightbox with scroll-snap swipe navigation.
- Citywide tree statistics and neighbourhood boundary stats colored by tree density.
- Development-only Mapbox debug overlay enabled via `--debug`, `npm run dev-debug`, or `?debug`.

### Changed

- Set the parks map style as the default view and increased tree dot opacity and stroke contrast.
- Preserved active filters when clicking off the map to deselect a tree.
- Capped visible selected filter pills at 20 on desktop (3 on mobile) before consolidating into a `+N more` pill.
- Replaced custom filter notice boxes with compact MUI `InfoBanner` alerts.
- Redesigned the mobile info panel as a bottom drawer and made the filter panel's genus tree scroll internally.

### Fixed

- Stale tree leaf image or `(None)` cultivar text briefly showing when switching selected trees.
- Landing/citywide tree filter failing to clear and `/tree/` deep links not padding for the info panel.

## 0.1.0 - 2021-06-01

### Added

- Initial tagged release with interactive Vancouver street tree map and GitHub Pages deployment.
