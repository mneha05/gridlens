import { NextRequest, NextResponse } from "next/server";
import { facilities, regions, generation, round } from "@/lib/dataset";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const type = p.get("type");
  const region = p.get("region");
  const regByName = new Map(regions.map((r) => [r.name, r.region_id]));
  const regId = region ? regByName.get(region) : undefined;

  const genByFac = new Map<number, number>();
  for (const g of generation) genByFac.set(g.facility_id, (genByFac.get(g.facility_id) || 0) + g.mwh_generated);

  const data = facilities
    .filter((f) => (!type || f.type === type) && (!regId || f.region_id === regId))
    .map((f) => ({
      ...f,
      region: regions.find((r) => r.region_id === f.region_id)?.name,
      ytd_generation_gwh: round((genByFac.get(f.facility_id) || 0) / 1000, 1),
    }))
    .sort((a, b) => b.ytd_generation_gwh - a.ytd_generation_gwh);

  return NextResponse.json({ count: data.length, facilities: data }, { headers: { "x-api-version": "v1" } });
}
