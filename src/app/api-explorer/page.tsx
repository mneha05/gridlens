"use client";

import { useState } from "react";
import { PageHeader, Panel, Badge } from "@/components/ui";

type Ep = {
  method: "GET" | "POST";
  path: string;
  desc: string;
  params?: { name: string; example: string; note: string }[];
  body?: string;
};

const ENDPOINTS: Ep[] = [
  { method: "GET", path: "/api/v1/health", desc: "Service status, dataset metadata, and the endpoint catalog." },
  {
    method: "GET", path: "/api/v1/metrics", desc: "Aggregate KPIs across the fleet.",
    params: [
      { name: "type", example: "Solar", note: "Filter by generation source" },
      { name: "region", example: "Desert Southwest", note: "Filter by region name" },
      { name: "from", example: "2025-06-01", note: "Start date (inclusive)" },
      { name: "to", example: "2025-08-31", note: "End date (inclusive)" },
    ],
  },
  {
    method: "GET", path: "/api/v1/facilities", desc: "Facility roster with YTD generation rollups.",
    params: [
      { name: "type", example: "Wind", note: "Filter by source" },
      { name: "region", example: "Texas Interconnect", note: "Filter by region" },
    ],
  },
  {
    method: "GET", path: "/api/v1/generation", desc: "Generation time-series + source breakdown.",
    params: [
      { name: "granularity", example: "month", note: "month | day" },
      { name: "type", example: "Hydro", note: "Filter by source" },
    ],
  },
  {
    method: "POST", path: "/api/v1/ask", desc: "AI Analyst — natural-language question → generated SQL.",
    body: `{ "question": "Top 3 facilities by generation" }`,
  },
];

export default function ApiConsole() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState(ENDPOINTS[0].body || "");
  const [resp, setResp] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const ep = ENDPOINTS[active];

  function selectEp(i: number) {
    setActive(i);
    setQuery("");
    setBody(ENDPOINTS[i].body || "");
    setResp("");
    setStatus(null);
  }

  async function send() {
    setLoading(true);
    setResp("");
    try {
      const url = ep.path + (ep.method === "GET" && query ? `?${query}` : "");
      const opts: RequestInit =
        ep.method === "POST"
          ? { method: "POST", headers: { "content-type": "application/json" }, body }
          : {};
      const r = await fetch(url, opts);
      setStatus(r.status);
      const json = await r.json();
      setResp(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setResp(String(e));
      setStatus(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        code="API"
        title="Integration Console"
        subtitle="A versioned, documented REST API powers every screen in GridLens. Authenticated services consume the same /api/v1 surface — this is the integration layer, dogfooded."
        right={<Badge tone="#3fd0d4">REST · v1</Badge>}
      />

      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
        <Panel title="Endpoints" sub="5 routes · versioned">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ENDPOINTS.map((e, i) => (
              <button
                key={e.path}
                onClick={() => selectEp(i)}
                style={{
                  textAlign: "left", cursor: "pointer", padding: "11px 12px", borderRadius: 9,
                  border: "1px solid " + (active === i ? "rgba(63,208,212,0.4)" : "#1e2735"),
                  background: active === i ? "rgba(63,208,212,0.08)" : "#0b101a",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5,
                  color: e.method === "GET" ? "#4ade80" : "#fbbf24",
                  background: (e.method === "GET" ? "#4ade80" : "#fbbf24") + "1a",
                }}>{e.method}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: active === i ? "#fff" : "#c9d4e3" }}>
                  {e.path.replace("/api/v1", "")}
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel
            title={`${ep.method} ${ep.path}`}
            sub={ep.desc}
          >
            {ep.params && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, color: "#6b7a90", fontFamily: "var(--font-mono)", marginBottom: 8 }}>QUERY PARAMETERS</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <tbody>
                    {ep.params.map((p) => (
                      <tr key={p.name}>
                        <td style={{ padding: "5px 10px 5px 0", fontFamily: "var(--font-mono)", color: "#3fd0d4", whiteSpace: "nowrap" }}>{p.name}</td>
                        <td style={{ padding: "5px 0", color: "#6b7a90" }}>{p.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={ep.params.map((p) => `${p.name}=${p.example}`).join("&")}
                  style={{ width: "100%", marginTop: 10, background: "#070a10", border: "1px solid #1e2735", borderRadius: 9, padding: "10px 13px", color: "#e6edf6", fontFamily: "var(--font-mono)", fontSize: 12.5, outline: "none" }}
                />
              </div>
            )}
            {ep.method === "POST" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, color: "#6b7a90", fontFamily: "var(--font-mono)", marginBottom: 8 }}>REQUEST BODY (JSON)</div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck={false}
                  style={{ width: "100%", minHeight: 70, background: "#070a10", border: "1px solid #1e2735", borderRadius: 9, padding: 13, color: "#e6edf6", fontFamily: "var(--font-mono)", fontSize: 12.5, outline: "none" }}
                />
              </div>
            )}
            <button
              onClick={send}
              disabled={loading}
              style={{ cursor: "pointer", padding: "9px 22px", borderRadius: 9, border: "1px solid rgba(63,208,212,0.4)", background: "linear-gradient(180deg,#3fd0d4,#2aa9ad)", color: "#070a10", fontWeight: 700, fontSize: 13.5 }}
            >
              {loading ? "Sending…" : "▶ Send Request"}
            </button>
          </Panel>

          <Panel
            title="Response"
            sub={status !== null ? `HTTP ${status}` : "—"}
          >
            <pre style={{ margin: 0, maxHeight: 380, overflow: "auto", background: "#070a10", border: "1px solid #141b27", borderRadius: 10, padding: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "#c9d4e3", lineHeight: 1.5 }}>
{resp || "// Send a request to see the response"}
            </pre>
          </Panel>
        </div>
      </div>
    </>
  );
}
