import type { Metadata } from "next";

import type { ReactNode } from "react";
import "./globals.css";


export const metadata: Metadata = {
  title: "Grapho",
  description: "Write freely. Instantly. Without limits.",
  icons: {
    icon: "/Branding/png-logo.png",
    apple: "/Branding/png-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
