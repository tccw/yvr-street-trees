import initSqlJs, { Database } from 'sql.js';

const DB_PATH = '/data/vancouver-all-trees-id-to-location-map.db';

// Module-level singleton – shared across all callers in the same session.
let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * Lazily initialises the sql.js WASM engine and loads the SQLite database
 * from the static `data/` directory.  Subsequent calls return the already-
 * resolved promise so the file is only fetched once per page session.
 */
async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = initSqlJs({
    // sql-wasm.wasm is served from /public by Vite (and included in the dist
    // build output), so it is always available at the root path.
    locateFile: () => '/sql-wasm.wasm',
  }).then(async (SQL) => {
    const response = await fetch(DB_PATH);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch tree database: ${response.status} ${response.statusText}`
      );
    }
    const buffer = await response.arrayBuffer();
    dbInstance = new SQL.Database(new Uint8Array(buffer));
    return dbInstance;
  });

  return initPromise;
}

/**
 * Returns the [longitude, latitude] coordinates for the given tree asset ID,
 * or `null` if the ID is not found in the database.
 *
 * The database (and WASM engine) are loaded lazily on the first call and
 * cached for the lifetime of the page session.
 *
 * @example
 * const coords = await getTreeCoordinates(248807);
 * // => [-123.151, 49.246] or null
 */
export async function getTreeCoordinates(
  assetId: number | string
): Promise<[number, number] | null> {
  const db = await getDatabase();

  const result = db.exec(
    'SELECT longitude, latitude FROM trees WHERE asset_id = ?',
    [Number(assetId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const [longitude, latitude] = result[0].values[0] as [number, number];
  return [longitude, latitude];
}
