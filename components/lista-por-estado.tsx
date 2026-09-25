"use client";

import { useQueries } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import type { GarantiaResumen, Pagina } from "@/lib/tipos";
import { humano } from "@/lib/formato";
import { Tarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError, Vacio } from "@/components/ui/varios";
import { TablaGarantias } from "@/components/tabla-garantias";

/** Bandejas de trabajo por macroestado (estudio jurídico, constitución, ejecución, liberación). */
export function ListaPorEstado({ estados, columnasExtra, vacio }: { estados: string[]; columnasExtra?: { titulo: string; celda: (g: GarantiaResumen) => ReactNode }[]; vacio: string }) {
  const consultas = useQueries({
    queries: estados.map((e) => ({ queryKey: ["garantias", "estado", e], queryFn: () => api<Pagina<GarantiaResumen>>(`/garantias?macroestado=${e}&tamano=200`) })),
  });
  return (
    <div className="space-y-6">
      {estados.map((e, k) => {
        const q = consultas[k];
        return (
          <Tarjeta key={e}>
            <EncabezadoTarjeta titulo={humano(e)} subtitulo={q.data ? `${q.data.total} garantías` : undefined} />
            <MensajeError error={q.error} />
            {q.isLoading ? <Esqueleto className="m-4 h-32" /> : q.data && q.data.items.length > 0 ? <TablaGarantias items={q.data.items} columnasExtra={columnasExtra} /> : <Vacio titulo={vacio} />}
          </Tarjeta>
        );
      })}
    </div>
  );
}
