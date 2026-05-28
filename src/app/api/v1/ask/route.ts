import { NextRequest, NextResponse } from "next/server";

const SCHEMA = `
regions(region_id, name, grid_operator)
facilities(facility_id, name, region_id, type[Solar|Wind|Hydro|Nuclear|Gas|Geothermal], capacity_mw, commissioned_year, lat, lon)
generation(reading_id, facility_id, date 'YYYY-MM-DD', mwh_generated, capacity_factor 0..1, co2_tons)
incidents(incident_id, facility_id, date, severity[Low|Medium|High|Critical], category, downtime_hours)
Joins: generation.facility_id = facilities.facility_id ; facilities.region_id = regions.region_id
Date range: 2025-01-01 .. 2025-12-31 (SQLite date functions available).
`.trim();

const SYSTEM = `You are GridLens Analyst, a senior data analyst for a power-grid operator.
You translate questions into ONE valid SQLite SELECT query against this schema:

${SCHEMA}

Rules:
- Output STRICT JSON only, no markdown, no prose outside JSON.
- Shape: {"sql": string, "explanation": string, "chart": {"type":"bar"|"line"|"none","x":string,"y":string}}
- "sql" must be a single read-only SELECT (never INSERT/UPDATE/DELETE/DROP/PRAGMA/ATTACH). Alias aggregates with clear names. LIMIT large results to <= 50 rows.
- "explanation" is one plain-English sentence describing what the query answers.
- "chart.x"/"chart.y" must be column aliases present in the SELECT. Use "none" if a chart doesn't help.
- Prefer GWh (mwh/1000.0) for readability when summing mwh_generated; round to 1-2 decimals with ROUND().`;

const BLOCK = /\b(insert|update|delete|drop|alter|create|attach|pragma|replace|truncate)\b/i;

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

  let question = "";
  try {
    ({ question } = await req.json());
  } catch {
    return NextResponse.json({ error: "Body must be JSON: { question }" }, { status: 400 });
  }
  if (!question?.trim()) {
    return NextResponse.json({ error: "Missing 'question'." }, { status: 400 });
  }

  // Graceful no-key mode — keeps the deployed demo from ever 500-ing.
  if (!key) {
    return NextResponse.json({
      keyless: true,
      message:
        "AI Analyst is dormant: no ANTHROPIC_API_KEY is set. Add one in your Vercel project settings (Environment Variables) to enable natural-language querying. Every other tab works without it.",
    });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: SYSTEM,
        messages: [{ role: "user", content: question }],
      }),
    });
    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json({ error: `Anthropic API error (${r.status})`, detail }, { status: 502 });
    }
    const data = await r.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: "Model returned non-JSON.", raw: text }, { status: 502 });
    }

    if (typeof parsed.sql !== "string" || BLOCK.test(parsed.sql) || !/^\s*select/i.test(parsed.sql)) {
      return NextResponse.json({ error: "Generated query was not a safe read-only SELECT.", sql: parsed.sql }, { status: 422 });
    }

    return NextResponse.json(parsed, { headers: { "x-api-version": "v1" } });
  } catch (e: any) {
    return NextResponse.json({ error: "Upstream failure", detail: String(e?.message || e) }, { status: 502 });
  }
}
