import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
      <body className={geistMono.variable} suppressHydrationWarning>{children}</body>
    </html>
  );
}
