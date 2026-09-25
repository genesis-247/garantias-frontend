"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fecha, cn } from "@/lib/formato";
import type { Alerta } from "@/lib/tipos";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError, Vacio, Pestanas } from "@/components/ui/varios";
import { InsigniaCriticidad } from "@/components/ui/insignia";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";

type Filtro = "TODAS" | "CRITICA" | "ALTA" | "MEDIA";

export default function Monitoreo() {
  const { data, isLoading, error } = useQuery({ queryKey: ["alertas"], queryFn: () => api<Alerta[]>("/alertas") });
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const [categoria, setCategoria] = useState("");
  const categorias = useMemo(() => Array.from(new Set(data?.map((a) => a.categoria) ?? [])), [data]);
  const lista = (data ?? []).filter((a) => (filtro === "TODAS" || a.criticidad === filtro) && (!categoria || a.categoria === categoria));
  const conteo = (c: string) => data?.filter((a) => a.criticidad === c).length ?? 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Monitoreo"
        descripcion="Centro de monitoreo funcional y técnico: valoraciones vencidas o por vencer, brechas de cobertura, idoneidad, pólizas, liberaciones fuera de SLA y eventos fallidos. Las alertas se derivan del estado actual de los datos; su gestión como tareas llega con Appian."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(["CRITICA", "ALTA", "MEDIA"] as const).map((c) => (
          <button key={c} onClick={() => setFiltro(c)} className={cn("rounded-dg-12 border bg-white p-4 text-left shadow-card", filtro === c ? "border-primary-600" : "border-light-600")}>
            <InsigniaCriticidad valor={c} />
            <p className="mt-2 text-h4 font-bold tabular-nums">{conteo(c)}</p>
          </button>
        ))}
        <div className="rounded-dg-12 border border-light-600 bg-white p-4 shadow-card">
          <p className="text-a3 text-mid-600">Categorías</p>
          <select aria-label="Categoría" className="mt-2 w-full rounded-dg-8 border border-light-900 p-2 text-a2" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <Tarjeta>
        <div className="px-5 pt-2">
          <Pestanas<Filtro> activa={filtro} onCambiar={setFiltro} opciones={[
            { id: "TODAS", etiqueta: "Todas", conteo: data?.length },
            { id: "CRITICA", etiqueta: "Críticas", conteo: conteo("CRITICA") },
            { id: "ALTA", etiqueta: "Altas", conteo: conteo("ALTA") },
            { id: "MEDIA", etiqueta: "Medias", conteo: conteo("MEDIA") },
          ]} />
        </div>
        <MensajeError error={error} />
        {isLoading ? <Esqueleto className="m-4 h-64" /> : lista.length === 0 ? <Vacio titulo="Sin alertas para este filtro" /> : (
          <Tabla>
            <thead><tr><Th>Criticidad</Th><Th>Categoría</Th><Th>Alerta</Th><Th>Garantía</Th><Th>Obligación</Th><Th>Cliente</Th><Th>Fecha</Th><Th>Origen</Th></tr></thead>
            <tbody>
              {lista.map((a, k) => (
                <Fila key={k}>
                  <Td><InsigniaCriticidad valor={a.criticidad} /></Td>
                  <Td className="text-b3">{a.categoria}</Td>
                  <Td><p className="font-semibold">{a.titulo}</p><p className="text-b3 text-mid-600">{a.detalle}</p></Td>
                  <Td className="text-b3">{a.garantia?.split(", ").map((g) => <Link key={g} href={`/garantias/${g}`} className="mr-2 font-semibold text-link underline">{g}</Link>) ?? "—"}</Td>
                  <Td className="text-b3">{a.obligacion ? <Link href={`/cobertura?obligacion=${a.obligacion}`} className="text-link underline">{a.obligacion}</Link> : "—"}</Td>
                  <Td className="text-b3">{a.cliente ?? "—"}</Td>
                  <Td className="text-b3">{fecha(a.fecha)}</Td>
                  <Td className="text-c text-mid-600">{a.origen}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </>
  );
}
