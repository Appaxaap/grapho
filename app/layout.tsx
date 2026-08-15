import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "Grapho",
  description: "Write without limits. Local-first notes and document workspace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
