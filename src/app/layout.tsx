import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "GridLens — Energy Analytics & Integration Platform",
  description:
    "Self-service analytics, enterprise reporting, full-lifecycle API management, and an AI analyst for power-grid operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
            --font-body: 'Hanken Grotesk', system-ui, sans-serif;
            --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
          }
        `}</style>
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
