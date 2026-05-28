import { NextRequest, NextResponse } from "next/server";
import { filterGeneration, incidents, facilities, round } from "@/lib/dataset";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const opts = {
    type: p.get("type") || undefined,
    region: p.get("region") || undefined,
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
  };
  const rows = filterGeneration(opts);
  const totalMwh = rows.reduce((s, r) => s + r.mwh_generated, 0);
  const totalCo2 = rows.reduce((s, r) => s + r.co2_tons, 0);
  const avgCf = rows.length ? rows.reduce((s, r) => s + r.capacity_factor, 0) / rows.length : 0;

  // availability = share of readings that ran above 5% of nameplate
  const up = rows.filter((r) => r.capacity_factor > 0.05).length;
  const availability = rows.length ? up / rows.length : 0;

  const facIds = new Set(rows.map((r) => r.facility_id));
  const relevantIncidents = incidents.filter((i) => facIds.has(i.facility_id));
  const downtime = relevantIncidents.reduce((s, i) => s + i.downtime_hours, 0);

  // homes powered ≈ totalMwh / 10.7 MWh annual avg US household
  const homes = totalMwh / 10.7;

  return NextResponse.json(
    {
      filters: opts,
      kpis: {
        total_generation_gwh: round(totalMwh / 1000, 1),
        avg_capacity_factor: round(avgCf, 4),
        co2_avoided_tons: round(
          // clean sources avoid ~0.91 t/MWh vs gas baseline
          rows.filter((r) => r.co2_tons === 0).reduce((s, r) => s + r.mwh_generated * 0.91, 0),
          0
        ),
        availability_pct: round(availability * 100, 1),
        active_facilities: facIds.size,
        open_incidents: relevantIncidents.length,
        total_downtime_hours: round(downtime, 1),
        homes_powered_est: Math.round(homes),
      },
    },
    { headers: { "x-api-version": "v1" } }
  );
}
