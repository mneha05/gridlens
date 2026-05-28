"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Operations", code: "OPS", desc: "Live dashboard" },
  { href: "/workbench", label: "SQL Workbench", code: "SQL", desc: "Query the warehouse" },
  { href: "/analyst", label: "AI Analyst", code: "AI", desc: "Ask in plain English" },
  { href: "/api-explorer", label: "API Console", code: "API", desc: "Integration endpoints" },
  { href: "/pipeline", label: "Data Pipeline", code: "ETL", desc: "Lineage & quality" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div style={{ position: "relative", zIndex: 1, display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 248, flexShrink: 0, borderRight: "1px solid #1e2735",
          background: "linear-gradient(180deg,#0b101a,#080b12)",
          padding: "22px 16px", position: "sticky", top: 0, height: "100vh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 6px 22px" }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center",
              background: "radial-gradient(circle at 30% 30%,#ffb000,#b97400)",
              boxShadow: "0 0 18px rgba(255,176,0,0.35)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="#080b12" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, letterSpacing: -0.5, color: "#fff" }}>
              GridLens
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, letterSpacing: 1.5, color: "#6b7a90", textTransform: "uppercase" }}>
              Grid Intelligence
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                  borderRadius: 10, textDecoration: "none",
                  background: active ? "linear-gradient(90deg,rgba(255,176,0,0.14),rgba(255,176,0,0.02))" : "transparent",
                  border: active ? "1px solid rgba(255,176,0,0.3)" : "1px solid transparent",
                  transition: "background .15s,border .15s",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600,
                    width: 32, textAlign: "center", padding: "3px 0", borderRadius: 5,
                    color: active ? "#ffb000" : "#6b7a90",
                    background: active ? "rgba(255,176,0,0.12)" : "#141b27",
                    border: "1px solid " + (active ? "rgba(255,176,0,0.25)" : "#1e2735"),
                  }}
                >
                  {n.code}
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: active ? "#fff" : "#c9d4e3" }}>
                    {n.label}
                  </span>
                  <span style={{ display: "block", fontSize: 11, color: "#6b7a90" }}>{n.desc}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid #1e2735", paddingTop: 14, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px" }}>
            <span className="live-dot" style={{ width: 8, height: 8, borderRadius: 8, background: "#4ade80" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#6b7a90" }}>
              warehouse online
            </span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "0 0 60px" }}>{children}</main>
    </div>
  );
}
