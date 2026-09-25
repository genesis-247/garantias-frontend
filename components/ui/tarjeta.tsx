import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/formato";

export function Tarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const fondo = className?.split(" ").some((c) => c.startsWith("bg-")) ? "" : "bg-white";
  return <section className={cn("rounded-dg-12 border border-light-600 shadow-card", fondo, className)} {...props} />;
}

export function EncabezadoTarjeta({ titulo, subtitulo, acciones }: { titulo: ReactNode; subtitulo?: ReactNode; acciones?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-light-600 px-5 py-4">
      <div>
        <h2 className="text-s2 font-semibold text-dark-600">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-b3 text-mid-600">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </header>
  );
}

export function CuerpoTarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
