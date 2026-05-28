"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { runSql, type QueryResult } from "@/lib/sqlClient";

const SUGGESTIONS = [
  "Which region generated the most clean energy?",
  "Show monthly capacity factor for wind facilities",
  "Top 5 facilities by total downtime",
  "Compare nuclear vs solar generation by month",
];

type AgentState = {
  sql?: string; explanation?: string;
  chart?: { type: string; x: string; y: string };
  result?: QueryResult; error?: string; keyless?: boolean; message?: string;
};

export default function Analyst() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<AgentState | null>(null);
  const [step, setStep] = useState("");

  async function ask(question: string) {
    if (!question.trim()) return;
    setBusy(true);
    setState(null);
    setStep("Interpreting your question…");
    try {
      const res = await fetch("/api/v1/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      }).then((r) => r.json());

      if (res.keyless) {
        setState({ keyless: true, message: res.message });
        return;
      }
      if (res.error) {
        setState({ error: res.error + (res.detail ? ` — ${res.detail}` : "") });
        return;
      }
      setStep("Running generated SQL on the engine…");
      const result = await runSql(res.sql);
      setState({ sql: res.sql, explanation: res.explanation, chart: res.chart, result });
    } catch (e: any) {
      setState({ error: e.message || String(e) });
    } finally {
      setBusy(false);
      setStep("");
    }
  }

  const chartData =
    state?.result && state.chart && state.chart.type !== "none"
      ? state.result.rows.map((row) => {
          const o: any = {};
          state.result!.columns.forEach((c, i) => (o[c] = row[i]));
          return o;
        })
      : null;

  return (
    <>
      <PageHeader
        code="AI"
        title="AI Analyst"
        subtitle="Ask in plain English. The agent writes SQL against the warehouse, runs it on the live engine, and visualizes the answer. Read-only and sandboxed."
        right={<Badge tone="#a78bfa">agentic NL → SQL</Badge>}
      />

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 1000 }}>
        <Panel style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(q)}
              placeholder="e.g. Which source had the highest capacity factor in summer?"
              style={{
                flex: 1, background: "#070a10", border: "1px solid #1e2735", borderRadius: 10,
                padding: "13px 16px", color: "#e6edf6", fontSize: 14, outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
            <button
              onClick={() => ask(q)}
              disabled={busy}
              style={{
                cursor: "pointer", padding: "0 24px", borderRadius: 10, border: "none",
                background: "linear-gradient(180deg,#a78bfa,#7c5cf0)", color: "#fff",
                fontWeight: 700, fontSize: 14,
              }}
            >
              {busy ? "Thinking…" : "Ask"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setQ(s); ask(s); }}
                style={{
                  cursor: "pointer", fontSize: 12, padding: "6px 11px", borderRadius: 20,
                  border: "1px solid #1e2735", background: "#0b101a", color: "#6b7a90",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Panel>

        {busy && (
          <Panel scanning>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#a78bfa" }}>⟳ {step}</div>
          </Panel>
        )}

        {state?.keyless && (
          <Panel title="AI Analyst is dormant" sub="One environment variable away from working">
            <p style={{ color: "#c9d4e3", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{state.message}</p>
            <div style={{ marginTop: 14, background: "#070a10", border: "1px solid #1e2735", borderRadius: 10, padding: 14, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#6b7a90" }}>
              Vercel → Project → Settings → Environment Variables<br />
              <span style={{ color: "#ffb000" }}>ANTHROPIC_API_KEY</span> = sk-ant-…  →  Redeploy
            </div>
          </Panel>
        )}

        {state?.error && (
          <Panel title="Could not answer">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#f87171" }}>✗ {state.error}</div>
          </Panel>
        )}

        {state?.sql && (
          <>
            <Panel title="Answer" sub="Generated by the agent">
              <p style={{ color: "#e6edf6", fontSize: 15, lineHeight: 1.6, margin: "0 0 14px" }}>{state.explanation}</p>
              <details>
                <summary style={{ cursor: "pointer", fontSize: 12.5, color: "#a78bfa", fontFamily: "var(--font-mono)" }}>view generated SQL</summary>
                <pre style={{ marginTop: 10, background: "#070a10", border: "1px solid #1e2735", borderRadius: 10, padding: 14, overflow: "auto", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#3fd0d4" }}>
{state.sql}
                </pre>
              </details>
            </Panel>

            {chartData && chartData.length > 0 && (
              <Panel title="Visualization">
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {state.chart!.type === "line" ? (
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="#1e2735" strokeDasharray="3 4" vertical={false} />
                        <XAxis dataKey={state.chart!.x} stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                        <YAxis stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                        <Tooltip contentStyle={{ background: "#0b101a", border: "1px solid #1e2735", borderRadius: 10 }} />
                        <Line type="monotone" dataKey={state.chart!.y} stroke="#a78bfa" strokeWidth={2} dot={false} />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid stroke="#1e2735" strokeDasharray="3 4" vertical={false} />
                        <XAxis dataKey={state.chart!.x} stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                        <YAxis stroke="#6b7a90" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                        <Tooltip contentStyle={{ background: "#0b101a", border: "1px solid #1e2735", borderRadius: 10 }} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey={state.chart!.y} fill="#a78bfa" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Panel>
            )}

            {state.result && (
              <Panel title="Data">
                <div style={{ overflow: "auto", maxHeight: 320, border: "1px solid #141b27", borderRadius: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        {state.result.columns.map((c) => (
                          <th key={c} style={{ position: "sticky", top: 0, textAlign: "left", padding: "10px 14px", background: "#141b27", color: "#a78bfa", borderBottom: "1px solid #1e2735" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {state.result.rows.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 ? "#0b101a" : "transparent" }}>
                          {row.map((cell, j) => (
                            <td key={j} className="tnum" style={{ padding: "8px 14px", borderBottom: "1px solid #141b27", color: typeof cell === "number" ? "#fff" : "#c9d4e3" }}>
                              {cell === null ? "∅" : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </>
  );
}
