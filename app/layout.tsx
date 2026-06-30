import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";

export const metadata: Metadata = {
  title: "AgentVerse — AI Marketplace",
  description:
    "The decentralized marketplace for sovereign intelligence, autonomous workflows, and AI assets powered by Stellar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
