"use client";

// Loads sql.js (SQLite compiled to WASM) from CDN and builds an in-memory
// database from /data.json. Gives the whole app a *real* SQL engine in the
// browser — no backend database required, deploys as static on Vercel.

type SqlValue = string | number | null;
export type QueryResult = { columns: string[]; rows: SqlValue[][] };

let dbPromise: Promise<any> | null = null;

const SCHEMA_DDL = `
CREATE TABLE regions (region_id INTEGER PRIMARY KEY, name TEXT, grid_operator TEXT);
CREATE TABLE facilities (facility_id INTEGER PRIMARY KEY, name TEXT, region_id INTEGER,
  type TEXT, capacity_mw INTEGER, commissioned_year INTEGER, lat REAL, lon REAL);
CREATE TABLE generation (reading_id INTEGER PRIMARY KEY, facility_id INTEGER, date TEXT,
  mwh_generated REAL, capacity_factor REAL, co2_tons REAL);
CREATE TABLE incidents (incident_id INTEGER PRIMARY KEY, facility_id INTEGER, date TEXT,
  severity TEXT, category TEXT, downtime_hours REAL);
CREATE INDEX idx_gen_fac ON generation(facility_id);
CREATE INDEX idx_gen_date ON generation(date);
`;

export const SCHEMA_FOR_AI = `
regions(region_id, name, grid_operator)
facilities(facility_id, name, region_id, type[Solar|Wind|Hydro|Nuclear|Gas|Geothermal], capacity_mw, commissioned_year, lat, lon)
generation(reading_id, facility_id, date 'YYYY-MM-DD', mwh_generated, capacity_factor 0..1, co2_tons)
incidents(incident_id, facility_id, date, severity[Low|Medium|High|Critical], category, downtime_hours)
-- join generation.facility_id = facilities.facility_id ; facilities.region_id = regions.region_id
-- date range: 2025-01-01 .. 2025-12-31
`.trim();

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

export async function getDb(): Promise<any> {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0";
    await loadScript(`${CDN}/sql-wasm.js`);
    // @ts-ignore — global injected by the CDN script
    const SQL = await window.initSqlJs({ locateFile: () => `${CDN}/sql-wasm.wasm` });
    const db = new SQL.Database();
    db.run(SCHEMA_DDL);

    const data = await fetch("/data.json").then((r) => r.json());
    const insert = (table: string, cols: string[], rows: any[]) => {
      const ph = cols.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${ph})`);
      db.run("BEGIN");
      for (const row of rows) stmt.run(cols.map((c) => row[c]));
      db.run("COMMIT");
      stmt.free();
    };
    insert("regions", ["region_id", "name", "grid_operator"], data.regions);
    insert("facilities", ["facility_id", "name", "region_id", "type", "capacity_mw", "commissioned_year", "lat", "lon"], data.facilities);
    insert("generation", ["reading_id", "facility_id", "date", "mwh_generated", "capacity_factor", "co2_tons"], data.generation);
    insert("incidents", ["incident_id", "facility_id", "date", "severity", "category", "downtime_hours"], data.incidents);
    return db;
  })();
  return dbPromise;
}

export async function runSql(sql: string): Promise<QueryResult> {
  const db = await getDb();
  const res = db.exec(sql);
  if (!res.length) return { columns: [], rows: [] };
  return { columns: res[0].columns, rows: res[0].values };
}
