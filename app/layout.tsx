import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavClient from "./NavClient";

export const metadata: Metadata = {
  title: "FixScan AI — See it. Report it. Fix it.",
  description: "FixScan AI turns a photo or complaint into a diagnosed, prioritised repair task in 30 seconds.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavClient />
        <main>{children}</main>
        <footer className="footer">
          <p>
            FixScan AI &nbsp;·&nbsp; NEURA X 2026, Track 1: Smart Property AI
            &nbsp;·&nbsp; AI outputs are triage only, not a professional inspection.
          </p>
        </footer>
      </body>
    </html>
  );
}
