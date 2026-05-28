import { NextResponse } from "next/server";
import { meta } from "@/lib/dataset";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      status: "operational",
      service: "gridlens-api",
      version: "v1",
      uptime_check: new Date().toISOString(),
      dataset: meta,
      endpoints: [
        "GET /api/v1/health",
        "GET /api/v1/metrics?type=&region=&from=&to=",
        "GET /api/v1/facilities?type=&region=",
        "GET /api/v1/generation?type=&region=&granularity=month|day",
        "POST /api/v1/ask  { question }",
      ],
    },
    { headers: { "x-api-version": "v1", "cache-control": "public, max-age=60" } }
  );
}
