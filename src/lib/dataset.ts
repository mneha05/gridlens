import raw from "../../public/data.json";

export type Region = { region_id: number; name: string; grid_operator: string };
export type Facility = {
  facility_id: number; name: string; region_id: number; type: string;
  capacity_mw: number; commissioned_year: number; lat: number; lon: number;
};
export type Generation = {
  reading_id: number; facility_id: number; date: string;
  mwh_generated: number; capacity_factor: number; co2_tons: number;
};
export type Incident = {
  incident_id: number; facility_id: number; date: string;
  severity: string; category: string; downtime_hours: number;
};

export const regions = raw.regions as Region[];
export const facilities = raw.facilities as Facility[];
export const generation = raw.generation as Generation[];
export const incidents = raw.incidents as Incident[];
export const meta = raw.meta as {
  source: string; generated_rows: Record<string, number>; date_range: string[];
};

const facById = new Map(facilities.map((f) => [f.facility_id, f]));
const regById = new Map(regions.map((r) => [r.region_id, r]));

export function facilityOf(id: number) {
  return facById.get(id);
}
export function regionOf(id: number) {
  return regById.get(id);
}

/** Filter generation by optional source type / region / date window. */
export function filterGeneration(opts: {
  type?: string; region?: string; from?: string; to?: string;
} = {}) {
  return generation.filter((g) => {
    const f = facById.get(g.facility_id)!;
    if (opts.type && f.type !== opts.type) return false;
    if (opts.region) {
      const r = regById.get(f.region_id);
      if (!r || r.name !== opts.region) return false;
    }
    if (opts.from && g.date < opts.from) return false;
    if (opts.to && g.date > opts.to) return false;
    return true;
  });
}

export function round(n: number, d = 2) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}
