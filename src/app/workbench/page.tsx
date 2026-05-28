"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { runSql, getDb, type QueryResult } from "@/lib/sqlClient";

const EXAMPLES: { label: string; sql: string }[] = [
  {
    label: "Generation by source",
    sql: `SELECT f.type AS source,
       ROUND(SUM(g.mwh_generated)/1000.0, 1) AS gwh
FROM generation g
JOIN facilities f ON f.facility_id = g.facility_id
GROUP BY f.type
ORDER BY gwh DESC;`,
  },
  {
    label: "Top 5 facilities by capacity factor",
    sql: `SELECT f.name, f.type,
       ROUND(AVG(g.capacity_factor)*100, 1) AS avg_cf_pct
FROM generation g
JOIN facilities f ON f.facility_id = g.facility_id
GROUP BY f.facility_id
ORDER BY avg_cf_pct DESC
LIMIT 5;`,
  },
  {
    label: "Incidents by severity & region",
    sql: `SELECT r.name AS region, i.severity,
       COUNT(*) AS incidents,
       ROUND(SUM(i.downtime_hours), 1) AS downtime_hrs
FROM incidents i
JOIN facilities f ON f.facility_id = i.facility_id
JOIN regions r ON r.region_id = f.region_id
GROUP BY r.name, i.severity
ORDER BY downtime_hrs DESC;`,
  },
  {
    label: "Monthly clean-energy share",
    sql: `SELECT substr(g.date,1,7) AS month,
  ROUND(100.0*SUM(CASE WHEN f.type IN ('Solar','Wind','Hydro','Nuclear','Geothermal')
       THEN g.mwh_generated ELSE 0 END)/SUM(g.mwh_generated), 1) AS clean_pct
FROM generation g
JOIN facilities f ON f.facility_id = g.facility_id
GROUP BY month
ORDER BY month;`,
  },
];

export default function Workbench() {
  const [sql, setSql] = useState(EXAMPLES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getDb().then(() => setReady(true)).catch((e) => setError(String(e)));
  }, []);

  async function execute() {
    setRunning(true);
    setError(null);
    const t0 = performance.now();
    try {
      const r = await runSql(sql);
      setResult(r);
      setMs(Math.round(performance.now() - t0));
    } catch (e: any) {
      setError(e.message || String(e));
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (ready) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <>
      <PageHeader
        code="SQL"
        title="SQL Workbench"
        subtitle="A live SQLite engine running fully in your browser (sql.js / WASM). Write any read-only query against the warehouse — joins, CTEs, window functions all supported."
        right={
          <Badge tone={ready ? "#4ade80" : "#fbbf24"}>{ready ? "engine ready" : "loading engine…"}</Badge>
        }
      />
      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 14 }}>
          <Panel title="Saved Queries" sub="Click to load">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setSql(ex.sql)}
                  style={{
                    textAlign: "left", cursor: "pointer", padding: "10px 12px", borderRadius: 9,
                    border: "1px solid #1e2735", background: "#0b101a", color: "#c9d4e3",
                    fontSize: 12.5, fontWeight: 600,
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel
            title="Query Editor"
            sub="⌘/Ctrl + Enter to run"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <textarea
              ref={taRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") execute();
              }}
              spellCheck={false}
              style={{
                width: "100%", minHeight: 200, resize: "vertical",
                background: "#070a10", color: "#c9d4e3", border: "1px solid #1e2735",
                borderRadius: 10, padding: 14, fontFamily: "var(--font-mono)", fontSize: 13,
                lineHeight: 1.55, outline: "none",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button
                onClick={execute}
                disabled={!ready || running}
                style={{
                  cursor: ready ? "pointer" : "not-allowed", padding: "9px 20px", borderRadius: 9,
                  border: "1px solid rgba(255,176,0,0.4)", background: "linear-gradient(180deg,#ffb000,#d68f00)",
                  color: "#070a10", fontWeight: 700, fontSize: 13.5, opacity: ready ? 1 : 0.6,
                }}
              >
                {running ? "Running…" : "▶ Run Query"}
              </button>
              {ms !== null && !error && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#6b7a90" }}>
                  {result?.rows.length ?? 0} rows · {ms} ms
                </span>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="Results">
          {error ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#f87171", padding: 8 }}>
              ✗ {error}
            </div>
          ) : result && result.columns.length ? (
            <div style={{ overflow: "auto", maxHeight: 420, border: "1px solid #141b27", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                <thead>
                  <tr>
                    {result.columns.map((c) => (
                      <th key={c} style={{ position: "sticky", top: 0, textAlign: "left", padding: "10px 14px", background: "#141b27", color: "#ffb000", borderBottom: "1px solid #1e2735", whiteSpace: "nowrap" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 ? "#0b101a" : "transparent" }}>
                      {row.map((cell, j) => (
                        <td key={j} className="tnum" style={{ padding: "8px 14px", borderBottom: "1px solid #141b27", color: typeof cell === "number" ? "#fff" : "#c9d4e3", whiteSpace: "nowrap" }}>
                          {cell === null ? "∅" : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: "#6b7a90", fontSize: 13 }}>No rows.</div>
          )}
        </Panel>
      </div>
    </>
  );
}
