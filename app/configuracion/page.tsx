"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CopyPlus, Plus, Power, Save, Send, Trash2, XCircle } from "lucide-react";
import { api, enviar } from "@/lib/api";
import type { TipoInfo, VersionTipo } from "@/lib/consultas";
import { cn, entero, fechaHora, humano } from "@/lib/formato";
import type { RegistroAuditoria } from "@/lib/tipos";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Campo, claseEntrada, Esqueleto, MensajeError, PanelLateral, Pestanas, Vacio } from "@/components/ui/varios";
import { LineaAuditoria } from "@/components/linea-auditoria";
import { CLASES, EditorTipo, edicionDe, REGISTROS, VistaVersion, type Edicion } from "@/components/editor-tipo";

interface TipoAdministracion {
  tipo: TipoInfo;
  publicada: VersionTipo | null;
  enCurso: VersionTipo | null;
  garantiasActivas: number;
}

const TONO_VERSION: Record<string, "exito" | "advertencia" | "neutro" | "error" | "info"> = {
  PUBLICADA: "exito", EN_REVISION: "advertencia", BORRADOR: "info", RECHAZADA: "error", REEMPLAZADA: "neutro", RETIRADA: "neutro",
};

type Pestana = "publicada" | "enCurso" | "historial" | "esquema";

export default function Configuracion() {
  const { perfil } = useSesion();
  const { data, isLoading, error } = useQuery({ queryKey: ["tipos-administracion"], queryFn: () => api<TipoAdministracion[]>("/tipos-garantia/administracion") });
  const [sel, setSel] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [filtro, setFiltro] = useState("");
  const esAdmin = tieneRol(perfil, "ADMIN_FUNCIONAL");
  const actual = data?.find((t) => t.tipo.codigo === sel) ?? data?.[0];
  const pendientes = data?.filter((t) => t.enCurso?.estado === "EN_REVISION").length ?? 0;

  return (
    <>
      <EncabezadoPagina
        antetitulo="Administración · M16"
        titulo="Tipos de garantía"
        descripcion="Catálogo configurable sin desarrollo: comportamiento, campos personalizados con obligatoriedad por estado, llave natural, checklist jurídico y plantilla de constitución. Cada cambio es una versión nueva que publica otro administrador (maker–checker); las garantías conservan la versión con la que se registraron."
        acciones={esAdmin && <Boton onClick={() => setNuevo(true)}><Plus className="h-4 w-4" /> Nuevo tipo</Boton>}
      />
      <MensajeError error={error} />
      {!esAdmin && !tieneRol(perfil, "AUDITOR", "CUMPLIMIENTO") ? (
        <Tarjeta><Vacio titulo="Sin acceso a la administración de tipos" detalle="La administran los Administradores funcionales; Auditoría y Cumplimiento la consultan." /></Tarjeta>
      ) : isLoading ? <Esqueleto className="h-96" /> : (
        <div className="grid gap-6 xl:grid-cols-4">
          <Tarjeta className="self-start">
            <div className="border-b border-light-600 p-3">
              <input className={claseEntrada} placeholder="Filtrar tipos" aria-label="Filtrar tipos" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
              {pendientes > 0 && <p className="mt-2 text-b3 text-warning-text">{pendientes} versión(es) esperan aprobación</p>}
            </div>
            <ul className="max-h-[70vh] overflow-y-auto p-2">
              {data?.filter((t) => `${t.tipo.nombre} ${t.tipo.codigo}`.toLowerCase().includes(filtro.toLowerCase())).map((t) => (
                <li key={t.tipo.codigo}>
                  <button onClick={() => setSel(t.tipo.codigo)} className={cn("w-full rounded-dg-8 px-3 py-2 text-left hover:bg-light-400", actual?.tipo.codigo === t.tipo.codigo && "bg-primary-100")}>
                    <span className={cn("block text-a2 font-semibold", !t.tipo.activo && "text-mid-400")}>{t.tipo.nombre}</span>
                    <span className="flex flex-wrap items-center gap-1 text-c text-mid-600">
                      {t.tipo.codigo} {t.publicada ? `· v${t.publicada.numero}` : "· sin publicar"} · {entero(t.garantiasActivas)} activas
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {!t.tipo.activo && <Insignia tono="neutro" sinIcono>Inactivo</Insignia>}
                      {t.enCurso && <Insignia tono={TONO_VERSION[t.enCurso.estado]} sinIcono>v{t.enCurso.numero} {humano(t.enCurso.estado).toLowerCase()}</Insignia>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Tarjeta>
          <div className="xl:col-span-3">{actual && <DetalleTipo key={actual.tipo.codigo} t={actual} esAdmin={esAdmin} />}</div>
        </div>
      )}
      <PanelNuevoTipo abierto={nuevo} onCerrar={() => setNuevo(false)} onCreado={(c) => { setNuevo(false); setSel(c); }} />
    </>
  );
}

function DetalleTipo({ t, esAdmin }: { t: TipoAdministracion; esAdmin: boolean }) {
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>(t.enCurso ? "enCurso" : "publicada");
  const [borrador, setBorrador] = useState<Edicion | null>(t.enCurso ? edicionDe(t.enCurso) : null);
  const [motivo, setMotivo] = useState("");
  const [estadoPanel, setEstadoPanel] = useState(false);
  useEffect(() => setBorrador(t.enCurso ? edicionDe(t.enCurso) : null), [t.enCurso]);

  const base = t.enCurso ? `/tipos-garantia/${t.tipo.codigo}/versiones/${t.enCurso.numero}` : "";
  const accion = useMutation({
    mutationFn: async (a: "nueva" | "guardar" | "enviar" | "aprobar" | "rechazar" | "descartar") => {
      switch (a) {
        case "nueva": return enviar(`/tipos-garantia/${t.tipo.codigo}/versiones`, "POST");
        case "guardar": return enviar(base, "PUT", borrador);
        case "enviar":
          await enviar(base, "PUT", borrador);
          return enviar(`${base}/envio`, "POST");
        case "aprobar": return enviar(`${base}/aprobacion`, "POST");
        case "rechazar": return enviar(`${base}/rechazo`, "POST", { motivo });
        case "descartar": return enviar(base, "DELETE");
      }
    },
    onSuccess: (_, a) => {
      cliente.invalidateQueries();
      if (a === "nueva") setPestana("enCurso");
      if (a === "aprobar" || a === "descartar") setPestana("publicada");
      setMotivo("");
    },
  });
  const versiones = useQuery({ queryKey: ["tipo-versiones", t.tipo.codigo], queryFn: () => api<VersionTipo[]>(`/tipos-garantia/${t.tipo.codigo}/versiones`), enabled: pestana === "historial" });
  const auditoria = useQuery({ queryKey: ["auditoria", "TipoGarantia", t.tipo.codigo], queryFn: () => api<RegistroAuditoria[]>(`/auditoria?entidad=TipoGarantia&entidadId=${t.tipo.codigo}`), enabled: pestana === "historial" });
  const esquema = useQuery({ queryKey: ["tipo-esquema", t.tipo.codigo], queryFn: () => api<unknown>(`/tipos-garantia/${t.tipo.codigo}/esquema`), enabled: pestana === "esquema" && !!t.publicada && t.tipo.activo });

  const v = t.enCurso;
  const editable = esAdmin && !!v && (v.estado === "BORRADOR" || v.estado === "RECHAZADA");
  const esAutor = v?.creadoPor === perfil.usuario;
  const anterior = t.publicada ? edicionDe(t.publicada) : undefined;

  return (
    <Tarjeta>
      <EncabezadoTarjeta
        titulo={<span className="flex flex-wrap items-center gap-2">{t.tipo.nombre} {!t.tipo.activo && <Insignia tono="neutro">Inactivo</Insignia>}</span>}
        subtitulo={`${t.tipo.codigo} · clase ${humano(t.tipo.clase)} · ${t.publicada ? `versión publicada ${t.publicada.numero}` : "sin versión publicada"} · ${entero(t.garantiasActivas)} garantías activas`}
        acciones={esAdmin && (
          <>
            {!v && t.publicada && <Boton variante="secundario" cargando={accion.isPending && accion.variables === "nueva"} onClick={() => accion.mutate("nueva")}><CopyPlus className="h-4 w-4" /> Nueva versión</Boton>}
            {t.publicada && <Boton variante="fantasma" onClick={() => setEstadoPanel(true)}><Power className="h-4 w-4" /> {t.tipo.activo ? "Inactivar" : "Reactivar"}</Boton>}
          </>
        )}
      />
      {t.tipo.motivoInactivacion && !t.tipo.activo && (
        <p className="border-b border-light-600 bg-light-400 px-5 py-2 text-b3 text-mid-600">Inactivado por {t.tipo.inactivadoPor} el {fechaHora(t.tipo.inactivadoEn)}: {t.tipo.motivoInactivacion}. No admite registros nuevos; las garantías existentes siguen su ciclo.</p>
      )}
      <div className="px-5 pt-2">
        <Pestanas<Pestana>
          activa={pestana}
          onCambiar={setPestana}
          opciones={[
            { id: "publicada", etiqueta: t.publicada ? `Versión publicada (v${t.publicada.numero})` : "Versión publicada" },
            ...(v ? [{ id: "enCurso" as const, etiqueta: `v${v.numero} · ${humano(v.estado)}` }] : []),
            { id: "historial", etiqueta: "Historial" },
            { id: "esquema", etiqueta: "Esquema API" },
          ]}
        />
      </div>
      <CuerpoTarjeta>
        {pestana === "publicada" && (t.publicada ? (
          <>
            <p className="mb-4 text-b3 text-mid-600">Publicada el {fechaHora(t.publicada.aprobadaEn)} · editó {t.publicada.creadoPor} · aprobó {t.publicada.aprobadoPor ?? "—"}{t.publicada.hash && <> · huella <span className="font-mono">{t.publicada.hash.slice(0, 12)}…</span></>}</p>
            <VistaVersion v={edicionDe(t.publicada)} />
          </>
        ) : <Vacio titulo="El tipo aún no tiene versión publicada" detalle="La versión 1 se publica cuando otro administrador la aprueba." />)}

        {pestana === "enCurso" && v && borrador && (
          <div className="space-y-6">
            <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-dg-12 border p-4",
              v.estado === "EN_REVISION" ? "border-warning-600 bg-warning-100" : v.estado === "RECHAZADA" ? "border-error-600 bg-error-100" : "border-info-800 bg-info-100")}>
              <div className="text-b2">
                <p className="font-semibold">
                  Versión {v.numero} · <Insignia tono={TONO_VERSION[v.estado]}>{humano(v.estado)}</Insignia>
                </p>
                <p className="mt-1 text-b3">
                  {v.estado === "EN_REVISION" ? `Enviada por ${v.creadoPor} el ${fechaHora(v.enviadaEn)}. La aprueba un administrador distinto (RF-1607).`
                    : v.estado === "RECHAZADA" ? `Rechazada: ${v.motivo}. Corrígela y vuelve a enviarla.`
                      : `Borrador de ${v.creadoPor}. Nada cambia en producción hasta que se publique.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <>
                    <Boton variante="secundario" cargando={accion.isPending && accion.variables === "guardar"} onClick={() => accion.mutate("guardar")}><Save className="h-4 w-4" /> Guardar</Boton>
                    <Boton cargando={accion.isPending && accion.variables === "enviar"} onClick={() => accion.mutate("enviar")}><Send className="h-4 w-4" /> Enviar a aprobación</Boton>
                    {t.publicada && <Boton variante="fantasma" onClick={() => confirm("¿Descartar este borrador?") && accion.mutate("descartar")}><Trash2 className="h-4 w-4" /> Descartar</Boton>}
                  </>
                )}
                {v.estado === "EN_REVISION" && esAdmin && !esAutor && (
                  <Boton cargando={accion.isPending && accion.variables === "aprobar"} onClick={() => accion.mutate("aprobar")}><CheckCircle2 className="h-4 w-4" /> Aprobar y publicar</Boton>
                )}
              </div>
            </div>
            {v.estado === "EN_REVISION" && esAdmin && esAutor && (
              <p className="text-b3 text-mid-600">Tú editaste esta versión: no puedes aprobarla. Cambia a otro administrador funcional en el encabezado.</p>
            )}
            {v.estado === "EN_REVISION" && esAdmin && !esAutor && (
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-72 flex-1"><Campo etiqueta="Motivo del rechazo"><input className={claseEntrada} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Campo></div>
                <Boton variante="peligro" disabled={!motivo.trim()} onClick={() => accion.mutate("rechazar")}><XCircle className="h-4 w-4" /> Rechazar</Boton>
              </div>
            )}
            <MensajeError error={accion.error} />
            {editable ? <EditorTipo valor={borrador} onCambiar={setBorrador} anterior={anterior} /> : <VistaVersion v={edicionDe(v)} anterior={anterior} />}
            {editable && (
              <div className="flex gap-2 border-t border-light-600 pt-4">
                <Boton variante="secundario" cargando={accion.isPending && accion.variables === "guardar"} onClick={() => accion.mutate("guardar")}><Save className="h-4 w-4" /> Guardar</Boton>
                <Boton cargando={accion.isPending && accion.variables === "enviar"} onClick={() => accion.mutate("enviar")}><Send className="h-4 w-4" /> Enviar a aprobación</Boton>
              </div>
            )}
          </div>
        )}

        {pestana === "historial" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-2 text-s2 font-semibold">Versiones</h3>
              {versiones.isLoading ? <Esqueleto className="h-40" /> : (
                <ul className="space-y-2">
                  {versiones.data?.map((x) => (
                    <li key={x.id} className="rounded-dg-8 border border-light-600 p-3 text-b2">
                      <p className="flex items-center gap-2 font-semibold">v{x.numero} <Insignia tono={TONO_VERSION[x.estado]} sinIcono>{humano(x.estado)}</Insignia></p>
                      <p className="text-b3 text-mid-600">
                        {x.campos.length} campos · {x.actividades.length} actividades · editó {x.creadoPor}{x.aprobadoPor && ` · aprobó ${x.aprobadoPor}`}
                        {x.aprobadaEn && ` · ${fechaHora(x.aprobadaEn)}`}
                      </p>
                      {x.motivo && <p className="text-b3 text-error-900">{x.motivo}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-s2 font-semibold">Auditoría</h3>
              {auditoria.data ? <LineaAuditoria registros={auditoria.data} /> : <Esqueleto className="h-40" />}
            </section>
          </div>
        )}

        {pestana === "esquema" && (
          <div>
            <p className="mb-3 text-b3 text-mid-600">
              Contrato que consumen los aplicativos de producto y Appian: <span className="font-mono">GET /api/v1/tipos-garantia/{t.tipo.codigo}/esquema</span>. Se genera solo desde la versión publicada (RF-1609), igual que la plantilla de carga masiva.
            </p>
            {!t.publicada || !t.tipo.activo ? <Vacio titulo="Sin esquema" detalle="El tipo no tiene versión publicada o está inactivo." /> : esquema.isLoading ? <Esqueleto className="h-64" /> : (
              <pre className="max-h-[60vh] overflow-auto rounded-dg-8 bg-dark-900 p-4 text-c text-white">{JSON.stringify(esquema.data, null, 2)}</pre>
            )}
          </div>
        )}
      </CuerpoTarjeta>
      <PanelEstado abierto={estadoPanel} t={t} onCerrar={() => setEstadoPanel(false)} />
    </Tarjeta>
  );
}

function PanelEstado({ abierto, t, onCerrar }: { abierto: boolean; t: TipoAdministracion; onCerrar: () => void }) {
  const cliente = useQueryClient();
  const [motivo, setMotivo] = useState("");
  const m = useMutation({
    mutationFn: () => enviar(`/tipos-garantia/${t.tipo.codigo}/estado`, "POST", { activo: !t.tipo.activo, motivo }),
    onSuccess: () => {
      cliente.invalidateQueries();
      onCerrar();
    },
  });
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo={t.tipo.activo ? `Inactivar ${t.tipo.nombre}` : `Reactivar ${t.tipo.nombre}`} ancho="max-w-lg">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        {t.tipo.activo && (
          <p className={cn("rounded-dg-8 border p-3 text-b2", t.garantiasActivas > 0 ? "border-warning-600 bg-warning-100 text-warning-text" : "border-light-600 bg-canvas")}>
            {t.garantiasActivas > 0
              ? `Hay ${entero(t.garantiasActivas)} garantías activas de este tipo. Siguen su ciclo de vida con normalidad; solo se bloquean los registros nuevos (API, captura manual y carga masiva).`
              : "No hay garantías activas de este tipo."}
          </p>
        )}
        <Campo etiqueta="Motivo" requerido><textarea className={`${claseEntrada} h-24 py-2`} value={motivo} onChange={(e) => setMotivo(e.target.value)} required /></Campo>
        <MensajeError error={m.error} />
        <Boton type="submit" variante={t.tipo.activo ? "peligro" : "primario"} cargando={m.isPending}>{t.tipo.activo ? "Inactivar tipo" : "Reactivar tipo"}</Boton>
      </form>
    </PanelLateral>
  );
}

function PanelNuevoTipo({ abierto, onCerrar, onCreado }: { abierto: boolean; onCerrar: () => void; onCreado: (codigo: string) => void }) {
  const cliente = useQueryClient();
  const [f, setF] = useState({ codigo: "", nombre: "", clase: "REAL_INMUEBLE", registroPublico: "NINGUNO", descripcion: "", requiereAvaluo: false, requierePoliza: false, admiteMultiples: true });
  const m = useMutation({
    mutationFn: () => enviar("/tipos-garantia", "POST", { ...f, descripcion: f.descripcion || null, campos: [], checklistJuridico: [], actividades: [] }),
    onSuccess: () => {
      cliente.invalidateQueries();
      onCreado(f.codigo);
    },
  });
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo="Nuevo tipo de garantía" subtitulo="Se crea la versión 1 en borrador. Después agregas campos, checklist y plantilla, y la envías a aprobación." ancho="max-w-lg">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Código" requerido ayuda="MAYÚSCULAS_CON_GUIONES. Es el identificador estable en API, eventos y reportes.">
          <input className={`${claseEntrada} font-mono`} value={f.codigo} onChange={(e) => setF((x) => ({ ...x, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} pattern="[A-Z][A-Z0-9_]{2,49}" required />
        </Campo>
        <Campo etiqueta="Nombre" requerido><input className={claseEntrada} value={f.nombre} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} required /></Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Clase" requerido>
            <input className={claseEntrada} list="clases-nuevo" value={f.clase} onChange={(e) => setF((x) => ({ ...x, clase: e.target.value.toUpperCase() }))} required />
            <datalist id="clases-nuevo">{CLASES.map((c) => <option key={c} value={c}>{humano(c)}</option>)}</datalist>
          </Campo>
          <Campo etiqueta="Registro público">
            <select className={claseEntrada} value={f.registroPublico} onChange={(e) => setF((x) => ({ ...x, registroPublico: e.target.value }))}>
              {REGISTROS.map((r) => <option key={r} value={r}>{r === "NINGUNO" ? "No aplica" : humano(r)}</option>)}
            </select>
          </Campo>
        </div>
        <Campo etiqueta="Descripción"><input className={claseEntrada} value={f.descripcion} onChange={(e) => setF((x) => ({ ...x, descripcion: e.target.value }))} /></Campo>
        <div className="flex flex-col gap-2">
          {([["requiereAvaluo", "Requiere avalúo"], ["requierePoliza", "Requiere póliza"], ["admiteMultiples", "Puede respaldar varias obligaciones"]] as const).map(([k, t]) => (
            <label key={k} className="flex items-center gap-2 text-a2"><input type="checkbox" checked={f[k]} onChange={(e) => setF((x) => ({ ...x, [k]: e.target.checked }))} /> {t}</label>
          ))}
        </div>
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending}>Crear borrador</Boton>
      </form>
    </PanelLateral>
  );
}
