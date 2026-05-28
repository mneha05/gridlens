"use client";

import React from "react";

export function PageHeader({
  code, title, subtitle, right,
}: { code: string; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 5, padding: "20px 32px",
        borderBottom: "1px solid #1e2735",
        background: "linear-gradient(180deg, rgba(7,10,16,0.92), rgba(7,10,16,0.7))",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16,
      }}
    >
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2, color: "#ffb000", marginBottom: 6 }}>
          {code} ·· GRIDLENS
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 27, fontWeight: 800, margin: 0, color: "#fff", letterSpacing: -0.6 }}>
          {title}
        </h1>
        <p style={{ margin: "5px 0 0", color: "#6b7a90", fontSize: 13.5, maxWidth: 620 }}>{subtitle}</p>
      </div>
      {right}
    </header>
  );
}

export function Panel({
  title, sub, children, style, scanning,
}: { title?: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties; scanning?: boolean }) {
  return (
    <section
      className={scanning ? "scanning" : ""}
      style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg,#0e131c,#0b101a)",
        border: "1px solid #1e2735", borderRadius: 14, ...style,
      }}
    >
      {(title || sub) && (
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e2735", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            {title && <div style={{ fontWeight: 700, fontSize: 14, color: "#e6edf6" }}>{title}</div>}
            {sub && <div style={{ fontSize: 11.5, color: "#6b7a90", marginTop: 2 }}>{sub}</div>}
          </div>
        </div>
      )}
      <div style={{ padding: 18 }}>{children}</div>
    </section>
  );
}

export function Stat({
  label, value, unit, delta, accent = "#ffb000",
}: { label: string; value: string; unit?: string; delta?: string; accent?: string }) {
  const up = delta?.startsWith("+");
  return (
    <div
      className="rise"
      style={{
        background: "linear-gradient(180deg,#0e131c,#0b101a)", border: "1px solid #1e2735",
        borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: accent }} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: 1, color: "#6b7a90", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span className="tnum" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: "#6b7a90", fontWeight: 600 }}>{unit}</span>}
      </div>
      {delta && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11.5, color: up ? "#4ade80" : "#f87171" }}>
          {up ? "▲" : "▼"} {delta.replace(/^[+-]/, "")} vs prior period
        </div>
      )}
    </div>
  );
}

export function Badge({ children, tone = "#3fd0d4" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, padding: "3px 8px",
      borderRadius: 6, color: tone, background: tone + "1a", border: `1px solid ${tone}40`,
    }}>
      {children}
    </span>
  );
}
