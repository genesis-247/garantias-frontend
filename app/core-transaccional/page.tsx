"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Search } from "lucide-react";
import { api } from "@/lib/api";
import { entero, fechaHora, humano } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { claseEntrada, Esqueleto, MensajeError, PanelLateral, Vacio } from "@/components/ui/varios";
import { Insignia } from "@/components/ui/insignia";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";

interface Evento {
  direccion: "PUBLICADO" | "RECIBIDO";
  id: string;
  tipo: string;
  version: number;
  entidad: string;
  entidad_id: string;
  correlation_id: string | null;
  causation_id: string | null;
  origen: string;
  estado: string;
  intentos: number;
  error: string | null;
  fecha: string;
  procesado_en: string | null;
  payload: unknown;
}

function Core() {
  const params = useSearchParams();
  const [texto, setTexto] = useState(params.get("texto") ?? "");
  const [filtro, setFiltro] = useState({ texto: params.get("texto") ?? "", direccion: "", estado: "" });
  const [seleccion, setSeleccion] = useState<Evento | null>(null);
  const qs = new URLSearchParams(Object.entries({ ...filtro, limite: "200" }).filter(([, v]) => v));
  const { data, isLoading, error } = useQuery({ queryKey: ["eventos", qs.toString()], queryFn: () => api<Evento[]>(`/eventos?${qs}`) });
  const resumen = useQuery({ queryKey: ["eventos-resumen"], queryFn: () => api<{ publicados: { estado: string; total: number }[]; recibidos: { estado: string; total: number }[] }>("/eventos/resumen") });
  const linea = useQuery({
    queryKey: ["correlacion", seleccion?.correlation_id],
    queryFn: () => api<{ fecha: string; fuente: string; tipo: string; detalle: string; actor: string }[]>(`/correlaciones/${seleccion!.correlation_id}`),
    enabled: !!seleccion?.correlation_id,
  });
  const linaje = useQuery({
    queryKey: ["linaje", seleccion?.id],
    queryFn: () => api<{ entidad: string; entidad_id: string; accion: string; creado_en: string }[]>(`/eventos/${seleccion!.id}/linaje`),
    enabled: seleccion?.direccion === "RECIBIDO",
  });
  const total = (l?: { total: number }[]) => l?.reduce((s, x) => s + Number(x.total), 0) ?? 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Core transaccional"
        descripcion="Registro operacional central: eventos recibidos (Flexcube) y publicados (Kafka, vía outbox), su estado técnico, versión y Correlation ID. Desde un evento se sigue todo lo que generó."
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Eventos publicados", total(resumen.data?.publicados)],
          ["Pendientes o en error", resumen.data?.publicados.filter((p) => p.estado !== "PUBLICADO").reduce((s, x) => s + Number(x.total), 0) ?? 0],
          ["Eventos recibidos", total(resumen.data?.recibidos)],
          ["Duplicados descartados", 0],
        ].map(([t, v]) => (
          <Tarjeta key={t as string} className="p-4">
            <p className="text-a3 text-mid-600">{t}</p>
            <p className="mt-1 text-h4 font-bold tabular-nums">{entero(v as number)}</p>
          </Tarjeta>
        ))}
      </div>
      <Tarjeta>
        <form className="grid grid-cols-1 gap-3 border-b border-light-600 p-4 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); setFiltro((f) => ({ ...f, texto })); }}>
          <input aria-label="Buscar" placeholder="Correlation ID, garantía u obligación" className={`${claseEntrada} md:col-span-2`} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <select aria-label="Dirección" className={claseEntrada} value={filtro.direccion} onChange={(e) => setFiltro((f) => ({ ...f, direccion: e.target.value }))}>
            <option value="">Recibidos y publicados</option><option value="RECIBIDO">Recibidos</option><option value="PUBLICADO">Publicados</option>
          </select>
          <select aria-label="Estado" className={claseEntrada} value={filtro.estado} onChange={(e) => setFiltro((f) => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            {["PUBLICADO", "PENDIENTE", "ERROR", "PROCESADO", "DUPLICADO"].map((s) => <option key={s} value={s}>{humano(s)}</option>)}
          </select>
          <Boton type="submit" variante="secundario"><Search className="h-4 w-4" /> Buscar</Boton>
        </form>
        <MensajeError error={error} />
        {isLoading ? <Esqueleto className="m-4 h-64" /> : !data?.length ? <Vacio titulo="Sin eventos" /> : (
          <Tabla>
            <thead><tr><Th>Fecha</Th><Th>Dirección</Th><Th>Evento</Th><Th>Entidad</Th><Th>Origen</Th><Th>Estado técnico</Th><Th>Correlation ID</Th></tr></thead>
            <tbody>
              {data.map((e) => (
                <Fila key={`${e.direccion}-${e.id}`} onClick={() => setSeleccion(e)}>
                  <Td className="text-b3 tabular-nums">{fechaHora(e.fecha)}</Td>
                  <Td><Insignia tono={e.direccion === "RECIBIDO" ? "info" : "marca"} sinIcono>{humano(e.direccion)}</Insignia></Td>
                  <Td><span className="font-semibold">{e.tipo}</span> <span className="text-c text-mid-600">v{e.version}</span></Td>
                  <Td className="text-b3">{e.entidad} {e.entidad_id}</Td>
                  <Td className="text-b3">{e.origen}</Td>
                  <Td><Insignia tono={["PUBLICADO", "PROCESADO"].includes(e.estado) ? "exito" : e.estado === "ERROR" ? "error" : "advertencia"}>{humano(e.estado)}</Insignia></Td>
                  <Td className="font-mono text-c">{e.correlation_id?.slice(0, 8) ?? "—"}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      <PanelLateral abierto={!!seleccion} onCerrar={() => setSeleccion(null)} titulo={seleccion?.tipo} subtitulo={seleccion ? `${humano(seleccion.direccion)} · ${seleccion.id}` : ""} ancho="max-w-3xl">
        {seleccion && (
          <div className="space-y-6">
            {seleccion.direccion === "RECIBIDO" && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-s2 font-semibold"><GitBranch className="h-4 w-4" /> Registros generados por este evento (linaje)</h3>
                <ul className="space-y-1 text-b2">
                  {linaje.data?.map((l, k) => <li key={k}>{humano(l.accion)} · {l.entidad} <span className="font-semibold">{l.entidad_id}</span></li>)}
                </ul>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-s2 font-semibold">Línea de tiempo de extremo a extremo · {seleccion.correlation_id}</h3>
              {linea.isLoading && <Esqueleto className="h-32" />}
              <ol className="space-y-2 border-l-2 border-primary-100 pl-4">
                {linea.data?.map((p, k) => (
                  <li key={k} className="text-b3">
                    <span className="tabular-nums text-mid-600">{fechaHora(p.fecha)}</span> · <span className="font-semibold">{humano(p.fuente)}</span> · {p.tipo} · {p.detalle} <span className="text-mid-600">({p.actor})</span>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h3 className="mb-2 text-s2 font-semibold">Contenido del evento</h3>
              <pre className="max-h-96 overflow-auto rounded-dg-8 bg-light-400 p-3 text-c">{JSON.stringify(seleccion.payload, null, 2)}</pre>
            </section>
          </div>
        )}
      </PanelLateral>
    </>
  );
}

export default function PaginaCore() {
  return <Suspense fallback={<Esqueleto className="h-96" />}><Core /></Suspense>;
}
