"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, FileCheck2 } from "lucide-react";
import { api, enviar } from "@/lib/api";
import { useTipos, nombreTipo, type CampoDefinicion } from "@/lib/consultas";
import { cn, entero, fecha, humano, hoyLocal } from "@/lib/formato";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, EncabezadoTarjeta, CuerpoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Insignia, InsigniaEstado } from "@/components/ui/insignia";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";
import { Campo, claseEntrada, Esqueleto, MensajeError, PanelLateral, Vacio } from "@/components/ui/varios";
import { PlanConstitucionVista, usePlan } from "@/components/plan-constitucion";

interface FilaTablero {
  codigo: string;
  tipo: string;
  clienteNombre: string;
  clienteDocumento: string;
  producto: string;
  macroestado: string;
  total: number;
  cerradas: number;
  obligatoriasPendientes: number;
  bloqueadas: number;
  vencidas: number;
  proximaFecha: string | null;
}

interface Tablero {
  resumen: { enCurso: number; sinPlan: number; conVencidas: number; conBloqueos: number; listasParaPerfeccionar: number };
  garantias: FilaTablero[];
  porActividad: { nombre: string; pendientes: number; enCurso: number; bloqueadas: number; vencidas: number }[];
}

type Filtro = "todas" | "vencidas" | "bloqueadas" | "listas" | "sinPlan";

export default function Constitucion() {
  const { data, isLoading, error } = useQuery({ queryKey: ["constitucion"], queryFn: () => api<Tablero>("/constitucion") });
  const { data: tipos } = useTipos(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [sel, setSel] = useState<string | null>(null);

  const filas = (data?.garantias ?? []).filter((g) =>
    filtro === "vencidas" ? g.vencidas > 0
      : filtro === "bloqueadas" ? g.bloqueadas > 0
        : filtro === "listas" ? g.total > 0 && g.obligatoriasPendientes === 0
          : filtro === "sinPlan" ? g.total === 0 : true);

  const tarjetas: { id: Filtro; titulo: string; valor: number | undefined; tono?: string }[] = [
    { id: "todas", titulo: "En constitución", valor: data?.resumen.enCurso },
    { id: "vencidas", titulo: "Con actividades vencidas", valor: data?.resumen.conVencidas, tono: "text-error-900" },
    { id: "bloqueadas", titulo: "Con bloqueos", valor: data?.resumen.conBloqueos, tono: "text-warning-text" },
    { id: "listas", titulo: "Listas para perfeccionar", valor: data?.resumen.listasParaPerfeccionar, tono: "text-success-900" },
    { id: "sinPlan", titulo: "Sin plan", valor: data?.resumen.sinPlan },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Constitución y registro"
        descripcion="Plan de actividades de perfeccionamiento de cada garantía, generado desde la plantilla de su tipo: escritura, ORIP, RGM, RUNT, FNA, FNG, pólizas. La garantía solo se perfecciona con todas las actividades obligatorias completadas y con evidencia (RF-0604)."
      />
      <MensajeError error={error} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {tarjetas.map((t) => (
          <button key={t.id} onClick={() => setFiltro(t.id)} aria-pressed={filtro === t.id}
            className={cn("rounded-dg-12 border bg-white p-4 text-left shadow-card transition-colors", filtro === t.id ? "border-primary-600 ring-2 ring-primary-100" : "border-light-600 hover:border-primary-400")}>
            <p className="text-a3 text-mid-600">{t.titulo}</p>
            <p className={cn("mt-1 text-h5 font-bold tabular-nums", t.tono)}>{t.valor === undefined ? "—" : entero(t.valor)}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Tarjeta className="xl:col-span-2">
          <EncabezadoTarjeta titulo="Garantías en constitución" subtitulo={`${filas.length} garantías · ordenadas por vencimientos`} />
          {isLoading ? <Esqueleto className="m-4 h-64" /> : filas.length === 0 ? <Vacio titulo="No hay garantías con este filtro" /> : (
            <Tabla>
              <thead>
                <tr><Th>Garantía</Th><Th>Cliente</Th><Th>Estado</Th><Th>Avance</Th><Th>Pendientes</Th><Th>Próximo vencimiento</Th></tr>
              </thead>
              <tbody>
                {filas.map((g) => {
                  const avance = g.total === 0 ? 0 : Math.round((g.cerradas / g.total) * 100);
                  return (
                    <Fila key={g.codigo} onClick={() => setSel(g.codigo)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSel(g.codigo)}>
                      <Td><p className="font-semibold text-link">{g.codigo}</p><p className="text-c text-mid-600">{nombreTipo(tipos, g.tipo)}</p></Td>
                      <Td><p>{g.clienteNombre}</p><p className="text-c text-mid-600">{g.clienteDocumento}</p></Td>
                      <Td><InsigniaEstado valor={g.macroestado} /></Td>
                      <Td>
                        {g.total === 0 ? <Insignia tono="advertencia">Sin plan</Insignia> : (
                          <div className="flex min-w-32 items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-light-600"><div className={cn("h-full", g.obligatoriasPendientes === 0 ? "bg-success-900" : "bg-primary-600")} style={{ width: `${avance}%` }} /></div>
                            <span className="text-b3 tabular-nums">{g.cerradas}/{g.total}</span>
                          </div>
                        )}
                      </Td>
                      <Td className="text-b3">
                        {g.total > 0 && g.obligatoriasPendientes === 0 ? <Insignia tono="exito">Lista</Insignia> : `${g.obligatoriasPendientes} obligatorias`}
                        {g.bloqueadas > 0 && <Insignia tono="error" className="ml-1">{g.bloqueadas} bloqueada{g.bloqueadas > 1 ? "s" : ""}</Insignia>}
                      </Td>
                      <Td className={cn("text-b3", g.vencidas > 0 && "font-semibold text-error-900")}>
                        {g.proximaFecha ? fecha(g.proximaFecha) : "—"}{g.vencidas > 0 && ` · ${g.vencidas} vencida${g.vencidas > 1 ? "s" : ""}`}
                      </Td>
                    </Fila>
                  );
                })}
              </tbody>
            </Tabla>
          )}
        </Tarjeta>
        <Tarjeta>
          <EncabezadoTarjeta titulo="Actividades abiertas" subtitulo="Dónde se concentra el trabajo pendiente" />
          {!data ? <Esqueleto className="m-4 h-40" /> : data.porActividad.length === 0 ? <Vacio titulo="Sin actividades abiertas" /> : (
            <ul className="divide-y divide-light-600">
              {data.porActividad.map((a) => (
                <li key={a.nombre} className="px-5 py-3">
                  <p className="text-a2 font-semibold text-dark-600">{a.nombre}</p>
                  <p className="mt-1 flex flex-wrap gap-2 text-b3 text-mid-600">
                    <span>{a.pendientes} pendientes</span><span>{a.enCurso} en curso</span>
                    {a.bloqueadas > 0 && <Insignia tono="error">{a.bloqueadas} bloqueadas</Insignia>}
                    {a.vencidas > 0 && <Insignia tono="advertencia">{a.vencidas} vencidas</Insignia>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>

      <PanelLateral abierto={!!sel} onCerrar={() => setSel(null)} titulo={sel ? `Plan de constitución · ${sel}` : ""} subtitulo="El avance también puede llegar por API desde Appian (RF-0605)." ancho="max-w-3xl">
        {sel && <DetallePlan codigo={sel} onPerfeccionada={() => setSel(null)} />}
      </PanelLateral>
    </>
  );
}

interface ExpedienteMinimo {
  garantia: { codigo: string; clienteNombre: string; macroestado: string; perfeccionada: boolean; atributos: Record<string, unknown> };
  tipo: { nombre: string };
  campos: CampoDefinicion[];
}

function DetallePlan({ codigo, onPerfeccionada }: { codigo: string; onPerfeccionada: () => void }) {
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const { data: e, isLoading, error } = useQuery({ queryKey: ["expediente", codigo], queryFn: () => api<ExpedienteMinimo>(`/garantias/${codigo}`) });
  const { data: plan } = usePlan(codigo);
  const hoy = hoyLocal();
  const [fechas, setFechas] = useState({ fechaConstitucion: hoy, fechaPerfeccionamiento: hoy });
  const perfeccionar = useMutation({
    mutationFn: () => enviar(`/garantias/${codigo}/perfeccionamiento`, "PUT", fechas),
    onSuccess: () => {
      cliente.invalidateQueries();
      onPerfeccionada();
    },
  });
  if (isLoading) return <Esqueleto className="h-96" />;
  if (error || !e) return <MensajeError error={error} />;
  const listo = plan?.resumen.completo && plan.editable;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-a2 font-semibold">{e.garantia.clienteNombre}</p>
          <p className="text-b3 text-mid-600">{e.tipo.nombre} · {humano(e.garantia.macroestado)}</p>
        </div>
        <Link href={`/garantias/${codigo}`} className="text-a2 font-semibold text-link underline">Abrir Expediente 360</Link>
      </div>
      <PlanConstitucionVista codigo={codigo} campos={e.campos} atributos={e.garantia.atributos ?? {}} />
      {listo && tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR") && (
        <Tarjeta className="border-success-600">
          <CuerpoTarjeta>
            <h3 className="flex items-center gap-2 text-s2 font-semibold text-success-900"><ClipboardCheck className="h-5 w-5" aria-hidden /> Registrar perfeccionamiento</h3>
            <p className="mt-1 text-b3 text-mid-600">Todas las actividades obligatorias están completadas con evidencia. Al perfeccionar, la garantía queda oponible y se recalcula su idoneidad.</p>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(ev) => { ev.preventDefault(); perfeccionar.mutate(); }}>
              <Campo etiqueta="Fecha de constitución" requerido><input type="date" max={hoy} className={claseEntrada} value={fechas.fechaConstitucion} onChange={(ev) => setFechas((x) => ({ ...x, fechaConstitucion: ev.target.value }))} required /></Campo>
              <Campo etiqueta="Fecha de perfeccionamiento" requerido><input type="date" max={hoy} className={claseEntrada} value={fechas.fechaPerfeccionamiento} onChange={(ev) => setFechas((x) => ({ ...x, fechaPerfeccionamiento: ev.target.value }))} required /></Campo>
              <div className="sm:col-span-2"><MensajeError error={perfeccionar.error} /></div>
              <div className="sm:col-span-2"><Boton type="submit" cargando={perfeccionar.isPending}><FileCheck2 className="h-4 w-4" /> Perfeccionar garantía</Boton></div>
            </form>
          </CuerpoTarjeta>
        </Tarjeta>
      )}
    </div>
  );
}
