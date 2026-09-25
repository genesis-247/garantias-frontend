"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Link2 } from "lucide-react";
import { fechaHora, humano, cn } from "@/lib/formato";
import type { RegistroAuditoria } from "@/lib/tipos";

function Diferencias({ antes, despues }: { antes: unknown; despues: unknown }) {
  const a = (antes ?? {}) as Record<string, unknown>;
  const d = (despues ?? {}) as Record<string, unknown>;
  const claves = Array.from(new Set([...Object.keys(a), ...Object.keys(d)])).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(d[k]));
  if (!antes || claves.length === 0) {
    return <pre className="max-h-64 overflow-auto rounded-dg-8 bg-light-400 p-3 text-c">{JSON.stringify(despues ?? antes, null, 2)}</pre>;
  }
  return (
    <table className="w-full text-c">
      <thead>
        <tr className="text-left text-mid-600"><th className="py-1 pr-3">Campo</th><th className="py-1 pr-3">Valor anterior</th><th className="py-1">Valor nuevo</th></tr>
      </thead>
      <tbody>
        {claves.map((k) => (
          <tr key={k} className="border-t border-light-600 align-top">
            <td className="py-1 pr-3 font-semibold">{k}</td>
            <td className="py-1 pr-3 text-error-900 line-through decoration-error-400">{JSON.stringify(a[k]) ?? "—"}</td>
            <td className="py-1 text-success-900">{JSON.stringify(d[k]) ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Línea de tiempo de auditoría comprensible para auditores y negocio (RF-1503). */
export function LineaAuditoria({ registros, mostrarEntidad }: { registros: RegistroAuditoria[]; mostrarEntidad?: boolean }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  return (
    <ol className="relative space-y-1 border-l-2 border-light-600 pl-5">
      {registros.map((r) => (
        <li key={r.id} className="relative">
          <span className={cn("absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-white", r.origen === "API" ? "bg-primary-600" : r.origen === "FLEXCUBE" ? "bg-info-600" : "bg-brand-900")} aria-hidden />
          <button onClick={() => setAbierto(abierto === r.id ? null : r.id)} className="flex w-full items-start justify-between gap-3 rounded-dg-8 px-2 py-2 text-left hover:bg-canvas" aria-expanded={abierto === r.id}>
            <span>
              <span className="text-b2 font-semibold text-dark-600">{humano(r.accion)}</span>
              {mostrarEntidad && (
                <span className="ml-2 text-b3 text-mid-600">
                  {r.entidad} {r.entidad === "Garantia" ? <Link href={`/garantias/${r.entidadId}`} className="font-semibold text-link underline" onClick={(e) => e.stopPropagation()}>{r.entidadId}</Link> : r.entidadId}
                </span>
              )}
              <span className="block text-b3 text-mid-600">
                {fechaHora(r.ocurridoEn)} · {r.usuario} · origen {r.origen}
                {r.motivo && <> · “{r.motivo}”</>}
              </span>
            </span>
            <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-mid-600 transition-transform", abierto === r.id && "rotate-180")} aria-hidden />
          </button>
          {abierto === r.id && (
            <div className="mb-3 ml-2 space-y-2 rounded-dg-8 border border-light-600 bg-white p-3">
              <Diferencias antes={r.antes} despues={r.despues} />
              <p className="flex flex-wrap items-center gap-1 text-c text-mid-600">
                <Link2 className="h-3 w-3" aria-hidden /> Registro #{r.id} · hash <span className="font-mono">{r.hash.slice(0, 16)}…</span> · anterior <span className="font-mono">{r.hashAnterior.slice(0, 16)}…</span>
                {r.correlationId && (
                  <> · Correlation ID <Link href={`/core-transaccional?texto=${r.correlationId}`} className="font-mono text-link underline">{r.correlationId.slice(0, 8)}</Link></>
                )}
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
