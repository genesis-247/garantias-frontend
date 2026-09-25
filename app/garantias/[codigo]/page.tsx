"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Calculator, Check, FileCheck2, Hash, Scale, TrendingUp } from "lucide-react";
import { api, enviar } from "@/lib/api";
import { cop, fecha, fechaHora, humano, porcentaje, cn } from "@/lib/formato";
import type { Alerta, CoberturaVigente, GarantiaResumen, Macroestado, RegistroAuditoria } from "@/lib/tipos";
import type { TipoGarantia } from "@/lib/consultas";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { CuerpoTarjeta, Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Campo, claseEntrada, Dato, Esqueleto, MensajeError, PanelLateral, Pestanas, Vacio } from "@/components/ui/varios";
import { Insignia, InsigniaCriticidad, InsigniaEstado, InsigniaIdoneidad } from "@/components/ui/insignia";
import { Tabla, Td, Th } from "@/components/ui/tabla";
import { ExplicacionCobertura } from "@/components/explicacion-cobertura";
import { LineaAuditoria } from "@/components/linea-auditoria";

interface Expediente {
  garantia: GarantiaResumen & { atributos: Record<string, unknown>; gravamenesPrevios: number; condicionamientosAbiertos: number; fechaConstitucion: string | null; fechaPerfeccionamiento: string | null; idoneidadRegla: string | null };
  tipo: TipoGarantia["tipo"];
  tipoVersion: number;
  campos: TipoGarantia["campos"];
  siguientesEstados: Macroestado[];
  participantes: { id: string; rol: string; tipoDocumento: string; numeroDocumento: string; nombre: string; porcentaje: number | null }[];
  obligaciones: {
    vinculo: { tipo: string; tope: number | null; valorPactado: number | null; prioridad: number };
    obligacion: { numero: string; producto: string; estado: string; diasMora: number; destino: string | null; fechaDesembolso: string | null };
    exposicion: number;
    cobertura: CoberturaVigente | null;
    otrasGarantias: string[];
  }[];
  valoraciones: { id: string; tipo: string; fecha: string; valorComercial: number; valorTecnico: number | null; perito: string | null; raa: string | null; metodologia: string | null; motivo: string | null; registradoPor: string; createdAt: string }[];
  calculos: { id: string; fechaCorte: string; estado: string; disparador: string; hashResultado: string }[];
  alertas: Alerta[];
  auditoria: RegistroAuditoria[];
  eventos: { id: string; tipo: string; estado: string; correlation_id: string; creado_en: string; publicado_en: string | null }[];
}

const CICLO: Macroestado[] = ["REGISTRO", "ESTUDIO_JURIDICO", "CONSTITUCION", "PERFECCIONAMIENTO", "ACTIVA", "MONITOREO", "LIBERACION", "CIERRE"];

type Pestana = "resumen" | "obligaciones" | "valoraciones" | "juridico" | "alertas" | "eventos" | "auditoria";
type Accion = null | "transicion" | "valoracion" | "juridico" | "perfeccionamiento" | { cobertura: string };

export default function Expediente360() {
  const { codigo } = useParams<{ codigo: string }>();
  const { perfil } = useSesion();
  const cliente = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [accion, setAccion] = useState<Accion>(null);
  const { data: e, isLoading, error } = useQuery({ queryKey: ["expediente", codigo], queryFn: () => api<Expediente>(`/garantias/${codigo}`) });

  const refrescar = () => {
    cliente.invalidateQueries();
    setAccion(null);
  };

  if (isLoading) return <Esqueleto className="h-[600px]" />;
  if (error || !e) return <MensajeError error={error} />;
  const g = e.garantia;
  const indiceCiclo = CICLO.indexOf(g.macroestado);

  return (
    <>
      <EncabezadoPagina
        antetitulo={`Expediente 360 · ${e.tipo.nombre} · versión de tipo ${e.tipoVersion}`}
        titulo={<span className="flex flex-wrap items-center gap-3">{g.codigo} <InsigniaEstado valor={g.macroestado} /> <InsigniaIdoneidad valor={g.idoneidad} /></span>}
        descripcion={`${g.clienteNombre} · ${g.clienteDocumento} · ${humano(g.producto)} · ${humano(g.segmento)}`}
        acciones={
          <>
            {tieneRol(perfil, "JURIDICA_GESTOR", "JURIDICA_DIRECTOR") && ["REGISTRO", "ESTUDIO_JURIDICO"].includes(g.macroestado) && (
              <Boton variante="secundario" onClick={() => setAccion("juridico")}><Scale className="h-4 w-4" /> Estudio jurídico</Boton>
            )}
            {tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR") && ["CONSTITUCION", "PERFECCIONAMIENTO"].includes(g.macroestado) && !g.perfeccionada && (
              <Boton variante="secundario" onClick={() => setAccion("perfeccionamiento")}><FileCheck2 className="h-4 w-4" /> Perfeccionar</Boton>
            )}
            {tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR", "JURIDICA_DIRECTOR") && e.tipo.clase !== "FONDO_GARANTIAS" && (
              <Boton variante="secundario" onClick={() => setAccion("valoracion")}><TrendingUp className="h-4 w-4" /> Registrar valoración</Boton>
            )}
            {tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR", "JURIDICA_GESTOR", "JURIDICA_DIRECTOR") && e.siguientesEstados.length > 0 && (
              <Boton onClick={() => setAccion("transicion")}><ArrowRightLeft className="h-4 w-4" /> Cambiar estado</Boton>
            )}
          </>
        }
      />

      <Tarjeta className="mb-6">
        <CuerpoTarjeta>
          <ol className="flex flex-wrap items-center gap-y-3" aria-label="Ciclo de vida">
            {CICLO.map((m, k) => {
              const hecho = indiceCiclo > k || g.macroestado === "CIERRE";
              const actual = m === g.macroestado;
              return (
                <li key={m} className="flex items-center">
                  <span className={cn("flex items-center gap-2 rounded-dg-full px-3 py-1 text-b3 font-semibold", actual ? "bg-primary-600 text-white" : hecho ? "bg-success-100 text-success-900" : "bg-light-400 text-mid-600")}>
                    {hecho && !actual ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
                    {humano(m)}
                  </span>
                  {k < CICLO.length - 1 && <span className="mx-1 h-px w-4 bg-light-900" aria-hidden />}
                </li>
              );
            })}
            {g.macroestado === "EJECUCION" && <li className="ml-3"><Insignia tono="error">En ejecución</Insignia></li>}
          </ol>
        </CuerpoTarjeta>
      </Tarjeta>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          ["Valor comercial", cop(g.valorComercial)],
          ["Valor admisible", cop(g.valorAdmisible)],
          ["Valor neto", cop(g.valorNeto)],
          ["Última valoración", fecha(g.fechaUltimaValoracion)],
          ["Próxima valoración", fecha(g.fechaProximaValoracion)],
        ].map(([t, v]) => (
          <Tarjeta key={t} className="p-4">
            <p className="text-a3 text-mid-600">{t}</p>
            <p className="mt-1 text-s1 font-bold tabular-nums">{v}</p>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <div className="px-5 pt-2">
          <Pestanas<Pestana>
            activa={pestana}
            onCambiar={setPestana}
            opciones={[
              { id: "resumen", etiqueta: "Resumen" },
              { id: "obligaciones", etiqueta: "Obligaciones y cobertura", conteo: e.obligaciones.length },
              { id: "valoraciones", etiqueta: "Valoraciones", conteo: e.valoraciones.length },
              { id: "juridico", etiqueta: "Jurídico y registro" },
              { id: "alertas", etiqueta: "Alertas", conteo: e.alertas.length },
              { id: "eventos", etiqueta: "Eventos y cálculos", conteo: e.eventos.length },
              { id: "auditoria", etiqueta: "Auditoría", conteo: e.auditoria.length },
            ]}
          />
        </div>
        <CuerpoTarjeta>
          {pestana === "resumen" && (
            <div className="grid gap-8 lg:grid-cols-3">
              <dl className="grid grid-cols-2 gap-4 lg:col-span-2">
                <Dato etiqueta="Tipo de garantía">{e.tipo.nombre}</Dato>
                <Dato etiqueta="Clase">{humano(e.tipo.clase)}</Dato>
                <Dato etiqueta="Idoneidad">
                  <InsigniaIdoneidad valor={g.idoneidad} />
                  <p className="mt-1 text-b3 text-mid-600">{g.idoneidadMotivo} {g.idoneidadRegla && `(regla ${g.idoneidadRegla})`}</p>
                </Dato>
                <Dato etiqueta="Estado jurídico">{humano(g.estadoJuridico)}{g.condicionamientosAbiertos > 0 && ` · ${g.condicionamientosAbiertos} condicionamientos abiertos`}</Dato>
                <Dato etiqueta="Estado documental">{humano(g.estadoDocumental)}</Dato>
                <Dato etiqueta="Gravámenes de mayor prelación">{cop(g.gravamenesPrevios)}</Dato>
                <Dato etiqueta="Fuente de información">{humano(g.fuente)} · {g.aplicativoOrigen}</Dato>
                <Dato etiqueta="Referencia externa">{g.referenciaExterna ?? "—"}</Dato>
                <Dato etiqueta="Creada">{fechaHora(g.createdAt)}</Dato>
                <Dato etiqueta="Actualizada">{fechaHora(g.updatedAt)}</Dato>
              </dl>
              <div>
                <h3 className="mb-2 text-s2 font-semibold">Participantes</h3>
                <ul className="space-y-2">
                  {e.participantes.map((p) => (
                    <li key={p.id} className="rounded-dg-8 border border-light-600 p-3 text-b2">
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="text-b3 text-mid-600">{humano(p.rol)} · {p.tipoDocumento} {p.numeroDocumento}{p.porcentaje !== null && ` · ${p.porcentaje} %`}</p>
                    </li>
                  ))}
                  {e.participantes.length === 0 && <p className="text-b3 text-mid-600">Sin participantes registrados.</p>}
                </ul>
              </div>
              <div className="lg:col-span-3">
                <h3 className="mb-3 text-s2 font-semibold">Datos del tipo de garantía</h3>
                <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[...e.campos].sort((a, b) => a.orden - b.orden).map((c) => {
                    const v = g.atributos?.[c.codigo];
                    const texto = v === undefined || v === null || v === "" ? "—" : typeof v === "boolean" ? (v ? "Sí" : "No") : c.opciones ? c.opciones.find((o) => o.id === v)?.etiqueta ?? String(v) : c.tipo === "MONEDA" ? cop(v as number) : String(v);
                    return (
                      <Dato key={c.codigo} etiqueta={c.etiqueta}>
                        <span className={cn(texto === "—" && c.obligatorio && "font-semibold text-warning-text")}>{texto}</span>
                        {texto === "—" && c.obligatorio && <span className="block text-c text-warning-text">Obligatorio {c.obligatorioDesde ? `desde ${humano(c.obligatorioDesde)}` : ""}</span>}
                      </Dato>
                    );
                  })}
                </dl>
              </div>
            </div>
          )}

          {pestana === "obligaciones" && (
            <div className="space-y-4">
              {e.obligaciones.length === 0 && <Vacio titulo="La garantía no respalda obligaciones" />}
              {e.obligaciones.map((o) => (
                <div key={o.obligacion.numero} className="rounded-dg-12 border border-light-600 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-s2 font-semibold">{o.obligacion.numero}</p>
                      <p className="text-b3 text-mid-600">
                        {humano(o.obligacion.producto)} · Vínculo {humano(o.vinculo.tipo)} · Prioridad {o.vinculo.prioridad}
                        {o.vinculo.tope !== null && ` · Tope ${cop(o.vinculo.tope)}`}
                        {o.obligacion.destino && ` · Destino ${humano(o.obligacion.destino)}`}
                      </p>
                      {o.otrasGarantias.length > 0 && (
                        <p className="mt-1 text-b3 text-mid-600">
                          También respaldada por:{" "}
                          {o.otrasGarantias.map((x) => <Link key={x} href={`/garantias/${x}`} className="mr-2 font-semibold text-link underline">{x}</Link>)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <InsigniaEstado valor={o.obligacion.estado} />
                      {o.obligacion.diasMora > 0 && <Insignia tono="error">{o.obligacion.diasMora} días de mora</Insignia>}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <Dato etiqueta="Exposición">{cop(o.exposicion)}</Dato>
                    <Dato etiqueta="Objetivo">{o.cobertura ? porcentaje(o.cobertura.coberturaObjetivo, 0) : "—"}</Dato>
                    <Dato etiqueta="Asignado">{o.cobertura ? cop(o.cobertura.asignado) : "—"}</Dato>
                    <Dato etiqueta="Cobertura real">
                      <span className={cn("font-bold", o.cobertura && o.cobertura.brecha > 0 ? "text-error-900" : "text-success-900")}>
                        {o.cobertura?.ratio === null || !o.cobertura ? "—" : porcentaje(o.cobertura.ratio)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Brecha">{o.cobertura ? cop(o.cobertura.brecha) : "—"}</Dato>
                  </div>
                  <Boton variante="fantasma" className="mt-3 px-0" onClick={() => setAccion({ cobertura: o.obligacion.numero })}>
                    <Calculator className="h-4 w-4" /> Explicar el cálculo
                  </Boton>
                </div>
              ))}
            </div>
          )}

          {pestana === "valoraciones" && (
            e.valoraciones.length === 0 ? <Vacio titulo="Sin valoraciones" detalle={e.tipo.clase === "FONDO_GARANTIAS" ? "El valor de esta garantía es el porcentaje certificado por el fondo sobre el saldo." : undefined} /> : (
              <Tabla>
                <thead>
                  <tr><Th>Fecha</Th><Th>Tipo</Th><Th numerica>Valor comercial</Th><Th numerica>Valor técnico</Th><Th>Perito / RAA</Th><Th>Metodología</Th><Th>Registró</Th></tr>
                </thead>
                <tbody>
                  {e.valoraciones.map((v, k) => (
                    <tr key={v.id} className={k === 0 ? "font-semibold" : ""}>
                      <Td>{fecha(v.fecha)} {k === 0 && <Insignia tono="exito" sinIcono>Vigente</Insignia>}</Td>
                      <Td>{humano(v.tipo)}</Td>
                      <Td numerica>{cop(v.valorComercial)}</Td>
                      <Td numerica>{cop(v.valorTecnico)}</Td>
                      <Td className="text-b3">{v.perito ?? "—"}{v.raa && ` · ${v.raa}`}</Td>
                      <Td className="text-b3">{v.metodologia ?? "—"}</Td>
                      <Td className="text-b3">{v.registradoPor}<br />{fechaHora(v.createdAt)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )
          )}

          {pestana === "juridico" && (
            <dl className="grid grid-cols-2 gap-5 md:grid-cols-4">
              <Dato etiqueta="Estado jurídico">{humano(g.estadoJuridico)}</Dato>
              <Dato etiqueta="Condicionamientos abiertos">{g.condicionamientosAbiertos}</Dato>
              <Dato etiqueta="Fecha de constitución">{fecha(g.fechaConstitucion)}</Dato>
              <Dato etiqueta="Fecha de perfeccionamiento">{fecha(g.fechaPerfeccionamiento)}</Dato>
              <Dato etiqueta="Perfeccionada">{g.perfeccionada ? "Sí" : "No"}</Dato>
              <Dato etiqueta="Registro público">{e.tipo.registroPublico === "NINGUNO" ? "No aplica" : e.tipo.registroPublico}</Dato>
              <Dato etiqueta="Requiere póliza">{e.tipo.requierePoliza ? "Sí" : "No"}</Dato>
              <Dato etiqueta="Requiere avalúo">{e.tipo.requiereAvaluo ? "Sí" : "No"}</Dato>
              <p className="col-span-full rounded-dg-8 bg-info-100 p-3 text-b3 text-info-900">
                El checklist jurídico, los hallazgos y la plantilla de actividades de constitución configurables por tipo llegan en el incremento 2 (M05 y M06 completos, integrados con Appian y OnBase).
              </p>
            </dl>
          )}

          {pestana === "alertas" && (
            e.alertas.length === 0 ? <Vacio titulo="Sin alertas" detalle="La garantía no tiene alertas abiertas." /> : (
              <ul className="space-y-2">
                {e.alertas.map((a, k) => (
                  <li key={k} className="flex items-start gap-3 rounded-dg-8 border border-light-600 p-3">
                    <InsigniaCriticidad valor={a.criticidad} />
                    <div className="text-b2">
                      <p className="font-semibold">{a.titulo}</p>
                      <p className="text-b3 text-mid-600">{a.detalle} · {a.origen}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}

          {pestana === "eventos" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h3 className="mb-2 text-s2 font-semibold">Eventos publicados</h3>
                <ul className="space-y-1.5 text-b3">
                  {e.eventos.map((ev) => (
                    <li key={ev.id} className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums text-mid-600">{fechaHora(ev.creado_en)}</span>
                      <span className="font-semibold">{ev.tipo}</span>
                      <Insignia tono={ev.estado === "PUBLICADO" ? "exito" : ev.estado === "ERROR" ? "error" : "advertencia"} sinIcono>{humano(ev.estado)}</Insignia>
                      <Link href={`/core-transaccional?texto=${ev.correlation_id}`} className="font-mono text-link underline">{ev.correlation_id?.slice(0, 8)}</Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 text-s2 font-semibold">Cálculos de cobertura que la incluyen</h3>
                <ul className="space-y-1.5 text-b3">
                  {e.calculos.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums text-mid-600">{fechaHora(c.fechaCorte)}</span>
                      <span>{humano(c.disparador)}</span>
                      <Insignia tono={c.estado === "COMPLETO" ? "exito" : "advertencia"} sinIcono>{humano(c.estado)}</Insignia>
                      <span className="inline-flex items-center gap-1 font-mono text-mid-600"><Hash className="h-3 w-3" />{c.hashResultado.slice(0, 12)}…</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {pestana === "auditoria" && <LineaAuditoria registros={e.auditoria} />}
        </CuerpoTarjeta>
      </Tarjeta>

      <PanelLateral abierto={typeof accion === "object" && accion !== null} onCerrar={() => setAccion(null)} titulo={typeof accion === "object" && accion ? `Cobertura de ${accion.cobertura}` : ""} subtitulo="Cálculo explicable y reproducible (anexo A)" ancho="max-w-4xl">
        {typeof accion === "object" && accion && <ExplicacionCobertura numero={accion.cobertura} />}
      </PanelLateral>
      <PanelTransicion abierto={accion === "transicion"} e={e} onCerrar={() => setAccion(null)} onListo={refrescar} />
      <PanelValoracion abierto={accion === "valoracion"} codigo={g.codigo} valorActual={g.valorComercial} onCerrar={() => setAccion(null)} onListo={refrescar} />
      <PanelJuridico abierto={accion === "juridico"} codigo={g.codigo} onCerrar={() => setAccion(null)} onListo={refrescar} />
      <PanelPerfeccionamiento abierto={accion === "perfeccionamiento"} e={e} onCerrar={() => setAccion(null)} onListo={refrescar} />
    </>
  );
}

function PanelTransicion({ abierto, e, onCerrar, onListo }: { abierto: boolean; e: Expediente; onCerrar: () => void; onListo: () => void }) {
  const [destino, setDestino] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [excepcional, setExcepcional] = useState(false);
  const m = useMutation({
    mutationFn: () => enviar(`/garantias/${e.garantia.codigo}/transiciones`, "POST", { destino, motivo: motivo || null, autorizacionExcepcional: excepcional }),
    onSuccess: onListo,
  });
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo="Cambiar estado" subtitulo={`Estado actual: ${humano(e.garantia.macroestado)}. Garantías 360 valida la transición y la registra en la auditoría.`} ancho="max-w-lg">
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Nuevo estado" requerido>
          <select className={claseEntrada} value={destino} onChange={(ev) => setDestino(ev.target.value)} required>
            <option value="">Selecciona…</option>
            {e.siguientesEstados.map((s) => <option key={s} value={s}>{humano(s)}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Motivo" ayuda="Obligatorio para anular, cerrar, ejecutar o autorizar una excepción.">
          <textarea className={`${claseEntrada} h-24 py-2`} value={motivo} onChange={(ev) => setMotivo(ev.target.value)} />
        </Campo>
        {destino === "LIBERACION" && (
          <label className="flex items-start gap-2 rounded-dg-8 border border-warning-600 bg-warning-100 p-3 text-b3 text-warning-text">
            <input type="checkbox" checked={excepcional} onChange={(ev) => setExcepcional(ev.target.checked)} className="mt-0.5" />
            Autorización excepcional: liberar aunque existan obligaciones activas (solo Director de Operaciones, con motivo; RF-1202).
          </label>
        )}
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending} disabled={!destino}>Confirmar cambio</Boton>
      </form>
    </PanelLateral>
  );
}

function PanelValoracion({ abierto, codigo, valorActual, onCerrar, onListo }: { abierto: boolean; codigo: string; valorActual: number | null; onCerrar: () => void; onListo: () => void }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ tipo: "AVALUO_COMERCIAL", fecha: hoy, valorComercial: "", valorTecnico: "", perito: "", raa: "", metodologia: "", motivo: "" });
  const m = useMutation({
    mutationFn: () => enviar(`/garantias/${codigo}/valoraciones`, "POST", {
      ...f, valorComercial: Number(f.valorComercial), valorTecnico: f.valorTecnico ? Number(f.valorTecnico) : null,
      perito: f.perito || null, raa: f.raa || null, metodologia: f.metodologia || null, motivo: f.motivo || null,
    }),
    onSuccess: onListo,
  });
  const variacion = valorActual && f.valorComercial ? (Number(f.valorComercial) - Number(valorActual)) / Number(valorActual) : null;
  const set = (k: keyof typeof f) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: ev.target.value }));
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo="Registrar valoración" subtitulo="El histórico es inmutable: una corrección es una valoración nueva con motivo." ancho="max-w-lg">
      <form className="grid grid-cols-2 gap-4" onSubmit={(ev) => { ev.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Tipo" requerido>
          <select className={claseEntrada} value={f.tipo} onChange={set("tipo")}>
            {["AVALUO_COMERCIAL", "AVALUO_CATASTRAL", "GUIA_FASECOLDA", "INDICE", "SALDO_CERTIFICADO", "VALOR_CONTRATO"].map((t) => <option key={t} value={t}>{humano(t)}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Fecha" requerido><input type="date" max={hoy} className={claseEntrada} value={f.fecha} onChange={set("fecha")} required /></Campo>
        <Campo etiqueta="Valor comercial (COP)" requerido><input type="number" min="0" className={claseEntrada} value={f.valorComercial} onChange={set("valorComercial")} required /></Campo>
        <Campo etiqueta="Valor técnico (COP)"><input type="number" min="0" className={claseEntrada} value={f.valorTecnico} onChange={set("valorTecnico")} /></Campo>
        <Campo etiqueta="Perito o proveedor"><input className={claseEntrada} value={f.perito} onChange={set("perito")} /></Campo>
        <Campo etiqueta="RAA del avaluador"><input className={claseEntrada} value={f.raa} onChange={set("raa")} /></Campo>
        <div className="col-span-2"><Campo etiqueta="Metodología"><input className={claseEntrada} value={f.metodologia} onChange={set("metodologia")} /></Campo></div>
        <div className="col-span-2"><Campo etiqueta="Motivo" ayuda="Obligatorio si el valor cambia más de 10 %."><input className={claseEntrada} value={f.motivo} onChange={set("motivo")} /></Campo></div>
        {variacion !== null && Math.abs(variacion) > 0.1 && (
          <p className="col-span-2 rounded-dg-8 border border-warning-600 bg-warning-100 p-3 text-b3 text-warning-text">
            El valor cambia {porcentaje(variacion, 1)}: supera el umbral de 10 % y debe registrarlo un Director de Operaciones (RF-0709).
          </p>
        )}
        <div className="col-span-2"><MensajeError error={m.error} /></div>
        <div className="col-span-2"><Boton type="submit" cargando={m.isPending}>Registrar y recalcular cobertura</Boton></div>
      </form>
    </PanelLateral>
  );
}

function PanelJuridico({ abierto, codigo, onCerrar, onListo }: { abierto: boolean; codigo: string; onCerrar: () => void; onListo: () => void }) {
  const [estado, setEstado] = useState("EN_ESTUDIO");
  const [condicionamientos, setCondicionamientos] = useState(0);
  const [concepto, setConcepto] = useState("");
  const m = useMutation({
    mutationFn: () => enviar(`/garantias/${codigo}/estudio-juridico`, "PUT", { estado, condicionamientosAbiertos: condicionamientos, concepto }),
    onSuccess: onListo,
  });
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo="Estudio jurídico" subtitulo="El concepto final (aprobada, condicionada o rechazada) lo emite un Director de Jurídica (RF-0505)." ancho="max-w-lg">
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Resultado" requerido>
          <select className={claseEntrada} value={estado} onChange={(ev) => setEstado(ev.target.value)}>
            {["PENDIENTE", "EN_ESTUDIO", "CON_OBSERVACIONES", "APROBADA", "CONDICIONADA", "RECHAZADA"].map((s) => <option key={s} value={s}>{humano(s)}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Condicionamientos abiertos"><input type="number" min={0} className={claseEntrada} value={condicionamientos} onChange={(ev) => setCondicionamientos(Number(ev.target.value))} /></Campo>
        <Campo etiqueta="Concepto jurídico"><textarea className={`${claseEntrada} h-28 py-2`} value={concepto} onChange={(ev) => setConcepto(ev.target.value)} /></Campo>
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending}>Registrar concepto</Boton>
      </form>
    </PanelLateral>
  );
}

function PanelPerfeccionamiento({ abierto, e, onCerrar, onListo }: { abierto: boolean; e: Expediente; onCerrar: () => void; onListo: () => void }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const pendientes = e.campos.filter((c) => c.obligatorioDesde && ["CONSTITUCION", "PERFECCIONAMIENTO"].includes(c.obligatorioDesde) && !e.garantia.atributos?.[c.codigo]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [fechas, setFechas] = useState({ fechaConstitucion: hoy, fechaPerfeccionamiento: hoy });
  const m = useMutation({
    mutationFn: () => enviar(`/garantias/${e.garantia.codigo}/perfeccionamiento`, "PUT", { ...fechas, datosRegistro: valores }),
    onSuccess: onListo,
  });
  return (
    <PanelLateral abierto={abierto} onCerrar={onCerrar} titulo="Constitución y perfeccionamiento" subtitulo="Datos del registro público que hacen oponible la garantía." ancho="max-w-lg">
      <form className="space-y-4" onSubmit={(ev) => { ev.preventDefault(); m.mutate(); }}>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Fecha de constitución" requerido><input type="date" className={claseEntrada} value={fechas.fechaConstitucion} onChange={(ev) => setFechas((x) => ({ ...x, fechaConstitucion: ev.target.value }))} /></Campo>
          <Campo etiqueta="Fecha de perfeccionamiento" requerido><input type="date" className={claseEntrada} value={fechas.fechaPerfeccionamiento} onChange={(ev) => setFechas((x) => ({ ...x, fechaPerfeccionamiento: ev.target.value }))} /></Campo>
        </div>
        {pendientes.map((c) => (
          <Campo key={c.codigo} etiqueta={c.etiqueta} requerido ayuda={c.ayuda ?? undefined}>
            <input className={claseEntrada} value={valores[c.codigo] ?? ""} onChange={(ev) => setValores((v) => ({ ...v, [c.codigo]: ev.target.value }))} required />
          </Campo>
        ))}
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending}>Registrar perfeccionamiento</Boton>
      </form>
    </PanelLateral>
  );
}
