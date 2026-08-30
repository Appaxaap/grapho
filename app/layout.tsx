import type { Metadata } from "next";

import type { ReactNode } from "react";
import "./globals.css";


export const metadata: Metadata = {

  title: "Grapho | Write beautifully. Organize simply. Export professionally.",
  description: "A beautiful, local-first writing and document app for creating work that is ready to share.",
  openGraph: {
    type: "website",
    title: "Grapho | Write beautifully. Organize simply. Export professionally.",
    description: "A beautiful, local-first writing and document app for creating work that is ready to share.",
    url: "https://github.com/Appaxaap/grapho",
    siteName: "Grapho",
    images: [{ url: "https://raw.githubusercontent.com/Appaxaap/grapho/main/public/Branding/Social%20Preview.png", width: 1600, height: 900, alt: "Grapho - Write beautifully. Organize simply. Export professionally." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grapho | Write beautifully. Organize simply. Export professionally.",
    description: "A beautiful, local-first writing and document app for creating work that is ready to share.",
    images: ["https://raw.githubusercontent.com/Appaxaap/grapho/main/public/Branding/Social%20Preview.png"],
  },
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
