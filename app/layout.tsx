import type { Metadata } from "next";
import "@blocknote/shadcn/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grapho — Write freely.",
  description:
    "Grapho is a lightning-fast, offline-first note-taking app. Instant, private, and limitless.",
  applicationName: "Grapho",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
