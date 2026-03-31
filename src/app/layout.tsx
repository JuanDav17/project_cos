import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "GroupCOS | Plataforma de Reportes de Calidad",
  description: "Portal unificado para Reportes de Calidad y Reportes de Calidad Reincidentes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
