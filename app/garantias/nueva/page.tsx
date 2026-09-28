"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useTipos, type CampoDefinicion } from "@/lib/consultas";
import { humano, hoyLocal } from "@/lib/formato";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Campo, claseEntrada, Esqueleto, MensajeError, Vacio } from "@/components/ui/varios";
import { aJson, CampoDinamico, type ValorCampo } from "@/components/campo-dinamico";

const PRODUCTOS = ["HIPOTECARIO_VIVIENDA", "VEHICULO", "LIBRANZA", "TARJETA_CREDITO", "CAPITAL_TRABAJO", "LIBRE_INVERSION", "LEASING", "CONSTRUCTOR"];
const SEGMENTOS = ["PERSONAS", "BANCA_EMPRESAS", "PYME", "GOBIERNO"];
const DOCUMENTOS = ["CC", "CE", "NIT", "PAS", "TI", "PEP"];
const ROLES = ["PROPIETARIO", "CONSTITUYENTE", "GARANTE", "DEUDOR", "BENEFICIARIO"];
const VALORACIONES = ["AVALUO_COMERCIAL", "AVALUO_CATASTRAL", "GUIA_FASECOLDA", "INDICE", "SALDO_CERTIFICADO", "VALOR_CONTRATO"];

interface Participante { rol: string; tipoDocumento: string; numeroDocumento: string; nombre: string; porcentaje: string }

const nuevaClave = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`);

export default function NuevaGarantia() {
  const router = useRouter();
  const { perfil } = useSesion();
  const { data: tipos, isLoading } = useTipos();
  const hoy = hoyLocal();
  const [clave] = useState(nuevaClave);
  const [tipo, setTipo] = useState("");
  const [f, setF] = useState({
    referencia: `MAN-${hoy.replace(/-/g, "")}-${clave.slice(0, 6).toUpperCase()}`,
    tipoDocumento: "CC", numeroDocumento: "", nombre: "", producto: "", segmento: "PERSONAS", moneda: "COP", gravamenesPrevios: "",
    numeroObligacion: "", tipoVinculo: "CERRADA", prioridad: "", destino: "",
    valorComercial: "", fechaValoracion: hoy, tipoValoracion: "AVALUO_COMERCIAL", perito: "",
  });
  const [valores, setValores] = useState<Record<string, ValorCampo>>({});
  const [otros, setOtros] = useState<Participante[]>([]);
  const definicion = tipos?.find((t) => t.tipo.codigo === tipo);

  const grupos = useMemo(() => {
    const m = new Map<string, CampoDefinicion[]>();
    [...(definicion?.campos ?? [])].sort((a, b) => a.orden - b.orden).forEach((c) => {
      const g = c.grupo ?? "Datos del tipo";
      m.set(g, [...(m.get(g) ?? []), c]);
    });
    return [...m.entries()];
  }, [definicion]);

  const registrar = useMutation({
    mutationFn: () => {
      const atributos = Object.fromEntries((definicion?.campos ?? []).map((c) => [c.codigo, aJson(c, valores[c.codigo])]).filter(([, v]) => v !== null));
      const cliente = { tipoDocumento: f.tipoDocumento, numeroDocumento: f.numeroDocumento.trim(), nombre: f.nombre.trim() };
      return api<{ codigo: string }>("/garantias/captura-manual", {
        method: "POST",
        idempotencia: clave,
        body: JSON.stringify({
          tipo,
          origen: { aplicativo: "G360_MANUAL", referencia: f.referencia.trim() },
          cliente,
          producto: f.producto,
          segmento: f.segmento,
          moneda: f.moneda,
          gravamenesPrevios: f.gravamenesPrevios ? Number(f.gravamenesPrevios) : null,
          atributos,
          participantes: [
            { rol: "PROPIETARIO", ...cliente, porcentaje: otros.some((o) => o.rol === "PROPIETARIO") ? null : 100 },
            ...otros.map((o) => ({ ...o, porcentaje: o.porcentaje ? Number(o.porcentaje) : null })),
          ],
          obligaciones: f.numeroObligacion.trim()
            ? [{ numeroObligacion: f.numeroObligacion.trim(), tipo: f.tipoVinculo, prioridad: f.prioridad ? Number(f.prioridad) : null, producto: f.producto, segmento: f.segmento, destino: f.destino || null }]
            : [],
          valoracionInicial: f.valorComercial
            ? { tipo: f.tipoValoracion, fecha: f.fechaValoracion, valorComercial: Number(f.valorComercial), moneda: f.moneda, perito: f.perito || null, motivo: "Valoración inicial (captura manual)" }
            : null,
        }),
      });
    },
    onSuccess: (g) => router.push(`/garantias/${g.codigo}`),
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  if (!tieneRol(perfil, "OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR")) {
    return (
      <>
        <EncabezadoPagina titulo="Registrar garantía" />
        <Tarjeta><Vacio titulo="Tu perfil no registra garantías" detalle="La captura manual la hace un Gestor o Director de Operaciones. Cambia de usuario en el encabezado." /></Tarjeta>
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina
        antetitulo="Garantías · captura manual"
        titulo="Registrar garantía"
        descripcion="Para casos excepcionales (RF-1704). El canal principal es la API de los aplicativos de producto. El formulario se genera desde la versión publicada del tipo y aplica las mismas validaciones: campos, llave natural y duplicados."
        acciones={<Link href="/garantias" className="text-a2 font-semibold text-link underline">Volver al listado</Link>}
      />
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); registrar.mutate(); }}>
        <Tarjeta>
          <EncabezadoTarjeta titulo="1. Tipo de garantía" subtitulo="Solo tipos activos con versión publicada" />
          <CuerpoTarjeta className="grid gap-4 md:grid-cols-3">
            {isLoading ? <Esqueleto className="h-10" /> : (
              <Campo etiqueta="Tipo" requerido>
                <select className={claseEntrada} value={tipo} onChange={(e) => { setTipo(e.target.value); setValores({}); }} required>
                  <option value="">Selecciona…</option>
                  {tipos?.map((t) => <option key={t.tipo.codigo} value={t.tipo.codigo}>{t.tipo.nombre}</option>)}
                </select>
              </Campo>
            )}
            {definicion && (
              <div className="flex flex-wrap items-end gap-2 md:col-span-2">
                <Insignia tono="marca">Versión {definicion.version.numero}</Insignia>
                <Insignia tono="neutro">Clase {humano(definicion.tipo.clase)}</Insignia>
                <Insignia tono="neutro">Registro {definicion.tipo.registroPublico === "NINGUNO" ? "no aplica" : definicion.tipo.registroPublico}</Insignia>
                {definicion.tipo.requiereAvaluo && <Insignia tono="info">Requiere avalúo</Insignia>}
                {definicion.tipo.requierePoliza && <Insignia tono="info">Requiere póliza</Insignia>}
              </div>
            )}
          </CuerpoTarjeta>
        </Tarjeta>

        {definicion && (
          <>
            <Tarjeta>
              <EncabezadoTarjeta titulo="2. Cliente y solicitud" />
              <CuerpoTarjeta className="grid gap-4 md:grid-cols-3">
                <Campo etiqueta="Tipo de documento" requerido>
                  <select className={claseEntrada} value={f.tipoDocumento} onChange={set("tipoDocumento")}>{DOCUMENTOS.map((d) => <option key={d}>{d}</option>)}</select>
                </Campo>
                <Campo etiqueta="Número de documento" requerido><input className={claseEntrada} value={f.numeroDocumento} onChange={set("numeroDocumento")} pattern="[0-9A-Za-z\-]{3,20}" required /></Campo>
                <Campo etiqueta="Nombre o razón social" requerido><input className={claseEntrada} value={f.nombre} onChange={set("nombre")} required /></Campo>
                <Campo etiqueta="Producto" requerido>
                  <input className={claseEntrada} list="productos" value={f.producto} onChange={(e) => setF((x) => ({ ...x, producto: e.target.value.toUpperCase() }))} pattern="[A-Z][A-Z0-9_]{1,49}" required />
                  <datalist id="productos">{PRODUCTOS.map((p) => <option key={p} value={p}>{humano(p)}</option>)}</datalist>
                </Campo>
                <Campo etiqueta="Segmento" requerido>
                  <select className={claseEntrada} value={f.segmento} onChange={set("segmento")}>{SEGMENTOS.map((s) => <option key={s} value={s}>{humano(s)}</option>)}</select>
                </Campo>
                <Campo etiqueta="Referencia de la solicitud" requerido ayuda="Única. Evita registrar dos veces la misma solicitud.">
                  <input className={claseEntrada} value={f.referencia} onChange={set("referencia")} required />
                </Campo>
                <Campo etiqueta="Moneda">
                  <select className={claseEntrada} value={f.moneda} onChange={set("moneda")}>{["COP", "USD", "EUR"].map((m) => <option key={m}>{m}</option>)}</select>
                </Campo>
                <Campo etiqueta="Gravámenes de mayor prelación" ayuda="Valor comprometido con otros acreedores (se descuenta del valor neto)">
                  <input type="number" min="0" className={claseEntrada} value={f.gravamenesPrevios} onChange={set("gravamenesPrevios")} />
                </Campo>
              </CuerpoTarjeta>
            </Tarjeta>

            {grupos.map(([grupo, campos], k) => (
              <Tarjeta key={grupo}>
                <EncabezadoTarjeta titulo={`${3 + k}. ${grupo}`} subtitulo={k === 0 ? "Campos configurados en el tipo (M16). Los marcados como obligatorios desde un estado posterior se completan en la constitución." : undefined} />
                <CuerpoTarjeta className="grid gap-4 md:grid-cols-3">
                  {campos.map((c) => (
                    <CampoDinamico key={c.codigo} campo={c} valor={valores[c.codigo]} onCambiar={(v) => setValores((x) => ({ ...x, [c.codigo]: v }))} />
                  ))}
                </CuerpoTarjeta>
              </Tarjeta>
            ))}

            <Tarjeta>
              <EncabezadoTarjeta titulo="Obligación que respalda" subtitulo="Opcional. Si la obligación aún no existe en Garantías 360, se crea como aprobada y Flexcube la actualiza al desembolsar." />
              <CuerpoTarjeta className="grid gap-4 md:grid-cols-4">
                <Campo etiqueta="Número de obligación"><input className={claseEntrada} value={f.numeroObligacion} onChange={set("numeroObligacion")} /></Campo>
                <Campo etiqueta="Tipo de vínculo">
                  <select className={claseEntrada} value={f.tipoVinculo} onChange={set("tipoVinculo")}><option value="CERRADA">Cerrada (específica)</option><option value="ABIERTA">Abierta</option></select>
                </Campo>
                <Campo etiqueta="Prioridad"><input type="number" min="0" className={claseEntrada} value={f.prioridad} onChange={set("prioridad")} placeholder="100" /></Campo>
                <Campo etiqueta="Destino del crédito"><input className={claseEntrada} value={f.destino} onChange={(e) => setF((x) => ({ ...x, destino: e.target.value.toUpperCase() }))} placeholder="VIVIENDA, CONSUMO…" /></Campo>
              </CuerpoTarjeta>
            </Tarjeta>

            <Tarjeta>
              <EncabezadoTarjeta titulo="Valoración inicial" subtitulo="Opcional. Queda en el histórico inmutable de valoraciones (M07)." />
              <CuerpoTarjeta className="grid gap-4 md:grid-cols-4">
                <Campo etiqueta="Tipo de valoración">
                  <select className={claseEntrada} value={f.tipoValoracion} onChange={set("tipoValoracion")}>{VALORACIONES.map((v) => <option key={v} value={v}>{humano(v)}</option>)}</select>
                </Campo>
                <Campo etiqueta="Valor comercial"><input type="number" min="0" className={claseEntrada} value={f.valorComercial} onChange={set("valorComercial")} /></Campo>
                <Campo etiqueta="Fecha" requerido={!!f.valorComercial}><input type="date" max={hoy} className={claseEntrada} value={f.fechaValoracion} onChange={set("fechaValoracion")} /></Campo>
                <Campo etiqueta="Perito o proveedor"><input className={claseEntrada} value={f.perito} onChange={set("perito")} /></Campo>
              </CuerpoTarjeta>
            </Tarjeta>

            <Tarjeta>
              <EncabezadoTarjeta titulo="Otros participantes" subtitulo="El cliente queda como propietario. Agrega constituyentes, garantes o beneficiarios si aplica."
                acciones={<Boton type="button" variante="fantasma" onClick={() => setOtros((o) => [...o, { rol: "GARANTE", tipoDocumento: "CC", numeroDocumento: "", nombre: "", porcentaje: "" }])}><Plus className="h-4 w-4" /> Agregar</Boton>} />
              <CuerpoTarjeta className="space-y-3">
                {otros.length === 0 && <p className="text-b3 text-mid-600">Sin participantes adicionales.</p>}
                {otros.map((o, k) => {
                  const cambiar = (campo: keyof Participante) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                    setOtros((l) => l.map((x, i) => (i === k ? { ...x, [campo]: e.target.value } : x)));
                  return (
                    <div key={k} className="grid items-end gap-3 md:grid-cols-[1fr_0.7fr_1fr_1.6fr_0.6fr_auto]">
                      <Campo etiqueta="Rol"><select className={claseEntrada} value={o.rol} onChange={cambiar("rol")}>{ROLES.map((r) => <option key={r} value={r}>{humano(r)}</option>)}</select></Campo>
                      <Campo etiqueta="Documento"><select className={claseEntrada} value={o.tipoDocumento} onChange={cambiar("tipoDocumento")}>{DOCUMENTOS.map((d) => <option key={d}>{d}</option>)}</select></Campo>
                      <Campo etiqueta="Número" requerido><input className={claseEntrada} value={o.numeroDocumento} onChange={cambiar("numeroDocumento")} required /></Campo>
                      <Campo etiqueta="Nombre" requerido><input className={claseEntrada} value={o.nombre} onChange={cambiar("nombre")} required /></Campo>
                      <Campo etiqueta="%"><input type="number" min="0" max="100" className={claseEntrada} value={o.porcentaje} onChange={cambiar("porcentaje")} /></Campo>
                      <Boton type="button" variante="fantasma" aria-label="Quitar participante" onClick={() => setOtros((l) => l.filter((_, i) => i !== k))}><Trash2 className="h-4 w-4" /></Boton>
                    </div>
                  );
                })}
              </CuerpoTarjeta>
            </Tarjeta>

            <MensajeError error={registrar.error} />
            <div className="flex items-center gap-3">
              <Boton type="submit" cargando={registrar.isPending} compacto={false}><Save className="h-4 w-4" /> Registrar garantía</Boton>
              <p className="text-b3 text-mid-600">Se asigna el identificador GAR-AAAA-NNNNNN, queda en Registro y se audita con fuente “Manual”.</p>
            </div>
          </>
        )}
      </form>
    </>
  );
}
