"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Download, FileSpreadsheet, Hash, RotateCcw, Send, ShieldCheck, Upload, XCircle } from "lucide-react";
import { api, descargar, enviar, subir } from "@/lib/api";
import { useTipos } from "@/lib/consultas";
import { cn, entero, fechaHora, humano } from "@/lib/formato";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";
import { Campo, claseEntrada, Esqueleto, MensajeError, Pestanas, Vacio } from "@/components/ui/varios";

interface Carga {
  id: string;
  numero: number;
  tipo: string;
  tipoNombre: string;
  versionTipo: number;
  archivoNombre: string;
  archivoHash: string;
  archivoBytes: number;
  estado: "VALIDADA" | "CON_ERRORES" | "EN_APROBACION" | "EN_PROCESO" | "PROCESADA" | "PROCESADA_CON_FALLOS" | "RECHAZADA" | "CANCELADA";
  totalFilas: number;
  filasNuevas: number;
  filasActualizacion: number;
  filasError: number;
  filasProcesadas: number;
  filasFallidas: number;
  incluirActualizaciones: boolean;
  creadoPor: string;
  enviadoPor: string | null;
  aprobadoPor: string | null;
  motivo: string | null;
  creadaEn: string;
  enviadaEn: string | null;
  decididaEn: string | null;
  procesadaEn: string | null;
}

interface FilaCarga {
  numero: number;
  accion: "CREAR" | "ACTUALIZAR" | "NINGUNA";
  estado: "VALIDA" | "ERROR" | "OMITIDA" | "PROCESADA" | "FALLIDA";
  original: Record<string, string>;
  detectadaPor: string | null;
  errores: string[];
  garantia: string | null;
}

type Detalle = Carga & { filas: FilaCarga[] };

const TONO_CARGA: Record<Carga["estado"], "exito" | "advertencia" | "error" | "info" | "neutro"> = {
  VALIDADA: "info", CON_ERRORES: "advertencia", EN_APROBACION: "advertencia", EN_PROCESO: "info", PROCESADA: "exito",
  PROCESADA_CON_FALLOS: "advertencia", RECHAZADA: "error", CANCELADA: "neutro",
};

const PASOS = ["Plantilla", "Carga y validación", "Revisión y envío", "Aprobación"];

function paso(c: Carga | undefined) {
  if (!c) return 0;
  if (c.estado === "VALIDADA" || c.estado === "CON_ERRORES") return 2;
  return 3;
}

export default function CargaMasiva() {
  const { perfil } = useSesion();
  const puedeCargar = tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR");
  const puedeConsultar = puedeCargar || tieneRol(perfil, "AUDITOR", "CUMPLIMIENTO");
  const [cargaId, setCargaId] = useState<string | null>(null);
  const historial = useQuery({
    queryKey: ["cargas-masivas"],
    queryFn: () => api<Carga[]>("/cargas-masivas"),
    enabled: puedeConsultar,
    refetchInterval: (q) => (q.state.data?.some((c) => c.estado === "EN_PROCESO") ? 2000 : false),
  });
  const detalle = useQuery({
    queryKey: ["carga-masiva", cargaId],
    queryFn: () => api<Detalle>(`/cargas-masivas/${cargaId}`),
    enabled: !!cargaId,
    refetchInterval: (q) => (q.state.data?.estado === "EN_PROCESO" ? 1500 : false),
  });
  const pendientes = historial.data?.filter((c) => c.estado === "EN_APROBACION") ?? [];
  const actual = cargaId ? detalle.data : undefined;
  const pasoActual = cargaId ? paso(actual) : 0;

  if (!puedeConsultar) {
    return (
      <>
        <EncabezadoPagina titulo="Carga masiva" />
        <Tarjeta><Vacio titulo="Tu perfil no gestiona cargas masivas" detalle="Las crea un Gestor de Operaciones y las aprueba un Director de Operaciones distinto." /></Tarjeta>
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina
        antetitulo="Administración · M17"
        titulo="Carga masiva de garantías"
        descripcion="Asistente de 4 pasos: plantilla por tipo, validación de estructura y de cada fila sin tocar el maestro, confirmación aparte de las filas que actualizan garantías existentes y aprobación de un Director de Operaciones distinto de quien carga."
        acciones={cargaId && <Boton variante="secundario" onClick={() => setCargaId(null)}><RotateCcw className="h-4 w-4" /> Nueva carga</Boton>}
      />

      <ol className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Pasos del asistente">
        {PASOS.map((p, k) => {
          const hecho = k < pasoActual || (k === 3 && actual && ["PROCESADA", "PROCESADA_CON_FALLOS"].includes(actual.estado));
          return (
            <li key={p} className={cn("flex items-center gap-2 rounded-dg-12 border px-3 py-2 text-a2",
              k === pasoActual ? "border-primary-600 bg-primary-100 font-semibold text-primary-900" : hecho ? "border-success-600 bg-success-100 text-success-900" : "border-light-600 bg-white text-mid-600")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-b3 font-bold", k === pasoActual ? "bg-primary-600 text-white" : hecho ? "bg-success-900 text-white" : "bg-light-400")}>
                {hecho ? <Check className="h-3.5 w-3.5" /> : k + 1}
              </span>
              {p}
            </li>
          );
        })}
      </ol>

      {pendientes.length > 0 && tieneRol(perfil, "OPERACIONES_DIRECTOR") && !cargaId && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-dg-12 border border-warning-600 bg-warning-100 p-4 text-b2 text-warning-text">
          <ShieldCheck className="h-5 w-5" aria-hidden />
          <span className="flex-1">{pendientes.length} carga(s) esperan tu aprobación.</span>
          {pendientes.slice(0, 3).map((c) => <Boton key={c.id} variante="secundario" onClick={() => setCargaId(c.id)}>Revisar #{c.numero}</Boton>)}
        </div>
      )}

      {!cargaId ? (
        puedeCargar ? <PasosIniciales onCargada={setCargaId} /> : <Tarjeta><Vacio titulo="Consulta del historial" detalle="Tu perfil consulta las cargas; no las crea." /></Tarjeta>
      ) : detalle.isLoading || !actual ? <Esqueleto className="h-96" /> : (
        <DetalleCarga c={actual} />
      )}
      <MensajeError error={detalle.error} />

      <Tarjeta className="mt-6">
        <EncabezadoTarjeta titulo="Historial de cargas" subtitulo="Cada carga conserva la huella SHA-256 del archivo, el resultado por fila y su auditoría" />
        {historial.isLoading ? <Esqueleto className="m-4 h-32" /> : !historial.data?.length ? <Vacio titulo="Aún no hay cargas" /> : (
          <Tabla>
            <thead><tr><Th>#</Th><Th>Tipo</Th><Th>Archivo</Th><Th>Estado</Th><Th numerica>Filas</Th><Th numerica>Nuevas</Th><Th numerica>Actualiza</Th><Th numerica>Errores</Th><Th>Creó / aprobó</Th><Th>Fecha</Th></tr></thead>
            <tbody>
              {historial.data.map((c) => (
                <Fila key={c.id} onClick={() => setCargaId(c.id)} className={cn(c.id === cargaId && "bg-primary-100")}>
                  <Td className="font-semibold text-link">#{c.numero}</Td>
                  <Td className="text-b3">{c.tipoNombre} <span className="text-mid-600">v{c.versionTipo}</span></Td>
                  <Td className="max-w-56 truncate text-b3" title={c.archivoNombre}>{c.archivoNombre}</Td>
                  <Td><Insignia tono={TONO_CARGA[c.estado]}>{humano(c.estado)}</Insignia></Td>
                  <Td numerica>{entero(c.totalFilas)}</Td>
                  <Td numerica>{entero(c.filasNuevas)}</Td>
                  <Td numerica>{entero(c.filasActualizacion)}</Td>
                  <Td numerica className={cn(c.filasError > 0 && "font-semibold text-error-900")}>{entero(c.filasError)}</Td>
                  <Td className="text-b3">{c.creadoPor}{c.aprobadoPor && <> / {c.aprobadoPor}</>}</Td>
                  <Td className="text-b3">{fechaHora(c.creadaEn)}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </>
  );
}

// ------------------------------------------------------------------ pasos 1 y 2

function PasosIniciales({ onCargada }: { onCargada: (id: string) => void }) {
  const cliente = useQueryClient();
  const { data: tipos } = useTipos();
  const { data: limites } = useQuery({ queryKey: ["cargas-limites"], queryFn: () => api<{ maxBytes: number; maxFilas: number; maxSegundosValidacion: number }>("/cargas-masivas/limites") });
  const [tipo, setTipo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const definicion = tipos?.find((t) => t.tipo.codigo === tipo);
  const plantilla = useMutation({ mutationFn: () => descargar(`/cargas-masivas/plantilla?tipo=${tipo}`, `plantilla-${tipo.toLowerCase()}-v${definicion?.version.numero}.xlsx`) });
  const cargar = useMutation({
    mutationFn: () => {
      const datos = new FormData();
      datos.append("tipo", tipo);
      datos.append("archivo", archivo!);
      return subir<Detalle>("/cargas-masivas", datos);
    },
    onSuccess: (c) => {
      cliente.invalidateQueries({ queryKey: ["cargas-masivas"] });
      cliente.setQueryData(["carga-masiva", c.id], c);
      onCargada(c.id);
    },
  });
  const mb = limites ? Math.round(limites.maxBytes / 1024 / 1024) : 5;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Tarjeta>
        <EncabezadoTarjeta titulo="1. Descarga la plantilla del tipo" subtitulo="Generada desde la versión publicada: columnas transversales + campos del tipo, con listas desplegables e instrucciones" />
        <CuerpoTarjeta className="space-y-4">
          <Campo etiqueta="Tipo de garantía" requerido>
            <select className={claseEntrada} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Selecciona…</option>
              {tipos?.map((t) => <option key={t.tipo.codigo} value={t.tipo.codigo}>{t.tipo.nombre}</option>)}
            </select>
          </Campo>
          {definicion && (
            <p className="text-b3 text-mid-600">
              Versión {definicion.version.numero} · {definicion.campos.length} campos del tipo ({definicion.campos.filter((c) => c.obligatorio && !c.obligatorioDesde).length} obligatorios al crear)
              {definicion.campos.some((c) => c.llave) && ` · llave natural: ${definicion.campos.filter((c) => c.llave).map((c) => c.etiqueta).join(", ")}`}
            </p>
          )}
          <Boton variante="secundario" disabled={!tipo} cargando={plantilla.isPending} onClick={() => plantilla.mutate()}><Download className="h-4 w-4" /> Descargar plantilla .xlsx</Boton>
          <MensajeError error={plantilla.error} />
          <ul className="list-disc space-y-1 pl-5 text-b3 text-mid-600">
            <li>Una garantía por fila, desde la fila 3. No modifiques las filas 1 (títulos) y 2 (códigos).</li>
            <li>Si la referencia o la llave natural ya existen, la fila <strong>actualiza</strong> esa garantía y se confirma aparte.</li>
            <li>No se admiten fórmulas: la celda se rechaza. Fechas AAAA-MM-DD; números sin separador de miles.</li>
            <li>Límites: {mb} MB, {entero(limites?.maxFilas ?? 5000)} filas, {limites?.maxSegundosValidacion ?? 120} s de validación. Formatos .xlsx y .csv (; o ,).</li>
          </ul>
        </CuerpoTarjeta>
      </Tarjeta>
      <Tarjeta>
        <EncabezadoTarjeta titulo="2. Carga el archivo diligenciado" subtitulo="Se valida la estructura y cada fila. Nada se registra hasta la aprobación." />
        <CuerpoTarjeta className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); setArchivo(e.dataTransfer.files?.[0] ?? null); }}
            className={cn("flex flex-col items-center justify-center gap-2 rounded-dg-12 border-2 border-dashed px-6 py-10 text-center",
              arrastrando ? "border-primary-600 bg-primary-100" : "border-light-900 bg-canvas")}
          >
            <FileSpreadsheet className="h-10 w-10 text-primary-600" aria-hidden />
            {archivo ? (
              <p className="text-a2 font-semibold">{archivo.name} <span className="font-normal text-mid-600">({Math.ceil(archivo.size / 1024)} KB)</span></p>
            ) : <p className="text-b2 text-mid-600">Arrastra aquí el archivo .xlsx o .csv</p>}
            <Boton variante="fantasma" type="button" onClick={() => entrada.current?.click()}>Seleccionar archivo</Boton>
            <input ref={entrada} type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
          </div>
          {archivo && archivo.size > (limites?.maxBytes ?? 5_242_880) && <p className="text-b3 text-error-900">El archivo supera {mb} MB.</p>}
          <MensajeError error={cargar.error} />
          <Boton disabled={!tipo || !archivo} cargando={cargar.isPending} onClick={() => cargar.mutate()}><Upload className="h-4 w-4" /> Validar archivo</Boton>
          {!tipo && <p className="text-b3 text-mid-600">Selecciona primero el tipo de garantía.</p>}
        </CuerpoTarjeta>
      </Tarjeta>
    </div>
  );
}

// ------------------------------------------------------------------ pasos 3 y 4

type FiltroFilas = "ERROR" | "ACTUALIZAR" | "CREAR" | "TODAS";

function DetalleCarga({ c }: { c: Detalle }) {
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const [filtro, setFiltro] = useState<FiltroFilas>(c.filasError > 0 ? "ERROR" : c.filasActualizacion > 0 ? "ACTUALIZAR" : "TODAS");
  const [confirmaActualizaciones, setConfirmaActualizaciones] = useState(false);
  const [excluirErrores, setExcluirErrores] = useState(false);
  const [motivo, setMotivo] = useState("");
  const accion = useMutation({
    mutationFn: (a: "enviar" | "aprobar" | "rechazar" | "cancelar") => {
      const base = `/cargas-masivas/${c.id}`;
      switch (a) {
        case "enviar": return enviar(`${base}/envio`, "POST", { incluirActualizaciones: confirmaActualizaciones, excluirErrores });
        case "aprobar": return enviar(`${base}/aprobacion`, "POST");
        case "rechazar": return enviar(`${base}/rechazo`, "POST", { motivo });
        case "cancelar": return enviar(`${base}/cancelacion`, "POST", { motivo: motivo || null });
      }
    },
    onSuccess: () => cliente.invalidateQueries(),
  });
  const reporte = useMutation({ mutationFn: (solo: boolean) => descargar(`/cargas-masivas/${c.id}/reporte?soloErrores=${solo}`, `carga-${c.numero}-${solo ? "errores" : "resultado"}.csv`) });

  const filas = c.filas.filter((f) =>
    filtro === "TODAS" ? true : filtro === "ERROR" ? f.estado === "ERROR" || f.estado === "FALLIDA" : f.accion === filtro && f.estado !== "ERROR");
  const omitidas = c.filas.filter((f) => f.estado === "OMITIDA").length;
  const enRevision = c.estado === "VALIDADA" || c.estado === "CON_ERRORES";
  const esCreador = perfil.usuario === c.creadoPor || perfil.usuario === c.enviadoPor;
  const procesables = c.filasNuevas + (confirmaActualizaciones ? c.filasActualizacion : 0);
  const avance = c.filasNuevas + (c.incluirActualizaciones ? c.filasActualizacion : 0);

  return (
    <div className="space-y-6">
      <Tarjeta>
        <EncabezadoTarjeta
          titulo={<span className="flex flex-wrap items-center gap-2">Carga #{c.numero} · {c.tipoNombre} <Insignia tono={TONO_CARGA[c.estado]}>{humano(c.estado)}</Insignia></span>}
          subtitulo={<span className="inline-flex flex-wrap items-center gap-1">{c.archivoNombre} · {Math.ceil(c.archivoBytes / 1024)} KB · versión de tipo {c.versionTipo} · <Hash className="h-3 w-3" /> <span className="font-mono">{c.archivoHash.slice(0, 16)}…</span> · creó {c.creadoPor} el {fechaHora(c.creadaEn)}</span>}
          acciones={<Boton variante="secundario" cargando={reporte.isPending} onClick={() => reporte.mutate(c.filasError > 0 && enRevision)}><Download className="h-4 w-4" /> {c.filasError > 0 && enRevision ? "Reporte de errores" : "Reporte por fila"}</Boton>}
        />
        <CuerpoTarjeta>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              ["Filas leídas", c.totalFilas, ""],
              ["Garantías nuevas", c.filasNuevas, "text-success-900"],
              ["Actualizan existentes", c.filasActualizacion, "text-info-900"],
              ["Con error", c.filasError, c.filasError > 0 ? "text-error-900" : ""],
              ["Sin cambios / omitidas", omitidas, ""],
            ].map(([t, v, tono]) => (
              <div key={t as string} className="rounded-dg-8 bg-canvas p-3">
                <p className="text-a3 text-mid-600">{t}</p>
                <p className={cn("text-s1 font-bold tabular-nums", tono as string)}>{entero(v as number)}</p>
              </div>
            ))}
          </div>
          <MensajeError error={reporte.error} />
        </CuerpoTarjeta>
      </Tarjeta>

      {enRevision && (
        <Tarjeta className="border-primary-600">
          <EncabezadoTarjeta titulo="3. Revisión y envío a aprobación" subtitulo="Revisa los errores por fila. Las filas que actualizan garantías existentes requieren una confirmación aparte." />
          <CuerpoTarjeta className="space-y-3">
            {c.filasActualizacion > 0 && (
              <label className="flex items-start gap-2 rounded-dg-8 border border-info-800 bg-info-100 p-3 text-b2 text-info-900">
                <input type="checkbox" className="mt-1" checked={confirmaActualizaciones} onChange={(e) => setConfirmaActualizaciones(e.target.checked)} />
                <span>Confirmo que las <strong>{c.filasActualizacion}</strong> filas que coinciden con garantías existentes deben <strong>actualizarlas</strong> (atributos, gravámenes o nueva valoración). Si no lo confirmas, esas filas se omiten.</span>
              </label>
            )}
            {c.filasError > 0 && (
              <label className="flex items-start gap-2 rounded-dg-8 border border-warning-600 bg-warning-100 p-3 text-b2 text-warning-text">
                <input type="checkbox" className="mt-1" checked={excluirErrores} onChange={(e) => setExcluirErrores(e.target.checked)} />
                <span>Hay <strong>{c.filasError}</strong> filas con error. Envía solo las válidas y excluye las demás (descarga el reporte, corrígelas y cárgalas de nuevo), o cancela esta carga.</span>
              </label>
            )}
            <MensajeError error={accion.error} />
            {tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR") ? (
              <div className="flex flex-wrap items-center gap-2">
                <Boton disabled={procesables === 0 || (c.filasError > 0 && !excluirErrores)} cargando={accion.isPending && accion.variables === "enviar"} onClick={() => accion.mutate("enviar")}>
                  <Send className="h-4 w-4" /> Enviar {entero(procesables)} filas a aprobación
                </Boton>
                {perfil.usuario === c.creadoPor && <Boton variante="fantasma" onClick={() => accion.mutate("cancelar")}><XCircle className="h-4 w-4" /> Cancelar carga</Boton>}
              </div>
            ) : <p className="text-b3 text-mid-600">Solo Operaciones envía la carga a aprobación.</p>}
          </CuerpoTarjeta>
        </Tarjeta>
      )}

      {!enRevision && (
        <Tarjeta className={cn(c.estado === "EN_APROBACION" && "border-warning-600")}>
          <EncabezadoTarjeta titulo="4. Aprobación y procesamiento" subtitulo="Maker–checker: la aprueba un Director de Operaciones distinto de quien la creó o envió" />
          <CuerpoTarjeta className="space-y-4">
            <dl className="grid grid-cols-2 gap-4 text-b2 md:grid-cols-4">
              <div><dt className="text-a3 text-mid-600">Envió</dt><dd>{c.enviadoPor ?? "—"} {c.enviadaEn && <span className="text-b3 text-mid-600">· {fechaHora(c.enviadaEn)}</span>}</dd></div>
              <div><dt className="text-a3 text-mid-600">Actualizaciones</dt><dd>{c.incluirActualizaciones ? "Confirmadas" : c.filasActualizacion > 0 ? "No confirmadas (se omiten)" : "No aplica"}</dd></div>
              <div><dt className="text-a3 text-mid-600">Decidió</dt><dd>{c.aprobadoPor ?? "—"} {c.decididaEn && <span className="text-b3 text-mid-600">· {fechaHora(c.decididaEn)}</span>}</dd></div>
              <div><dt className="text-a3 text-mid-600">Procesada</dt><dd>{fechaHora(c.procesadaEn)}</dd></div>
            </dl>
            {c.motivo && <p className="rounded-dg-8 bg-light-400 p-3 text-b2">Motivo: {c.motivo}</p>}
            {(c.estado === "EN_PROCESO" || c.estado.startsWith("PROCESADA")) && (
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-light-600">
                    <div className={cn("h-full", c.filasFallidas > 0 ? "bg-warning-600" : "bg-success-900")} style={{ width: `${avance ? Math.round(((c.filasProcesadas + c.filasFallidas) / avance) * 100) : 100}%` }} />
                  </div>
                  <span className="text-a2 tabular-nums">{c.filasProcesadas + c.filasFallidas}/{avance}</span>
                </div>
                <p className="mt-1 text-b3 text-mid-600">{entero(c.filasProcesadas)} procesadas · {entero(c.filasFallidas)} fallidas{c.estado === "EN_PROCESO" && " · procesando…"}</p>
              </div>
            )}
            {c.estado === "EN_APROBACION" && (
              tieneRol(perfil, "OPERACIONES_DIRECTOR") && !esCreador ? (
                <div className="space-y-3">
                  <MensajeError error={accion.error} />
                  <div className="flex flex-wrap items-end gap-2">
                    <Boton cargando={accion.isPending && accion.variables === "aprobar"} onClick={() => accion.mutate("aprobar")}><CheckCircle2 className="h-4 w-4" /> Aprobar y procesar</Boton>
                    <div className="min-w-64 flex-1"><Campo etiqueta="Motivo del rechazo"><input className={claseEntrada} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Campo></div>
                    <Boton variante="peligro" disabled={!motivo.trim()} onClick={() => accion.mutate("rechazar")}><XCircle className="h-4 w-4" /> Rechazar</Boton>
                  </div>
                </div>
              ) : (
                <p className="text-b3 text-mid-600">
                  {esCreador ? "Tú creaste o enviaste esta carga: la aprueba otro Director de Operaciones." : "Pendiente de aprobación de un Director de Operaciones."}
                  {esCreador && perfil.usuario === c.creadoPor && <Boton variante="fantasma" onClick={() => accion.mutate("cancelar")}>Cancelar carga</Boton>}
                </p>
              )
            )}
          </CuerpoTarjeta>
        </Tarjeta>
      )}

      <Tarjeta>
        <div className="px-5 pt-2">
          <Pestanas<FiltroFilas>
            activa={filtro}
            onCambiar={setFiltro}
            opciones={[
              { id: "ERROR", etiqueta: "Con error", conteo: c.filas.filter((f) => f.estado === "ERROR" || f.estado === "FALLIDA").length },
              { id: "ACTUALIZAR", etiqueta: "Actualizan", conteo: c.filas.filter((f) => f.accion === "ACTUALIZAR" && f.estado !== "ERROR").length },
              { id: "CREAR", etiqueta: "Nuevas", conteo: c.filas.filter((f) => f.accion === "CREAR" && f.estado !== "ERROR").length },
              { id: "TODAS", etiqueta: "Todas", conteo: c.filas.length },
            ]}
          />
        </div>
        {filas.length === 0 ? <Vacio titulo="Sin filas en esta vista" /> : (
          <Tabla>
            <thead><tr><Th>Fila</Th><Th>Referencia</Th><Th>Cliente</Th><Th>Acción</Th><Th>Estado</Th><Th>Garantía</Th><Th>Detalle</Th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.numero} className={cn(f.estado === "ERROR" || f.estado === "FALLIDA" ? "bg-error-100" : "")}>
                  <Td className="tabular-nums">{f.numero}</Td>
                  <Td className="font-mono text-b3">{f.original?.referencia || "—"}</Td>
                  <Td className="text-b3">{f.original?.clienteNombre || f.original?.clienteNumeroDocumento || "—"}</Td>
                  <Td className="text-b3">{f.accion === "ACTUALIZAR" ? <>Actualiza{f.detectadaPor && <span className="block text-c text-mid-600">por {f.detectadaPor}</span>}</> : f.accion === "CREAR" ? "Crea" : "—"}</Td>
                  <Td><Insignia tono={f.estado === "PROCESADA" || f.estado === "VALIDA" ? "exito" : f.estado === "OMITIDA" ? "neutro" : "error"} sinIcono>{humano(f.estado)}</Insignia></Td>
                  <Td>{f.garantia ? <Link href={`/garantias/${f.garantia}`} className="font-semibold text-link underline">{f.garantia}</Link> : "—"}</Td>
                  <Td className="text-b3">
                    {f.errores.length > 0 ? <ul className="list-disc pl-4 text-error-900">{f.errores.map((e, k) => <li key={k}>{e}</li>)}</ul> : <span className="text-mid-600">—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
