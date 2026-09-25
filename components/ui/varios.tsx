"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircle, Inbox, X } from "lucide-react";
import { cn } from "@/lib/formato";
import { ErrorApi } from "@/lib/api";

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-dg-8 bg-light-600", className)} aria-hidden />;
}

export function Vacio({ titulo, detalle, icono }: { titulo: string; detalle?: string; icono?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-900">{icono ?? <Inbox className="h-6 w-6" aria-hidden />}</div>
      <p className="text-s2 font-semibold text-dark-600">{titulo}</p>
      {detalle && <p className="max-w-md text-b2 text-mid-600">{detalle}</p>}
    </div>
  );
}

/** Mensaje de error de la API: qué pasó, detalles y Correlation ID para soporte. */
export function MensajeError({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error instanceof ErrorApi ? error : null;
  return (
    <div role="alert" className="rounded-dg-8 border border-error-600 bg-error-100 px-4 py-3 text-b2 text-error-900">
      <p className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4" aria-hidden />
        {e ? e.message : "No fue posible completar la operación. Verifica que el backend esté disponible."}
      </p>
      {e && e.detalles.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-6">
          {e.detalles.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      {e?.correlationId && <p className="mt-2 text-c text-error-900">Referencia para soporte: {e.correlationId}</p>}
    </div>
  );
}

export function PanelLateral({ abierto, onCerrar, titulo, subtitulo, children, ancho = "max-w-2xl" }: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button aria-label="Cerrar" className="absolute inset-0 bg-[rgba(22,23,24,0.35)]" onClick={onCerrar} />
      <aside className={cn("relative flex h-full w-full flex-col bg-white shadow-modal", ancho)}>
        <header className="flex items-start justify-between gap-4 border-b border-light-600 px-6 py-4">
          <div>
            <h2 className="text-s1 font-bold text-dark-600">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-b2 text-mid-600">{subtitulo}</p>}
          </div>
          <button onClick={onCerrar} className="rounded-dg-8 p-1.5 text-mid-600 hover:bg-light-400" aria-label="Cerrar panel">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}

export function Pestanas<T extends string>({ opciones, activa, onCambiar }: { opciones: { id: T; etiqueta: string; conteo?: number }[]; activa: T; onCambiar: (id: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-light-600">
      {opciones.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === activa}
          onClick={() => onCambiar(o.id)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-a2 font-semibold transition-colors",
            o.id === activa ? "border-primary-600 text-primary-600" : "border-transparent text-mid-600 hover:text-dark-600",
          )}
        >
          {o.etiqueta}
          {o.conteo !== undefined && <span className="ml-1.5 rounded-dg-full bg-light-400 px-1.5 text-c text-mid-600">{o.conteo}</span>}
        </button>
      ))}
    </div>
  );
}

export function Dato({ etiqueta, children, className }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-a3 font-medium text-mid-600">{etiqueta}</dt>
      <dd className="mt-0.5 text-b1 text-dark-600">{children}</dd>
    </div>
  );
}

export function Campo({ etiqueta, requerido, children, ayuda }: { etiqueta: string; requerido?: boolean; children: ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="text-a3 font-medium text-dark-900">
        {etiqueta}
        {requerido && <span className="ml-0.5 text-error-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {ayuda && <span className="mt-1 block text-c text-mid-600">{ayuda}</span>}
    </label>
  );
}

export const claseEntrada =
  "h-control-compact w-full rounded-dg-8 border border-light-900 bg-white px-3 text-a2 text-dark-600 caret-primary-600 placeholder:text-mid-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100";
