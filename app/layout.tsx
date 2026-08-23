import type { Metadata } from "next";
import "./globals.css";
import { TRIP_CONFIG } from "@/lib/types";

export const metadata: Metadata = {
  title: TRIP_CONFIG.title,
  description: TRIP_CONFIG.subtitle,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-void text-ivory">{children}</body>
    </html>
  );
}
