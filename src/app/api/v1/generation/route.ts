import { NextRequest, NextResponse } from "next/server";
import { filterGeneration, facilities, round } from "@/lib/dataset";

const facType = new Map(facilities.map((f) => [f.facility_id, f.type]));

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const opts = {
    type: p.get("type") || undefined,
    region: p.get("region") || undefined,
    from: p.get("from") || undefined,
    to: p.get("to") || undefined,
  };
  const gran = p.get("granularity") === "day" ? "day" : "month";
  const rows = filterGeneration(opts);

  // time series
  const bucket = new Map<string, number>();
  for (const r of rows) {
    const key = gran === "day" ? r.date : r.date.slice(0, 7);
    bucket.set(key, (bucket.get(key) || 0) + r.mwh_generated);
  }
  const series = [...bucket.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, mwh]) => ({ period, gwh: round(mwh / 1000, 2) }));

  // breakdown by source type
  const byType = new Map<string, number>();
  for (const r of rows) {
    const t = facType.get(r.facility_id)!;
    byType.set(t, (byType.get(t) || 0) + r.mwh_generated);
  }
  const breakdown = [...byType.entries()]
    .map(([type, mwh]) => ({ type, gwh: round(mwh / 1000, 1) }))
    .sort((a, b) => b.gwh - a.gwh);

  return NextResponse.json(
    { granularity: gran, series, breakdown },
    { headers: { "x-api-version": "v1" } }
  );
}
