import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transito — Suivi des importations",
  description: "Pilotez vos dossiers d’importation, vos échéances et vos documents depuis un seul espace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
