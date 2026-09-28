"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { CampoDefinicion, Comportamiento, ItemChecklist, PlantillaActividad, TipoDato, VersionTipo } from "@/lib/consultas";
import { cn, humano } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Campo, claseEntrada } from "@/components/ui/varios";
import { Tabla, Td, Th } from "@/components/ui/tabla";

export interface Edicion {
  comportamiento: Comportamiento;
  campos: CampoDefinicion[];
  checklistJuridico: ItemChecklist[];
  actividades: PlantillaActividad[];
}

export const TIPOS_DATO: TipoDato[] = ["TEXTO", "TEXTO_LARGO", "NUMERO", "MONEDA", "FECHA", "BOOLEANO", "LISTA", "LISTA_MULTIPLE"];
export const REGISTROS = ["NINGUNO", "ORIP", "RGM", "RUNT", "FNA", "FNG", "FAG", "CAMARA_COMERCIO"];
export const CLASES = ["REAL_INMUEBLE", "VEHICULO", "MOBILIARIA", "DEPOSITO", "FONDO_GARANTIAS", "FIDUCIARIA", "DERECHO_ECONOMICO", "PERSONAL"];
const MACROESTADOS = ["REGISTRO", "ESTUDIO_JURIDICO", "CONSTITUCION", "PERFECCIONAMIENTO", "ACTIVA"];
const ROLES_OPERATIVOS = ["OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR", "JURIDICA_GESTOR", "JURIDICA_DIRECTOR"];

export const edicionDe = (v: VersionTipo): Edicion => structuredClone({
  comportamiento: v.comportamiento,
  campos: v.campos ?? [],
  checklistJuridico: v.checklistJuridico ?? [],
  actividades: v.actividades ?? [],
});

/** Diferencias de un campo frente a la versión publicada, para la revisión (maker–checker). */
export function cambio(campo: { codigo: string }, anteriores: { codigo: string }[] | undefined): "nuevo" | "modificado" | null {
  if (!anteriores) return null;
  const previo = anteriores.find((a) => a.codigo === campo.codigo);
  if (!previo) return "nuevo";
  return JSON.stringify(previo) === JSON.stringify(campo) ? null : "modificado";
}

function Marca({ c }: { c: "nuevo" | "modificado" | null }) {
  if (!c) return null;
  return <Insignia tono={c === "nuevo" ? "exito" : "advertencia"} sinIcono className="ml-1">{c === "nuevo" ? "Nuevo" : "Modificado"}</Insignia>;
}

function mover<T>(lista: T[], i: number, d: -1 | 1) {
  const j = i + d;
  if (j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

// ------------------------------------------------------------------ vista de solo lectura

export function VistaVersion({ v, anterior }: { v: Edicion; anterior?: Edicion }) {
  const c = v.comportamiento;
  const eliminados = anterior?.campos.filter((a) => !v.campos.some((x) => x.codigo === a.codigo)) ?? [];
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Dt t="Nombre">{c.nombre}</Dt>
        <Dt t="Clase">{humano(c.clase)}</Dt>
        <Dt t="Registro público">{c.registroPublico === "NINGUNO" ? "No aplica" : c.registroPublico}</Dt>
        <Dt t="Comportamiento">
          <span className="flex flex-wrap gap-1">
            <Insignia tono={c.requiereAvaluo ? "info" : "neutro"} sinIcono>{c.requiereAvaluo ? "Requiere avalúo" : "Sin avalúo"}</Insignia>
            <Insignia tono={c.requierePoliza ? "info" : "neutro"} sinIcono>{c.requierePoliza ? "Requiere póliza" : "Sin póliza"}</Insignia>
            <Insignia tono="neutro" sinIcono>{c.admiteMultiples ? "Varias obligaciones" : "Una obligación"}</Insignia>
          </span>
        </Dt>
        {c.descripcion && <Dt t="Descripción" className="col-span-full">{c.descripcion}</Dt>}
      </dl>
      <section>
        <h3 className="mb-2 text-s2 font-semibold">Campos personalizados ({v.campos.length})</h3>
        <Tabla>
          <thead><tr><Th>Campo</Th><Th>Tipo de dato</Th><Th>Grupo</Th><Th>Obligatorio</Th><Th>Llave</Th><Th>Opciones / validación</Th></tr></thead>
          <tbody>
            {[...v.campos].sort((a, b) => a.orden - b.orden).map((f) => (
              <tr key={f.codigo}>
                <Td><p className="font-semibold">{f.etiqueta}<Marca c={cambio(f, anterior?.campos)} /></p><p className="font-mono text-c text-mid-600">{f.codigo}</p></Td>
                <Td className="text-b3">{humano(f.tipo)}</Td>
                <Td className="text-b3">{f.grupo ?? "—"}</Td>
                <Td className="text-b3">{f.obligatorio ? (f.obligatorioDesde ? `Desde ${humano(f.obligatorioDesde)}` : "Desde el registro") : "No"}</Td>
                <Td>{f.llave ? <Insignia tono="marca">Llave</Insignia> : "—"}</Td>
                <Td className="text-b3">
                  {f.opciones?.map((o) => <span key={o.id} className={cn("mr-2", !o.activo && "text-mid-400 line-through")}>{o.etiqueta}</span>)}
                  {!f.opciones && [f.patron && `Formato ${f.patron}`, f.minimo != null && `Mín. ${f.minimo}`, f.maximo != null && `Máx. ${f.maximo}`, f.ayuda].filter(Boolean).join(" · ")}
                </Td>
              </tr>
            ))}
            {eliminados.map((f) => (
              <tr key={f.codigo} className="bg-error-100">
                <Td><p className="font-semibold line-through">{f.etiqueta}</p><Insignia tono="error" sinIcono>Eliminado</Insignia></Td>
                <Td colSpan={5} className="text-b3 text-error-900">Las garantías registradas con la versión anterior conservan este dato; las nuevas no lo piden.</Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-2 text-s2 font-semibold">Checklist jurídico ({v.checklistJuridico.length})</h3>
          <ul className="space-y-1.5 text-b2">
            {v.checklistJuridico.map((i) => (
              <li key={i.codigo} className="rounded-dg-8 border border-light-600 px-3 py-2">
                {i.descripcion}{!i.obligatorio && <span className="text-mid-600"> (opcional)</span>}<Marca c={cambio(i, anterior?.checklistJuridico)} />
              </li>
            ))}
            {v.checklistJuridico.length === 0 && <li className="text-b3 text-mid-600">Sin checklist.</li>}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-s2 font-semibold">Plantilla de constitución ({v.actividades.length})</h3>
          <ol className="space-y-1.5 text-b2">
            {[...v.actividades].sort((a, b) => a.orden - b.orden).map((a) => (
              <li key={a.codigo} className="rounded-dg-8 border border-light-600 px-3 py-2">
                <p className="font-semibold">{a.nombre}{!a.obligatoria && <span className="font-normal text-mid-600"> (opcional)</span>}<Marca c={cambio(a, anterior?.actividades)} /></p>
                <p className="text-b3 text-mid-600">
                  {a.diasPlazo != null ? `${a.diasPlazo} días` : "Sin plazo"} · {a.requiereEvidencia ? "Exige evidencia" : "Sin evidencia"}
                  {a.rolResponsable && ` · ${humano(a.rolResponsable)}`}
                  {a.campos.length > 0 && ` · Captura: ${a.campos.join(", ")}`}
                </p>
              </li>
            ))}
            {v.actividades.length === 0 && <li className="text-b3 text-mid-600">Sin plantilla: las garantías de este tipo no generan plan.</li>}
          </ol>
        </section>
      </div>
    </div>
  );
}

function Dt({ t, children, className }: { t: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-a3 font-medium text-mid-600">{t}</dt>
      <dd className="mt-0.5 text-b1 text-dark-600">{children}</dd>
    </div>
  );
}

// ------------------------------------------------------------------ editor

export function EditorTipo({ valor, onCambiar, anterior }: { valor: Edicion; onCambiar: (e: Edicion) => void; anterior?: Edicion }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const c = valor.comportamiento;
  const setC = (k: keyof Comportamiento, v: unknown) => onCambiar({ ...valor, comportamiento: { ...c, [k]: v } });
  const setCampos = (campos: CampoDefinicion[]) => onCambiar({ ...valor, campos: campos.map((x, i) => ({ ...x, orden: i + 1 })) });
  const setCampo = (i: number, cambios: Partial<CampoDefinicion>) => setCampos(valor.campos.map((x, k) => (k === i ? { ...x, ...cambios } : x)));
  const codigosPublicados = new Set(anterior?.campos.map((x) => x.codigo));

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-s2 font-semibold">Comportamiento del tipo</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Campo etiqueta="Nombre" requerido><input className={claseEntrada} value={c.nombre} onChange={(e) => setC("nombre", e.target.value)} required /></Campo>
          <Campo etiqueta="Clase" requerido ayuda="Agrupa tipos para reglas de haircut, prioridad e idoneidad">
            <input className={claseEntrada} list="clases" value={c.clase} onChange={(e) => setC("clase", e.target.value.toUpperCase())} required />
            <datalist id="clases">{CLASES.map((x) => <option key={x} value={x}>{humano(x)}</option>)}</datalist>
          </Campo>
          <Campo etiqueta="Registro público">
            <select className={claseEntrada} value={c.registroPublico} onChange={(e) => setC("registroPublico", e.target.value)}>
              {REGISTROS.map((r) => <option key={r} value={r}>{r === "NINGUNO" ? "No aplica" : humano(r)}</option>)}
            </select>
          </Campo>
          <div className="md:col-span-3">
            <Campo etiqueta="Descripción"><input className={claseEntrada} value={c.descripcion ?? ""} onChange={(e) => setC("descripcion", e.target.value || null)} /></Campo>
          </div>
          <div className="flex flex-wrap gap-4 md:col-span-3">
            {([["requiereAvaluo", "Requiere avalúo"], ["requierePoliza", "Requiere póliza"], ["admiteMultiples", "Puede respaldar varias obligaciones"]] as const).map(([k, t]) => (
              <label key={k} className="flex items-center gap-2 text-a2">
                <input type="checkbox" checked={c[k]} onChange={(e) => setC(k, e.target.checked)} /> {t}
              </label>
            ))}
          </div>
          <p className="text-c text-mid-600 md:col-span-3">Los haircuts, la idoneidad y las periodicidades de valoración no se configuran aquí: son reglas versionadas del motor de reglas (M14).</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-s2 font-semibold">Campos personalizados</h3>
          <Boton type="button" variante="secundario" onClick={() => {
            setCampos([...valor.campos, { codigo: "", etiqueta: "", tipo: "TEXTO", obligatorio: false, obligatorioDesde: null, llave: false, grupo: valor.campos.at(-1)?.grupo ?? null, orden: valor.campos.length + 1, ayuda: null, minimo: null, maximo: null, patron: null, opciones: null }]);
            setAbierto(valor.campos.length);
          }}><Plus className="h-4 w-4" /> Agregar campo</Boton>
        </div>
        <ul className="divide-y divide-light-600 rounded-dg-12 border border-light-600">
          {valor.campos.map((f, i) => {
            const publicado = codigosPublicados.has(f.codigo) && anterior?.campos.find((x) => x.codigo === f.codigo)?.codigo === f.codigo;
            return (
              <li key={i}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button type="button" onClick={() => setAbierto(abierto === i ? null : i)} className="flex flex-1 items-center gap-2 text-left" aria-expanded={abierto === i}>
                    {abierto === i ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-semibold">{f.etiqueta || "Campo sin nombre"}</span>
                    <span className="font-mono text-c text-mid-600">{f.codigo}</span>
                    <span className="text-b3 text-mid-600">· {humano(f.tipo)}</span>
                    {f.obligatorio && <Insignia tono="info" sinIcono>{f.obligatorioDesde ? `Obligatorio desde ${humano(f.obligatorioDesde)}` : "Obligatorio"}</Insignia>}
                    {f.llave && <Insignia tono="marca" sinIcono>Llave</Insignia>}
                    <Marca c={cambio(f, anterior?.campos)} />
                  </button>
                  <Boton type="button" variante="fantasma" aria-label="Subir" onClick={() => setCampos(mover(valor.campos, i, -1))}><ArrowUp className="h-4 w-4" /></Boton>
                  <Boton type="button" variante="fantasma" aria-label="Bajar" onClick={() => setCampos(mover(valor.campos, i, 1))}><ArrowDown className="h-4 w-4" /></Boton>
                  <Boton type="button" variante="fantasma" aria-label="Eliminar campo" onClick={() => setCampos(valor.campos.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Boton>
                </div>
                {abierto === i && (
                  <div className="grid gap-4 border-t border-light-600 bg-canvas p-4 md:grid-cols-4">
                    <Campo etiqueta="Código" requerido ayuda={publicado ? "Publicado: no se renombra" : "camelCase, sin tildes"}>
                      <input className={`${claseEntrada} font-mono`} value={f.codigo} disabled={publicado} pattern="[a-z][A-Za-z0-9]{1,49}" required
                        onChange={(e) => setCampo(i, { codigo: e.target.value })} />
                    </Campo>
                    <Campo etiqueta="Etiqueta" requerido><input className={claseEntrada} value={f.etiqueta} onChange={(e) => setCampo(i, { etiqueta: e.target.value })} required /></Campo>
                    <Campo etiqueta="Tipo de dato">
                      <select className={claseEntrada} value={f.tipo} onChange={(e) => {
                        const tipo = e.target.value as TipoDato;
                        setCampo(i, { tipo, opciones: tipo === "LISTA" || tipo === "LISTA_MULTIPLE" ? f.opciones ?? [{ id: "OPCION_1", etiqueta: "Opción 1", activo: true }] : null });
                      }}>
                        {TIPOS_DATO.map((t) => <option key={t} value={t}>{humano(t)}</option>)}
                      </select>
                    </Campo>
                    <Campo etiqueta="Grupo"><input className={claseEntrada} value={f.grupo ?? ""} onChange={(e) => setCampo(i, { grupo: e.target.value || null })} /></Campo>
                    <Campo etiqueta="Obligatoriedad">
                      <select className={claseEntrada} value={f.obligatorio ? f.obligatorioDesde ?? "REGISTRO_INICIAL" : "NO"}
                        onChange={(e) => setCampo(i, e.target.value === "NO" ? { obligatorio: false, obligatorioDesde: null } : { obligatorio: true, obligatorioDesde: e.target.value === "REGISTRO_INICIAL" ? null : e.target.value })}>
                        <option value="NO">Opcional</option>
                        <option value="REGISTRO_INICIAL">Obligatorio desde el registro</option>
                        {MACROESTADOS.slice(1).map((m) => <option key={m} value={m}>Obligatorio desde {humano(m)}</option>)}
                      </select>
                    </Campo>
                    <label className="flex items-center gap-2 self-end pb-2 text-a2">
                      <input type="checkbox" checked={f.llave} onChange={(e) => setCampo(i, { llave: e.target.checked })} /> Llave natural (detecta duplicados)
                    </label>
                    <div className="md:col-span-2"><Campo etiqueta="Ayuda contextual"><input className={claseEntrada} value={f.ayuda ?? ""} onChange={(e) => setCampo(i, { ayuda: e.target.value || null })} /></Campo></div>
                    {(f.tipo === "NUMERO" || f.tipo === "MONEDA") && (
                      <>
                        <Campo etiqueta="Mínimo"><input type="number" className={claseEntrada} value={f.minimo ?? ""} onChange={(e) => setCampo(i, { minimo: e.target.value === "" ? null : Number(e.target.value) })} /></Campo>
                        <Campo etiqueta="Máximo"><input type="number" className={claseEntrada} value={f.maximo ?? ""} onChange={(e) => setCampo(i, { maximo: e.target.value === "" ? null : Number(e.target.value) })} /></Campo>
                      </>
                    )}
                    {(f.tipo === "TEXTO" || f.tipo === "TEXTO_LARGO") && (
                      <div className="md:col-span-2"><Campo etiqueta="Formato (expresión regular)" ayuda="Ej. ^[A-Z]{3}\d{3}$"><input className={`${claseEntrada} font-mono`} value={f.patron ?? ""} onChange={(e) => setCampo(i, { patron: e.target.value || null })} /></Campo></div>
                    )}
                    {(f.tipo === "LISTA" || f.tipo === "LISTA_MULTIPLE") && (
                      <div className="md:col-span-4">
                        <p className="mb-1 text-a3 font-medium">Opciones</p>
                        <p className="mb-2 text-c text-mid-600">El identificador es estable: una opción publicada no se elimina, se inactiva.</p>
                        <div className="space-y-2">
                          {(f.opciones ?? []).map((o, k) => {
                            const opcionPublicada = anterior?.campos.find((x) => x.codigo === f.codigo)?.opciones?.some((x) => x.id === o.id);
                            const setO = (cambios: Partial<typeof o>) => setCampo(i, { opciones: (f.opciones ?? []).map((x, j) => (j === k ? { ...x, ...cambios } : x)) });
                            return (
                              <div key={k} className="flex flex-wrap items-center gap-2">
                                <input className={`${claseEntrada} w-48 font-mono`} value={o.id} disabled={opcionPublicada} aria-label="Identificador" onChange={(e) => setO({ id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                                <input className={`${claseEntrada} flex-1`} value={o.etiqueta} aria-label="Etiqueta" onChange={(e) => setO({ etiqueta: e.target.value })} />
                                <label className="flex items-center gap-1 text-b3"><input type="checkbox" checked={o.activo} onChange={(e) => setO({ activo: e.target.checked })} /> Activa</label>
                                {!opcionPublicada && (
                                  <Boton type="button" variante="fantasma" aria-label="Quitar opción" onClick={() => setCampo(i, { opciones: (f.opciones ?? []).filter((_, j) => j !== k) })}><Trash2 className="h-4 w-4" /></Boton>
                                )}
                              </div>
                            );
                          })}
                          <Boton type="button" variante="fantasma" onClick={() => setCampo(i, { opciones: [...(f.opciones ?? []), { id: `OPCION_${(f.opciones?.length ?? 0) + 1}`, etiqueta: "", activo: true }] })}>
                            <Plus className="h-4 w-4" /> Agregar opción
                          </Boton>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {valor.campos.length === 0 && <li className="px-4 py-6 text-center text-b3 text-mid-600">El tipo aún no tiene campos personalizados.</li>}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-s2 font-semibold">Checklist jurídico (M05)</h3>
          <Boton type="button" variante="secundario" onClick={() => onCambiar({ ...valor, checklistJuridico: [...valor.checklistJuridico, { codigo: "", descripcion: "", obligatorio: true, ayuda: null }] })}>
            <Plus className="h-4 w-4" /> Agregar ítem
          </Boton>
        </div>
        <div className="space-y-2">
          {valor.checklistJuridico.map((it, i) => {
            const setI = (cambios: Partial<ItemChecklist>) => onCambiar({ ...valor, checklistJuridico: valor.checklistJuridico.map((x, k) => (k === i ? { ...x, ...cambios } : x)) });
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input className={`${claseEntrada} w-56 font-mono`} placeholder="CODIGO" aria-label="Código del ítem" value={it.codigo} onChange={(e) => setI({ codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} required />
                <input className={`${claseEntrada} min-w-64 flex-1`} placeholder="Qué verifica Jurídica" aria-label="Descripción" value={it.descripcion} onChange={(e) => setI({ descripcion: e.target.value })} required />
                <label className="flex items-center gap-1 text-b3"><input type="checkbox" checked={it.obligatorio} onChange={(e) => setI({ obligatorio: e.target.checked })} /> Obligatorio</label>
                <Boton type="button" variante="fantasma" aria-label="Quitar ítem" onClick={() => onCambiar({ ...valor, checklistJuridico: valor.checklistJuridico.filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Boton>
              </div>
            );
          })}
          {valor.checklistJuridico.length === 0 && <p className="text-b3 text-mid-600">Sin ítems.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-s2 font-semibold">Plantilla de actividades de constitución (M06)</h3>
            <p className="text-c text-mid-600">Al pasar a Constitución, cada garantía recibe este plan. Solo se perfecciona con las obligatorias completadas.</p>
          </div>
          <Boton type="button" variante="secundario" onClick={() => onCambiar({ ...valor, actividades: [...valor.actividades, { codigo: "", nombre: "", descripcion: null, orden: (valor.actividades.length + 1) * 10, obligatoria: true, requiereEvidencia: true, diasPlazo: 10, rolResponsable: "OPERACIONES_GESTOR", campos: [] }] })}>
            <Plus className="h-4 w-4" /> Agregar actividad
          </Boton>
        </div>
        <div className="space-y-3">
          {valor.actividades.map((a, i) => {
            const setA = (cambios: Partial<PlantillaActividad>) => onCambiar({ ...valor, actividades: valor.actividades.map((x, k) => (k === i ? { ...x, ...cambios } : x)) });
            return (
              <div key={i} className="rounded-dg-12 border border-light-600 p-3">
                <div className="grid gap-3 md:grid-cols-[80px_200px_1fr_110px_auto]">
                  <Campo etiqueta="Orden"><input type="number" className={claseEntrada} value={a.orden} onChange={(e) => setA({ orden: Number(e.target.value) })} /></Campo>
                  <Campo etiqueta="Código" requerido><input className={`${claseEntrada} font-mono`} value={a.codigo} onChange={(e) => setA({ codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} required /></Campo>
                  <Campo etiqueta="Actividad" requerido><input className={claseEntrada} value={a.nombre} onChange={(e) => setA({ nombre: e.target.value })} required /></Campo>
                  <Campo etiqueta="Plazo (días)"><input type="number" min={0} max={365} className={claseEntrada} value={a.diasPlazo ?? ""} onChange={(e) => setA({ diasPlazo: e.target.value === "" ? null : Number(e.target.value) })} /></Campo>
                  <Boton type="button" variante="fantasma" className="self-end" aria-label="Quitar actividad" onClick={() => onCambiar({ ...valor, actividades: valor.actividades.filter((_, k) => k !== i) })}><Trash2 className="h-4 w-4" /></Boton>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 text-b3"><input type="checkbox" checked={a.obligatoria} onChange={(e) => setA({ obligatoria: e.target.checked })} /> Obligatoria</label>
                  <label className="flex items-center gap-1.5 text-b3"><input type="checkbox" checked={a.requiereEvidencia} onChange={(e) => setA({ requiereEvidencia: e.target.checked })} /> Exige evidencia (OnBase + SHA-256)</label>
                  <label className="flex items-center gap-1.5 text-b3">Responsable
                    <select className={`${claseEntrada} w-56`} value={a.rolResponsable ?? ""} onChange={(e) => setA({ rolResponsable: e.target.value || null })}>
                      <option value="">Sin rol</option>
                      {ROLES_OPERATIVOS.map((r) => <option key={r} value={r}>{humano(r)}</option>)}
                    </select>
                  </label>
                </div>
                {valor.campos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-a3 font-medium">Datos que captura al completarse</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {valor.campos.filter((f) => f.codigo).map((f) => (
                        <label key={f.codigo} className={cn("flex items-center gap-1.5 rounded-dg-8 border px-2 py-1 text-b3", a.campos.includes(f.codigo) ? "border-primary-600 bg-primary-100" : "border-light-900")}>
                          <input type="checkbox" checked={a.campos.includes(f.codigo)} onChange={(e) => setA({ campos: e.target.checked ? [...a.campos, f.codigo] : a.campos.filter((x) => x !== f.codigo) })} />
                          {f.etiqueta}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {valor.actividades.length === 0 && <p className="text-b3 text-mid-600">Sin actividades: las garantías de este tipo no generarán plan de constitución.</p>}
        </div>
      </section>
    </div>
  );
}
