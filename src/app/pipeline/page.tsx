"use client";

import { useEffect, useState } from "react";
import { PageHeader, Panel, Badge } from "@/components/ui";

const STAGES = [
  { code: "01", name: "Extract", tool: "Python · csv", desc: "Pull operational telemetry from 4 source systems into raw CSV.", color: "#3fd0d4" },
  { code: "02", name: "Transform", tool: "derive · validate", desc: "Compute capacity factor, CO₂, availability; enforce data-quality contracts.", color: "#ffb000" },
  { code: "03", name: "Load", tool: "JSON · SQLite", desc: "Emit warehouse snapshot; hydrate in-browser SQLite for self-service analytics.", color: "#4ade80" },
];

const CHECKS = [
  { rule: "capacity_factor ∈ [0, 1]", table: "generation", status: "pass" },
  { rule: "mwh_generated ≥ 0", table: "generation", status: "pass" },
  { rule: "commissioned_year ∈ (1900, 2026]", table: "facilities", status: "pass" },
  { rule: "capacity_mw > 0", table: "facilities", status: "pass" },
  { rule: "downtime_hours ≥ 0", table: "incidents", status: "pass" },
  { rule: "region_id NOT NULL", table: "regions", status: "pass" },
];

export default function Pipeline() {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => {
    fetch("/api/v1/health").then((r) => r.json()).then((d) => setMeta(d.dataset));
  }, []);

  return (
    <>
      <PageHeader
        code="ETL"
        title="Data Pipeline & Lineage"
        subtitle="A reproducible Extract → Transform → Load pipeline (etl/build_dataset.py) with enforced data-quality contracts feeds the warehouse. Deterministic seed = reproducible analytics."
        right={<Badge tone="#4ade80">last run: green</Badge>}
      />

      <div style={{ padding: "26px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* LINEAGE */}
        <Panel title="Pipeline Lineage" sub="3 stages · 4 source tables → 1 warehouse">
          <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {STAGES.map((s, i) => (
              <div key={s.code} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{ flex: 1, background: "#070a10", border: `1px solid ${s.color}40`, borderRadius: 12, padding: 18, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: 3, background: s.color }} />
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: s.color }}>STAGE {s.code}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: "#fff", margin: "6px 0 4px" }}>{s.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: s.color, marginBottom: 10 }}>{s.tool}</div>
                  <div style={{ fontSize: 12.5, color: "#6b7a90", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{ width: 36, textAlign: "center", color: "#2a3650", fontSize: 22 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* QUALITY */}
          <Panel title="Data Quality Contracts" sub="Enforced at transform time — build fails if violated">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {CHECKS.map((c) => (
                <div key={c.rule} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid #141b27" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#4ade80", fontSize: 13 }}>✓</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#c9d4e3" }}>{c.rule}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b7a90" }}>{c.table}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* WAREHOUSE STATS */}
          <Panel title="Warehouse Snapshot" sub={meta ? `${meta.date_range[0]} → ${meta.date_range[1]}` : "loading…"}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {meta &&
                Object.entries(meta.generated_rows).map(([table, n]: any) => (
                  <div key={table} style={{ background: "#070a10", border: "1px solid #1e2735", borderRadius: 10, padding: "14px 16px" }}>
                    <div className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: "#fff" }}>{n.toLocaleString()}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b7a90", textTransform: "uppercase", letterSpacing: 1 }}>{table}</div>
                  </div>
                ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 12.5, color: "#6b7a90", lineHeight: 1.6 }}>
              Re-run the pipeline anytime with <span style={{ fontFamily: "var(--font-mono)", color: "#ffb000" }}>npm run etl</span>. Output is deterministic (seeded), so dashboards stay reproducible across builds.
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
