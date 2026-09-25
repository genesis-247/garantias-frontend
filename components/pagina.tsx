import type { ReactNode } from "react";

export function EncabezadoPagina({ titulo, descripcion, acciones, antetitulo }: { titulo: ReactNode; descripcion?: ReactNode; acciones?: ReactNode; antetitulo?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {antetitulo && <p className="mb-1 text-a3 font-semibold uppercase tracking-wide text-primary-600">{antetitulo}</p>}
        <h1 className="text-h5 font-bold text-dark-600">{titulo}</h1>
        {descripcion && <p className="mt-1 text-b1 text-mid-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </div>
  );
}
