### A React SPA map of street trees in Vancouver, BC.

#### See the site live here: [vancouver.treemap.ca](http://vancouver.treemap.ca)

Inspired by the [New York City Street Tree Map](https://tree-map.nycgovparks.org/) from NYC Parks


## Local Development

### Prerequisites
- Node.js 16+
- npm or compatible package manager

### Setup

1. **Clone the repository**
```bash
git clone git@github.com:tccw/yvr-street-trees.git
cd yvr-tree
```

2. **Install dependencies**
```bash
npm install
```

3. **Run local development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev-phone` | Start development server with network host access (for testing on mobile devices on the same network) |
| `npm run build` | Create production build with TypeScript checking |
| `npm run build-no-check` | Create production build without TypeScript checking (faster builds) |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Deploy built site to GitHub Pages |

> **Note:** The `env.ts` file containing Mapbox tokens, API keys and cloud configuration is not committed to source control. You will need to create your own `env.ts` file in the project root with your own credentials if you wish to deploy your own instance or work with protected API endpoints.

### Project Structure
- `/src` - Main application source code (React + TypeScript)
- `/components` - React UI components
- `/opendata` - Open data files and processed tree datasets
- `/scripts` - Data processing scripts for preparing tree datasets
- `/public` - Static public assets
- `/data` - Map tiles and geospatial data files

### Data Processing
If you need to refresh or reprocess the tree dataset:
1. Run `./scripts/get-data.sh` to fetch latest open data from City of Vancouver
2. Run `python ./scripts/process-data.py` to process raw data into application-ready formats

#### Creating Vector Tiles

This project uses the Mapbox Tilesets CLI to generate vector tiles from the processed GeoJSON dataset.

- [Mapbox docs](https://github.com/mapbox/tilesets-cli/blob/master/README.md#update-recipe)

The workflow consists of:

1. Uploading the GeoJSON as a tileset source
2. Defining a recipe (including zoom levels)
3. Creating and publishing the tileset

---

##### Variables

Before running the commands below, define the following values:

* `<mapbox_username>` — Your Mapbox username (e.g. `tcowan`)
* `<tileset_source_name>` — Name for the uploaded source (e.g. `vancouver-trees-src-mar-2026`)
* `<tileset_id>` — Final tileset ID (e.g. `<mapbox_username>.vancouver-trees`)
* `<input_geojson>` — Path to the processed GeoJSON file (e.g. `vancouver-all-trees-processed-seed5.json`)

---

##### 1. Upload the GeoJSON as a Tileset Source

```bash id="x9a2k1"
tilesets upload-source <mapbox_username> <tileset_source_name> <input_geojson>
```

This creates a source with the URI:

```id="y4k3pm"
mapbox://tileset-source/<mapbox_username>/<tileset_source_name>
```

> Note: This step only uploads raw data. It does not create usable tiles yet.

---

##### 2. Create the Recipe

Create a `recipe.json` file:

```json id="w8l2cd"
{
  "version": 1,
  "layers": {
    "trees": {
      "source": "mapbox://tileset-source/<mapbox_username>/<tileset_source_name>",
      "minzoom": 7,
      "maxzoom": 14
    }
  }
}
```

This configuration makes the dataset available at all zoom levels from 7 through 14 with consistent detail.

---

##### 3. Create the Tileset

```bash id="q1z7nv"
tilesets create <tileset_id> --recipe recipe.json --name "Vancouver Trees"
```

* `<tileset_id>` should follow the format: `<mapbox_username>.<tileset_name>`
* Example: `tcowan.vancouver-trees`

This registers the tileset but does not yet generate tiles.

---

##### 4. Publish the Tileset

```bash id="m5u8ra"
tilesets publish <tileset_id>
```

This step generates the tiles and makes them available for use in the app.

---

##### Updating the Tileset

If the data or recipe changes:

```bash id="p2k9sj"
tilesets update-recipe <tileset_id> recipe.json
tilesets publish <tileset_id>
```

---

##### Notes

* Uploading a source does **not** create a tileset—you must define a recipe and publish it.
* A single layer with `minzoom: 7` and `maxzoom: 14` ensures consistent detail across all zoom levels.
* For large datasets, tile sizes may increase since no zoom-based simplification is applied.

---

### Versioning

This project uses [CalVer](https://calver.org/) (`vYYYY.MM.DD`, or `vYYYY.MM.DD.N` for multiple releases on the same day) via Git tags created when deploying:

```bash
git tag -a vYYYY.MM.DD -m "Release summary"
git push origin main --tags
```

