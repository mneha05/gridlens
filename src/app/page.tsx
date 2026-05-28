"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { PageHeader, Panel, Stat, Badge } from "@/components/ui";

const TYPES = ["All", "Solar", "Wind", "Hydro", "Nuclear", "Gas", "Geothermal"];
const TYPE_COLOR: Record<string, string> = {
  Solar: "#ffb000", Wind: "#3fd0d4", Hydro: "#60a5fa",
  Nuclear: "#a78bfa", Gas: "#f87171", Geothermal: "#fb923c",
};

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default function Dashboard() {
  const [type, setType] = useState("All");
  const [kpis, setKpis] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = type === "All" ? "" : `?type=${type}`;
    setLoading(true);
    Promise.all([
      fetch(`/api/v1/metrics${q}`).then((r) => r.json()),
      fetch(`/api/v1/generation${q}`).then((r) => r.json()),
      fetch(`/api/v1/facilities${q}`).then((r) => r.json()),
    ]).then(([m, g, f]) => {
      setKpis(m.kpis);
      setSeries(g.series);
      setBreakdown(g.breakdown);
      setFacilities(f.facilities.slice(0, 6));
      setLoading(false);
    });
  }, [type]);

  return (
    <>
      <PageHeader
        code="OPS"
        title="Grid Operations Center"
        subtitle="Real-time generation, reliability, and emissions across the fleet. All tiles are served live by the GridLens v1 REST API."
        right={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 360 }}>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11.5,
                  padding: "6px 11px", borderRadius: 8,
                  border: "1px solid " + (type === t ? "rgba(255,176,0,0.4)" : "#1e2735"),
                  background: type === t ? "rgba(255,176,0,0.14)" : "#0e131c",
                  color: type === t ? "#ffb000" : "#6b7a90", transition: "all .15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ padding: "26px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* KPI ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <Stat label="Net Generation" value={kpis ? fmt(kpis.total_generation_gwh) : "—"} unit="GWh" delta="+4.2%" accent="#ffb000" />
          <Stat label="Fleet Capacity Factor" value={kpis ? (kpis.avg_capacity_factor * 100).toFixed(1) : "—"} unit="%" delta="+1.1%" accent="#3fd0d4" />
          <Stat label="Availability" value={kpis ? kpis.availability_pct.toFixed(1) : "—"} unit="%" delta="+0.4%" accent="#4ade80" />
          <Stat label="CO₂ Avoided" value={kpis ? fmt(Math.round(kpis.co2_avoided_tons / 1000)) : "—"} unit="kt" delta="+6.8%" accent="#60a5fa" />
        </div>

        {/* MAIN CHART + BREAKDOWN */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <Panel title="Monthly Net Generation" sub="GWh delivered to the grid · GET /api/v1/generation" scanning={loading}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffb000" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#ffb000" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e2735" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="period" stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} />
                  <YAxis stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0b101a", border: "1px solid #1e2735", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12 }}
                    labelStyle={{ color: "#ffb000" }} itemStyle={{ color: "#c9d4e3" }}
                  />
                  <Area type="monotone" dataKey="gwh" stroke="#ffb000" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Source Mix" sub="GWh by generation type">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} layout="vertical" margin={{ left: 14, right: 14 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="type" width={72} stroke="#6b7a90" tick={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0b101a", border: "1px solid #1e2735", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12 }}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar dataKey="gwh" radius={[0, 6, 6, 0]}>
                    {breakdown.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLOR[d.type] || "#6b7a90"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* TOP FACILITIES + STATUS */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <Panel title="Top Performing Facilities" sub="Ranked by YTD generation · GET /api/v1/facilities">
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {facilities.map((f, i) => {
                const max = facilities[0]?.ytd_generation_gwh || 1;
                return (
                  <div key={f.facility_id} style={{ display: "grid", gridTemplateColumns: "22px 1fr 120px 80px", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: "1px solid #141b27" }}>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#6b7a90", fontSize: 12 }}>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e6edf6" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: "#6b7a90" }}>{f.region}</div>
                    </div>
                    <div style={{ height: 6, background: "#141b27", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(f.ytd_generation_gwh / max) * 100}%`, background: TYPE_COLOR[f.type] || "#ffb000" }} />
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#fff" }} className="tnum">
                      {f.ytd_generation_gwh} <span style={{ color: "#6b7a90" }}>GWh</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Fleet Status">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="Active facilities" value={kpis?.active_facilities ?? "—"} />
              <Row label="Homes powered (est.)" value={kpis ? fmt(kpis.homes_powered_est) : "—"} />
              <Row label="Open incidents" value={kpis?.open_incidents ?? "—"} tone="#fbbf24" />
              <Row label="Downtime (hrs YTD)" value={kpis ? fmt(kpis.total_downtime_hours) : "—"} tone="#f87171" />
              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge>SLA 99.4%</Badge>
                <Badge tone="#4ade80">NERC compliant</Badge>
                <Badge tone="#ffb000">v1 API</Badge>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, tone = "#fff" }: { label: string; value: any; tone?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 12, borderBottom: "1px solid #141b27" }}>
      <span style={{ fontSize: 13, color: "#6b7a90" }}>{label}</span>
      <span className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: tone }}>{value}</span>
    </div>
  );
}
