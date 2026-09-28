"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, FileCheck2, Fingerprint, ListChecks, Lock } from "lucide-react";
import { api, enviar } from "@/lib/api";
import type { Actividad, CampoDefinicion, PlanConstitucion } from "@/lib/consultas";
import { cn, fecha, fechaHora, humano, hoyLocal } from "@/lib/formato";
import { tieneRol, useSesion } from "@/store/sesion";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Campo, claseEntrada, Esqueleto, MensajeError, Vacio } from "@/components/ui/varios";
import { aJson, CampoDinamico, desdeJson, type ValorCampo } from "@/components/campo-dinamico";

const TONO: Record<Actividad["estado"], "exito" | "info" | "advertencia" | "error" | "neutro"> = {
  COMPLETADA: "exito", EN_CURSO: "info", PENDIENTE: "neutro", BLOQUEADA: "error", NO_APLICA: "neutro",
};

const hoy = () => hoyLocal();

export const vencida = (a: Actividad) => !!a.fechaLimite && a.fechaLimite < hoy() && a.estado !== "COMPLETADA" && a.estado !== "NO_APLICA";

/** SHA-256 del archivo, calculado en el navegador. El original no se sube: se custodia en OnBase (RF-1901). */
async function huella(archivo: File) {
  const digest = await crypto.subtle.digest("SHA-256", await archivo.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function usePlan(codigo: string) {
  return useQuery({ queryKey: ["plan-constitucion", codigo], queryFn: () => api<PlanConstitucion>(`/garantias/${codigo}/actividades-constitucion`) });
}

/** Plan de actividades de constitución y perfeccionamiento de una garantía (M06). */
export function PlanConstitucionVista({ codigo, campos, atributos }: { codigo: string; campos: CampoDefinicion[]; atributos: Record<string, unknown> }) {
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const { data: plan, isLoading, error } = usePlan(codigo);
  const [abierta, setAbierta] = useState<string | null>(null);
  const puedeOperar = tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR");
  const generar = useMutation({
    mutationFn: () => enviar(`/garantias/${codigo}/actividades-constitucion`, "POST"),
    onSuccess: () => cliente.invalidateQueries(),
  });

  if (isLoading) return <Esqueleto className="h-48" />;
  if (error || !plan) return <MensajeError error={error} />;

  if (plan.actividades.length === 0) {
    return (
      <div>
        <Vacio
          titulo="Sin plan de constitución"
          detalle={plan.editable ? "La garantía llegó a constitución antes de que su tipo tuviera plantilla, o la plantilla está vacía." : "El plan se genera al pasar la garantía a Constitución, desde la plantilla de su tipo."}
          icono={<ListChecks className="h-6 w-6" aria-hidden />}
        />
        {plan.editable && puedeOperar && (
          <div className="flex justify-center">
            <Boton variante="secundario" cargando={generar.isPending} onClick={() => generar.mutate()}>Generar plan desde la plantilla</Boton>
          </div>
        )}
        <MensajeError error={generar.error} />
      </div>
    );
  }

  const r = plan.resumen;
  const avance = r.total === 0 ? 0 : Math.round((r.cerradas / r.total) * 100);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-dg-12 border border-light-600 bg-canvas p-4">
        <div className="min-w-48 flex-1">
          <p className="text-a3 text-mid-600">Avance del plan</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-light-600" role="progressbar" aria-valuenow={avance} aria-valuemin={0} aria-valuemax={100}>
              <div className={cn("h-full rounded-full", r.completo ? "bg-success-900" : "bg-primary-600")} style={{ width: `${avance}%` }} />
            </div>
            <span className="text-a2 font-bold tabular-nums">{r.cerradas}/{r.total}</span>
          </div>
        </div>
        {r.completo ? (
          <Insignia tono="exito">Obligatorias completas: se puede perfeccionar</Insignia>
        ) : (
          <Insignia tono="advertencia">{r.obligatoriasPendientes} obligatorias pendientes</Insignia>
        )}
        {r.vencidas > 0 && <Insignia tono="error">{r.vencidas} vencidas</Insignia>}
        {r.bloqueadas > 0 && <Insignia tono="error">{r.bloqueadas} bloqueadas</Insignia>}
        {!plan.editable && <Insignia tono="neutro">{plan.perfeccionada ? "Garantía perfeccionada: plan cerrado" : "Plan de solo lectura en este estado"}</Insignia>}
      </div>

      <ol className="space-y-2">
        {plan.actividades.map((a, k) => (
          <li key={a.codigo} className={cn("rounded-dg-12 border p-4", vencida(a) ? "border-error-600" : "border-light-600")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-b3 font-bold",
                  a.estado === "COMPLETADA" ? "bg-success-100 text-success-900" : a.estado === "BLOQUEADA" ? "bg-error-100 text-error-900" : "bg-light-400 text-mid-600")}>
                  {a.estado === "COMPLETADA" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : a.estado === "BLOQUEADA" ? <Lock className="h-4 w-4" aria-hidden /> : k + 1}
                </span>
                <div>
                  <p className="text-a2 font-semibold text-dark-600">
                    {a.nombre} {!a.obligatoria && <span className="font-normal text-mid-600">(opcional)</span>}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-b3 text-mid-600">
                    <span className={cn("inline-flex items-center gap-1", vencida(a) && "font-semibold text-error-900")}>
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {a.fechaLimite ? `Límite ${fecha(a.fechaLimite)}` : "Sin fecha límite"}{vencida(a) && " · vencida"}
                    </span>
                    <span>Responsable: {a.responsable ?? (a.rolResponsable ? humano(a.rolResponsable) : "sin asignar")}</span>
                    {a.requiereEvidencia && <span className="inline-flex items-center gap-1"><FileCheck2 className="h-3.5 w-3.5" aria-hidden /> Exige evidencia</span>}
                  </p>
                  {a.evidenciaRef && (
                    <p className="mt-1 inline-flex items-center gap-1 text-b3 text-mid-600">
                      <Fingerprint className="h-3.5 w-3.5" aria-hidden /> OnBase {a.evidenciaRef} · SHA-256 <span className="font-mono">{a.evidenciaHash?.slice(0, 16)}…</span>
                    </p>
                  )}
                  {Object.keys(a.datos ?? {}).length > 0 && (
                    <p className="mt-1 text-b3 text-mid-600">
                      {Object.entries(a.datos).map(([k, v]) => `${campos.find((c) => c.codigo === k)?.etiqueta ?? k}: ${typeof v === "boolean" ? (v ? "Sí" : "No") : String(v)}`).join(" · ")}
                    </p>
                  )}
                  {a.observacion && (
                    <p className={cn("mt-1 text-b3", a.estado === "BLOQUEADA" ? "text-error-900" : "text-mid-600")}>
                      {a.estado === "BLOQUEADA" && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" aria-hidden />}{a.observacion}
                    </p>
                  )}
                  {a.completadaEn && <p className="mt-1 text-c text-mid-600">Completada por {a.completadaPor} el {fechaHora(a.completadaEn)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Insignia tono={TONO[a.estado]}>{humano(a.estado)}</Insignia>
                {plan.editable && puedeOperar && (
                  <Boton variante="fantasma" onClick={() => setAbierta(abierta === a.codigo ? null : a.codigo)} aria-expanded={abierta === a.codigo}>
                    {abierta === a.codigo ? "Cerrar" : "Gestionar"}
                  </Boton>
                )}
              </div>
            </div>
            {abierta === a.codigo && (
              <FormActividad codigo={codigo} actividad={a} campos={campos} atributos={atributos} esDirector={tieneRol(perfil, "OPERACIONES_DIRECTOR")}
                onListo={() => {
                  setAbierta(null);
                  cliente.invalidateQueries();
                }} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FormActividad({ codigo, actividad: a, campos, atributos, esDirector, onListo }: {
  codigo: string; actividad: Actividad; campos: CampoDefinicion[]; atributos: Record<string, unknown>; esDirector: boolean; onListo: () => void;
}) {
  const definiciones = a.campos.map((c) => campos.find((x) => x.codigo === c)).filter((c): c is CampoDefinicion => !!c);
  const [estado, setEstado] = useState<Actividad["estado"]>(a.estado === "PENDIENTE" ? "EN_CURSO" : a.estado);
  const [responsable, setResponsable] = useState(a.responsable ?? "");
  const [limite, setLimite] = useState(a.fechaLimite ?? "");
  const [ref, setRef] = useState(a.evidenciaRef ?? "");
  const [hash, setHash] = useState(a.evidenciaHash ?? "");
  const [archivo, setArchivo] = useState<string | null>(null);
  const [observacion, setObservacion] = useState("");
  const [valores, setValores] = useState<Record<string, ValorCampo>>(() =>
    Object.fromEntries(definiciones.map((c) => [c.codigo, desdeJson(c, a.datos?.[c.codigo] ?? atributos[c.codigo])])));
  const m = useMutation({
    mutationFn: () => enviar(`/garantias/${codigo}/actividades-constitucion/${a.codigo}`, "PATCH", {
      estado,
      responsable,
      fechaLimite: limite || null,
      evidenciaRef: ref,
      evidenciaHash: hash,
      datos: Object.fromEntries(definiciones.map((c) => [c.codigo, aJson(c, valores[c.codigo])])),
      observacion: observacion || null,
    }),
    onSuccess: onListo,
  });
  const estados: Actividad["estado"][] = ["PENDIENTE", "EN_CURSO", "COMPLETADA", "BLOQUEADA", ...(a.obligatoria ? [] : ["NO_APLICA" as const])];
  const reabrir = a.estado === "COMPLETADA" && estado !== "COMPLETADA";
  const exigeObservacion = (estado === "BLOQUEADA" && a.estado !== "BLOQUEADA") || estado === "NO_APLICA" || reabrir;

  return (
    <form className="mt-4 grid gap-4 border-t border-light-600 pt-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Campo etiqueta="Estado" requerido>
        <select className={claseEntrada} value={estado} onChange={(e) => setEstado(e.target.value as Actividad["estado"])}>
          {estados.map((s) => <option key={s} value={s} disabled={a.estado === "COMPLETADA" && s !== "COMPLETADA" && !esDirector}>{humano(s)}</option>)}
        </select>
      </Campo>
      <Campo etiqueta="Responsable"><input className={claseEntrada} value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre o usuario" /></Campo>
      <Campo etiqueta="Fecha límite"><input type="date" className={claseEntrada} value={limite} onChange={(e) => setLimite(e.target.value)} /></Campo>
      <Campo etiqueta="Referencia del documento en OnBase" requerido={a.requiereEvidencia && estado === "COMPLETADA"}>
        <input className={claseEntrada} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="OB-…" required={a.requiereEvidencia && estado === "COMPLETADA"} />
      </Campo>
      <div className="md:col-span-2">
        <Campo etiqueta="Huella SHA-256 de la evidencia" requerido={a.requiereEvidencia && estado === "COMPLETADA"}
          ayuda="Selecciona el archivo para calcular la huella en tu navegador (el archivo no se envía: el original se custodia en OnBase), o pega la huella registrada en OnBase.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className={`${claseEntrada} font-mono`} value={hash} onChange={(e) => setHash(e.target.value.trim().toLowerCase())} pattern="[a-f0-9]{64}" placeholder="64 caracteres hexadecimales"
              required={a.requiereEvidencia && estado === "COMPLETADA"} />
            <label className="inline-flex h-control-compact shrink-0 cursor-pointer items-center justify-center gap-2 rounded-dg-8 border border-primary-600 px-4 text-a2 font-bold text-primary-600 hover:bg-primary-100">
              <Fingerprint className="h-4 w-4" aria-hidden /> Calcular desde archivo
              <input type="file" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setHash(await huella(f));
                  setArchivo(f.name);
                }
              }} />
            </label>
          </div>
          {archivo && <span className="mt-1 block text-c text-success-900">Huella calculada de {archivo}</span>}
        </Campo>
      </div>
      {definiciones.length > 0 && (
        <div className="grid gap-4 rounded-dg-8 bg-canvas p-3 md:col-span-2 md:grid-cols-2">
          <p className="text-a3 font-semibold text-dark-600 md:col-span-2">Datos del registro que captura esta actividad</p>
          {definiciones.map((c) => (
            <CampoDinamico key={c.codigo} campo={c} valor={valores[c.codigo]} requerido={estado === "COMPLETADA"}
              onCambiar={(v) => setValores((x) => ({ ...x, [c.codigo]: v }))} />
          ))}
        </div>
      )}
      <div className="md:col-span-2">
        <Campo etiqueta="Observación" requerido={exigeObservacion} ayuda={reabrir ? "Reabrir una actividad completada requiere un Director de Operaciones." : undefined}>
          <textarea className={`${claseEntrada} h-20 py-2`} value={observacion} onChange={(e) => setObservacion(e.target.value)} required={exigeObservacion}
            placeholder={estado === "BLOQUEADA" ? "Motivo del bloqueo" : ""} />
        </Campo>
      </div>
      <div className="md:col-span-2"><MensajeError error={m.error} /></div>
      <div className="md:col-span-2"><Boton type="submit" cargando={m.isPending}>Guardar avance</Boton></div>
    </form>
  );
}
