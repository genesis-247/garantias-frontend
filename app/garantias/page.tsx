"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Plus } from "lucide-react";
import { tieneRol, useSesion } from "@/store/sesion";
import { api } from "@/lib/api";
import { entero, humano } from "@/lib/formato";
import type { GarantiaResumen, Pagina } from "@/lib/tipos";
import { useTipos } from "@/lib/consultas";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { claseEntrada, Esqueleto, MensajeError, Vacio } from "@/components/ui/varios";
import { TablaGarantias } from "@/components/tabla-garantias";

const ESTADOS = ["REGISTRO", "ESTUDIO_JURIDICO", "CONSTITUCION", "PERFECCIONAMIENTO", "ACTIVA", "MONITOREO", "ACTUALIZACION", "EJECUCION", "LIBERACION", "CIERRE", "ANULADA"];

function exportarCsv(items: GarantiaResumen[]) {
  const columnas = ["codigo", "tipo", "clienteNombre", "clienteDocumento", "producto", "segmento", "macroestado", "idoneidad", "valorComercial", "valorNeto", "fechaProximaValoracion"] as const;
  // Celdas como texto y sin fórmulas: evita inyección de fórmulas al abrir en Excel.
  const celda = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;
  const csv = [columnas.join(";"), ...items.map((g) => columnas.map((c) => celda(g[c])).join(";"))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "garantias.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

function Listado() {
  const params = useSearchParams();
  const { perfil } = useSesion();
  const [filtros, setFiltros] = useState({
    texto: params.get("texto") ?? "",
    tipo: params.get("tipo") ?? "",
    macroestado: params.get("macroestado") ?? "",
    idoneidad: params.get("idoneidad") ?? "",
    segmento: "",
    orden: "",
  });
  const [pagina, setPagina] = useState(0);
  const { data: tipos } = useTipos();
  const consulta = new URLSearchParams(Object.entries({ ...filtros, pagina: String(pagina), tamano: "25" }).filter(([, v]) => v !== ""));
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["garantias", consulta.toString()],
    queryFn: () => api<Pagina<GarantiaResumen>>(`/garantias?${consulta}`),
    placeholderData: keepPreviousData,
  });
  const cambiar = (campo: keyof typeof filtros) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros((f) => ({ ...f, [campo]: e.target.value }));
    setPagina(0);
  };
  const paginas = data ? Math.ceil(data.total / data.tamano) : 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Garantías"
        descripcion="Registro maestro: cada garantía con su estado, idoneidad, valores y cobertura vigente."
        acciones={
          <>
            <Boton variante="secundario" onClick={() => data && exportarCsv(data.items)} disabled={!data?.items.length}>
              <Download className="h-4 w-4" aria-hidden /> Exportar página
            </Boton>
            {tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR") && (
              <>
                <Link href="/carga-masiva" className="inline-flex h-control-compact items-center gap-2 rounded-dg-8 border border-primary-600 bg-white px-4 text-a2 font-bold text-primary-600 hover:bg-primary-100">
                  <FileSpreadsheet className="h-4 w-4" aria-hidden /> Carga masiva
                </Link>
                <Link href="/garantias/nueva" className="inline-flex h-control-compact items-center gap-2 rounded-dg-8 bg-primary-600 px-4 text-a2 font-bold text-white hover:bg-primary-grad">
                  <Plus className="h-4 w-4" aria-hidden /> Registrar garantía
                </Link>
              </>
            )}
          </>
        }
      />
      <Tarjeta>
        <div className="grid grid-cols-1 gap-3 border-b border-light-600 p-4 md:grid-cols-3 xl:grid-cols-6">
          <input aria-label="Buscar" value={filtros.texto} onChange={cambiar("texto")} placeholder="Código, cliente, documento o referencia" className={`${claseEntrada} xl:col-span-2`} />
          <select aria-label="Tipo de garantía" value={filtros.tipo} onChange={cambiar("tipo")} className={claseEntrada}>
            <option value="">Todos los tipos</option>
            {tipos?.map((t) => <option key={t.tipo.codigo} value={t.tipo.codigo}>{t.tipo.nombre}</option>)}
          </select>
          <select aria-label="Estado" value={filtros.macroestado} onChange={cambiar("macroestado")} className={claseEntrada}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{humano(e)}</option>)}
          </select>
          <select aria-label="Idoneidad" value={filtros.idoneidad} onChange={cambiar("idoneidad")} className={claseEntrada}>
            <option value="">Toda idoneidad</option>
            <option value="IDONEA">Idónea</option>
            <option value="CONDICIONADA">Condicionada</option>
            <option value="NO_IDONEA">No idónea</option>
            <option value="NO_EVALUADA">No evaluada</option>
          </select>
          <select aria-label="Ordenar" value={filtros.orden} onChange={cambiar("orden")} className={claseEntrada}>
            <option value="">Más recientes</option>
            <option value="valor">Mayor valor</option>
            <option value="proximaValoracion">Próxima valoración</option>
            <option value="cliente">Cliente (A-Z)</option>
          </select>
        </div>
        <div className="p-4"><MensajeError error={error} /></div>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, k) => <Esqueleto key={k} className="h-12" />)}</div>
        ) : data && data.items.length > 0 ? (
          <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
            <TablaGarantias items={data.items} />
          </div>
        ) : (
          <Vacio titulo="No hay garantías con estos filtros" detalle="Ajusta los filtros o la búsqueda." />
        )}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-light-600 px-4 py-3 text-b2 text-mid-600">
            <span>{entero(data.total)} garantías · página {data.pagina + 1} de {paginas}</span>
            <div className="flex gap-2">
              <Boton variante="secundario" onClick={() => setPagina((p) => p - 1)} disabled={pagina === 0} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Boton>
              <Boton variante="secundario" onClick={() => setPagina((p) => p + 1)} disabled={pagina + 1 >= paginas} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Boton>
            </div>
          </div>
        )}
      </Tarjeta>
    </>
  );
}

export default function PaginaGarantias() {
  return (
    <Suspense fallback={<Esqueleto className="h-96" />}>
      <Listado />
    </Suspense>
  );
}
