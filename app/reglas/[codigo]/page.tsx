"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, FlaskConical, Play, Plus, Save, Send, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { api, enviar } from "@/lib/api";
import { fechaHora, humano, porcentaje, cn } from "@/lib/formato";
import type { RegistroAuditoria, ReglaVersion, TablaDecision } from "@/lib/tipos";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { claseEntrada, Esqueleto, MensajeError, PanelLateral } from "@/components/ui/varios";
import { Insignia, InsigniaRegla } from "@/components/ui/insignia";
import { LineaAuditoria } from "@/components/linea-auditoria";

interface Detalle {
  regla: { codigo: string; nombre: string; descripcion: string; tipo: string };
  versiones: ReglaVersion[];
  contrato: { variables: Record<string, "TEXTO" | "NUMERO" | "BOOLEANO">; resultado: string };
}

interface Pruebas { ok: boolean; erroresValidacion: string[]; casos: { nombre: string; ok: boolean; esperado: string; obtenido: string | null; error: string | null }[] }

interface Simulacion {
  coberturaActual: number;
  coberturaSimulada: number;
  obligacionesBajoObjetivoActual: number;
  obligacionesBajoObjetivoSimulado: number;
  obligacionesConCambio: number;
  cambios: { obligacion: string; ratioActual: number | null; ratioSimulado: number | null; cumpleActual: boolean; cumpleSimulado: boolean }[];
  cambiosIdoneidad: { garantia: string; actual: string; simulada: string; motivo: string }[];
  nota: string;
}

const AYUDA = "Vacío = cualquier valor. Sintaxis: valor · != valor · > n · >= n · < n · <= n · [a..b] · in (A, B) · not in (A, B)";

export default function DetalleRegla() {
  const { codigo } = useParams<{ codigo: string }>();
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["regla", codigo], queryFn: () => api<Detalle>(`/reglas/${codigo}`) });
  const auditoria = useQuery({ queryKey: ["auditoria", "Regla", codigo], queryFn: () => api<RegistroAuditoria[]>(`/auditoria?entidad=Regla&entidadId=${codigo}`) });
  const [numero, setNumero] = useState<number | null>(null);
  const [tabla, setTabla] = useState<TablaDecision | null>(null);
  const [motivo, setMotivo] = useState("");
  const [simulacion, setSimulacion] = useState<Simulacion | null>(null);

  const version = useMemo(() => data?.versiones.find((v) => v.numero === (numero ?? data.versiones.find((x) => x.estado === "EN_REVISION")?.numero ?? data.versiones[0]?.numero)), [data, numero]);
  useEffect(() => {
    if (version) setTabla(structuredClone(version.definicion));
  }, [version]);

  const accion = useMutation({
    mutationFn: async (a: "guardar" | "enviar" | "aprobar" | "rechazar" | "activar" | "clonar") => {
      const base = `/reglas/${codigo}/versiones/${version!.numero}`;
      switch (a) {
        case "guardar": return enviar(base, "PUT", { definicion: tabla, casosPrueba: version!.casosPrueba, vigenteDesde: null, vigenteHasta: null });
        case "enviar": return enviar(`${base}/envio`, "POST");
        case "aprobar": return enviar(`${base}/aprobacion`, "POST");
        case "rechazar": return enviar(`${base}/rechazo`, "POST", { motivo });
        case "activar": return enviar(`${base}/activacion`, "POST");
        case "clonar": return enviar<ReglaVersion>(`/reglas/${codigo}/versiones?base=${version!.numero}`, "POST");
      }
    },
    onSuccess: (r, a) => {
      cliente.invalidateQueries();
      if (a === "clonar" && r) setNumero((r as ReglaVersion).numero);
    },
  });
  const pruebas = useMutation({ mutationFn: () => enviar<Pruebas>(`/reglas/${codigo}/versiones/${version!.numero}/pruebas`, "POST") });
  const simular = useMutation({ mutationFn: () => enviar<Simulacion>(`/reglas/${codigo}/versiones/${version!.numero}/simulacion`, "POST"), onSuccess: setSimulacion });

  if (isLoading) return <Esqueleto className="h-[600px]" />;
  if (error || !data || !version || !tabla) return <MensajeError error={error} />;

  const variables = Object.keys(data.contrato.variables);
  const editable = version.estado === "BORRADOR" && tieneRol(perfil, "RIESGOS_GESTOR", "ADMIN_FUNCIONAL");
  const esAprobador = tieneRol(perfil, "APROBADOR_REGLAS");
  const mismoAutor = version.creadoPor === perfil.usuario;
  const cambiado = JSON.stringify(tabla) !== JSON.stringify(version.definicion);

  const setCond = (fila: number, variable: string, valor: string) =>
    setTabla((t) => {
      const n = structuredClone(t!);
      if (valor.trim()) n.filas[fila].condiciones[variable] = valor;
      else delete n.filas[fila].condiciones[variable];
      return n;
    });
  const setSalida = (fila: number, campo: "valor" | "motivo", valor: string) =>
    setTabla((t) => {
      const n = structuredClone(t!);
      n.filas[fila].salida = { ...n.filas[fila].salida, [campo]: valor || null } as TablaDecision["filas"][number]["salida"];
      return n;
    });
  const mover = (i: number, d: number) =>
    setTabla((t) => {
      const n = structuredClone(t!);
      const [f] = n.filas.splice(i, 1);
      n.filas.splice(i + d, 0, f);
      return n;
    });

  return (
    <>
      <EncabezadoPagina
        antetitulo={`${humano(data.regla.tipo)} · resultado ${humano(data.contrato.resultado)}`}
        titulo={`${data.regla.codigo} · ${data.regla.nombre}`}
        descripcion={data.regla.descripcion}
      />
      <div className="grid gap-6 xl:grid-cols-4">
        <Tarjeta>
          <EncabezadoTarjeta titulo="Versiones" />
          <ul className="p-2">
            {data.versiones.map((v) => (
              <li key={v.id}>
                <button onClick={() => { setNumero(v.numero); setSimulacion(null); pruebas.reset(); }} className={cn("w-full rounded-dg-8 px-3 py-2 text-left hover:bg-light-400", v.numero === version.numero && "bg-primary-100")}>
                  <span className="flex items-center justify-between gap-2"><span className="font-semibold">Versión {v.numero}</span><InsigniaRegla valor={v.estado} /></span>
                  <span className="block text-c text-mid-600">Creó {v.creadoPor}{v.aprobadoPor && ` · aprobó ${v.aprobadoPor}`}</span>
                </button>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <div className="space-y-6 xl:col-span-3">
          <Tarjeta>
            <EncabezadoTarjeta
              titulo={<span className="flex items-center gap-2">Versión {version.numero} <InsigniaRegla valor={version.estado} /></span>}
              subtitulo={`Tabla de decisión · primera fila que cumple gana · creó ${version.creadoPor} el ${fechaHora(version.createdAt)}${version.hash ? ` · hash ${version.hash.slice(0, 12)}…` : ""}`}
              acciones={
                <>
                  <Boton variante="secundario" onClick={() => pruebas.mutate()} cargando={pruebas.isPending}><FlaskConical className="h-4 w-4" /> Probar</Boton>
                  <Boton variante="secundario" onClick={() => simular.mutate()} cargando={simular.isPending}><Play className="h-4 w-4" /> Simular</Boton>
                  {tieneRol(perfil, "RIESGOS_GESTOR", "ADMIN_FUNCIONAL") && <Boton variante="secundario" onClick={() => accion.mutate("clonar")}><Copy className="h-4 w-4" /> Nueva versión</Boton>}
                </>
              }
            />
            <CuerpoTarjeta className="space-y-4">
              {version.motivo && <p className="rounded-dg-8 bg-error-100 p-3 text-b2 text-error-900">Motivo: {version.motivo}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-b3">
                  <thead>
                    <tr className="bg-light-400 text-left text-mid-600">
                      <th className="px-2 py-2">#</th>
                      {variables.map((v) => <th key={v} className="px-2 py-2 font-semibold">{v}<span className="block font-normal text-mid-400">{humano(data.contrato.variables[v])}</span></th>)}
                      <th className="border-l-2 border-primary-600 px-2 py-2 font-semibold text-primary-900">Resultado</th>
                      <th className="px-2 py-2 font-semibold text-primary-900">Motivo</th>
                      {editable && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.filas.map((f, i) => (
                      <tr key={i} className="border-b border-light-600 align-top">
                        <td className="px-2 py-1.5 text-mid-600">{i + 1}</td>
                        {variables.map((v) => (
                          <td key={v} className="px-1 py-1">
                            {editable ? (
                              <input aria-label={`Fila ${i + 1} ${v}`} className="h-8 w-full min-w-[110px] rounded-dg-4 border border-light-900 px-2 font-mono text-c" value={f.condiciones[v] ?? ""} onChange={(e) => setCond(i, v, e.target.value)} placeholder="—" />
                            ) : (
                              <span className="font-mono text-c">{f.condiciones[v] ?? <span className="text-mid-400">—</span>}</span>
                            )}
                          </td>
                        ))}
                        <td className="border-l-2 border-primary-600 px-1 py-1">
                          {editable ? <input aria-label={`Fila ${i + 1} resultado`} className="h-8 w-24 rounded-dg-4 border border-primary-400 px-2 font-mono text-c font-bold" value={f.salida.valor} onChange={(e) => setSalida(i, "valor", e.target.value)} /> : <span className="font-mono font-bold">{f.salida.valor}</span>}
                        </td>
                        <td className="min-w-[240px] px-1 py-1">
                          {editable ? <input aria-label={`Fila ${i + 1} motivo`} className="h-8 w-full min-w-[200px] rounded-dg-4 border border-light-900 px-2 text-c" value={f.salida.motivo ?? ""} onChange={(e) => setSalida(i, "motivo", e.target.value)} /> : <span className="text-mid-900">{f.salida.motivo}</span>}
                        </td>
                        {editable && (
                          <td className="whitespace-nowrap px-1 py-1">
                            <button aria-label="Subir fila" disabled={i === 0} onClick={() => mover(i, -1)} className="p-1 text-mid-600 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                            <button aria-label="Bajar fila" disabled={i === tabla.filas.length - 1} onClick={() => mover(i, 1)} className="p-1 text-mid-600 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                            <button aria-label="Eliminar fila" onClick={() => setTabla((t) => ({ ...t!, filas: t!.filas.filter((_, k) => k !== i) }))} className="p-1 text-error-900"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="italic">
                      <td className="px-2 py-2 text-mid-600" colSpan={variables.length + 1}>Por defecto (si ninguna fila aplica)</td>
                      <td className="border-l-2 border-primary-600 px-2 py-2 font-mono font-bold">
                        {editable ? <input aria-label="Resultado por defecto" className="h-8 w-24 rounded-dg-4 border border-primary-400 px-2 font-mono" value={tabla.porDefecto?.valor ?? ""} onChange={(e) => setTabla((t) => ({ ...t!, porDefecto: e.target.value ? { valor: e.target.value, motivo: t!.porDefecto?.motivo ?? null } : null }))} /> : tabla.porDefecto?.valor ?? "— (la regla falla)"}
                      </td>
                      <td className="px-2 py-2 text-mid-900">{tabla.porDefecto?.motivo}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {editable && (
                <div className="flex flex-wrap items-center gap-2">
                  <Boton variante="fantasma" onClick={() => setTabla((t) => ({ ...t!, filas: [...t!.filas, { condiciones: {}, salida: { valor: "", motivo: null } }] }))}><Plus className="h-4 w-4" /> Agregar fila</Boton>
                  <span className="text-c text-mid-600">{AYUDA}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t border-light-600 pt-4">
                {editable && <Boton variante="secundario" onClick={() => accion.mutate("guardar")} disabled={!cambiado} cargando={accion.isPending && accion.variables === "guardar"}><Save className="h-4 w-4" /> Guardar borrador</Boton>}
                {editable && <Boton onClick={() => accion.mutate("enviar")} disabled={cambiado} cargando={accion.isPending && accion.variables === "enviar"}><Send className="h-4 w-4" /> Enviar a aprobación</Boton>}
                {version.estado === "EN_REVISION" && esAprobador && (
                  <>
                    <Boton onClick={() => accion.mutate("aprobar")} disabled={mismoAutor}><ShieldCheck className="h-4 w-4" /> Aprobar</Boton>
                    <input aria-label="Motivo de rechazo" placeholder="Motivo del rechazo" className={`${claseEntrada} max-w-xs`} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                    <Boton variante="peligro" onClick={() => accion.mutate("rechazar")} disabled={mismoAutor || !motivo}><XCircle className="h-4 w-4" /> Rechazar</Boton>
                  </>
                )}
                {version.estado === "APROBADA" && esAprobador && <Boton onClick={() => accion.mutate("activar")}><CheckCircle2 className="h-4 w-4" /> Activar en producción</Boton>}
                {version.estado === "EN_REVISION" && !esAprobador && <p className="text-b3 text-mid-600">Pendiente de un usuario con rol Aprobador de reglas.</p>}
                {version.estado === "EN_REVISION" && esAprobador && mismoAutor && <p className="text-b3 text-warning-text">Maker–checker: no puedes aprobar una versión que tú creaste.</p>}
              </div>
              <MensajeError error={accion.error} />
            </CuerpoTarjeta>
          </Tarjeta>

          {pruebas.data && (
            <Tarjeta>
              <EncabezadoTarjeta titulo={pruebas.data.ok ? "Casos de prueba: todos pasan" : "Casos de prueba con fallas"} />
              <CuerpoTarjeta className="space-y-2">
                {pruebas.data.erroresValidacion.map((e) => <p key={e} className="text-b2 text-error-900">{e}</p>)}
                {pruebas.data.casos.map((c) => (
                  <p key={c.nombre} className={cn("flex items-center gap-2 text-b2", c.ok ? "text-success-900" : "text-error-900")}>
                    {c.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="font-semibold">{c.nombre}</span> · esperado {c.esperado} · obtenido {c.obtenido ?? c.error}
                  </p>
                ))}
              </CuerpoTarjeta>
            </Tarjeta>
          )}
          <MensajeError error={pruebas.error ?? simular.error} />

          <Tarjeta>
            <EncabezadoTarjeta titulo="Historial de la regla" subtitulo="Creación, ediciones, envíos, aprobaciones y activaciones" />
            <CuerpoTarjeta>{auditoria.data && <LineaAuditoria registros={auditoria.data} />}</CuerpoTarjeta>
          </Tarjeta>
        </div>
      </div>

      <PanelLateral abierto={!!simulacion} onCerrar={() => setSimulacion(null)} titulo={`Simulación de ${codigo} v${version.numero}`} subtitulo={simulacion?.nota} ancho="max-w-3xl">
        {simulacion && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Tarjeta className="p-4"><p className="text-a3 text-mid-600">Exposición cubierta</p><p className="text-s1 font-bold">{porcentaje(simulacion.coberturaActual)} → {porcentaje(simulacion.coberturaSimulada)}</p></Tarjeta>
              <Tarjeta className="p-4"><p className="text-a3 text-mid-600">Obligaciones bajo su objetivo</p><p className="text-s1 font-bold">{simulacion.obligacionesBajoObjetivoActual} → {simulacion.obligacionesBajoObjetivoSimulado}</p></Tarjeta>
            </div>
            <p className="text-b2">{simulacion.obligacionesConCambio} obligaciones cambiarían de cobertura.{simulacion.cambiosIdoneidad.length > 0 && ` ${simulacion.cambiosIdoneidad.length} garantías cambiarían de idoneidad.`}</p>
            {simulacion.cambios.length > 0 && (
              <table className="w-full text-b3">
                <thead><tr className="text-left text-mid-600"><th className="py-1">Obligación</th><th>Cobertura actual</th><th>Simulada</th><th>Objetivo</th></tr></thead>
                <tbody>
                  {simulacion.cambios.map((c) => (
                    <tr key={c.obligacion} className="border-t border-light-600">
                      <td className="py-1 font-semibold">{c.obligacion}</td>
                      <td>{porcentaje(c.ratioActual)}</td>
                      <td className={c.cumpleSimulado ? "text-success-900" : "text-error-900"}>{porcentaje(c.ratioSimulado)}</td>
                      <td>{c.cumpleActual === c.cumpleSimulado ? "Sin cambio" : c.cumpleSimulado ? <Insignia tono="exito">Pasa a cumplir</Insignia> : <Insignia tono="error">Deja de cumplir</Insignia>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {simulacion.cambiosIdoneidad.map((c) => <p key={c.garantia} className="text-b3">{c.garantia}: {humano(c.actual)} → {humano(c.simulada)} ({c.motivo})</p>)}
          </div>
        )}
      </PanelLateral>
    </>
  );
}
