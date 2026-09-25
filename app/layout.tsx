import "@fontsource-variable/inter";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Estructura } from "@/components/layout/estructura";

export const metadata: Metadata = {
  title: "Garantías 360 · Banco Popular",
  description: "Maestro de garantías: ciclo de vida, cobertura explicable y evidencia verificable.",
  icons: { icon: "/marca/isotipo.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO">
      <body>
        <Providers>
          <Estructura>{children}</Estructura>
        </Providers>
      </body>
    </html>
  );
}
