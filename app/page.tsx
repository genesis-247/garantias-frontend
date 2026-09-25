"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calculator, Info } from "lucide-react";
import { api } from "@/lib/api";
import { cop, copCompacto, entero, humano, porcentaje, puntos } from "@/lib/formato";
import type { Alerta, Indicador } from "@/lib/tipos";
import { EncabezadoPagina } from "@/components/pagina";
import { CuerpoTarjeta, EncabezadoTarjeta, Tarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError, PanelLateral } from "@/components/ui/varios";
import { Insignia, InsigniaCriticidad } from "@/components/ui/insignia";
import { GraficaBarras, GraficaEvolucion } from "@/components/graficas/graficas";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";

interface Tablero {
  fechaCorte: string;
  indicadores: Indicador[];
  componentesSalud: { nombre: string; peso: number; valor: number }[];
  controles: { control: string; norma: string; nivel: number; estado: string }[];
  evolucion: { periodo: string; cobertura: number | null; cobertura_idonea: number | null }[];
  composicionPorTipo: { tipo: string; nombre: string; garantias: number; valor: number }[];
  composicionPorSegmento: { segmento: string; garantias: number; valor: number }[];
  atencion: Alerta[];
}

const PRINCIPALES = ["INDICE_SALUD", "VALOR_GARANTIAS", "GARANTIAS_ACTIVAS", "EXPOSICION_CUBIERTA", "COBERTURA_IDONEA", "CUMPLIMIENTO"];

function valorIndicador(i: Indicador) {
  switch (i.unidad) {
    case "COP":
      return copCompacto(i.valor);
    case "PORCENTAJE":
      return puntos(i.valor, i.codigo === "CUMPLIMIENTO" ? 1 : 2);
    case "PUNTOS":
      return `${puntos(i.valor, 1).replace(" %", "")}`;
    default:
      return entero(i.valor);
  }
}

function Kpi({ i, destacado, onExplicar }: { i: Indicador; destacado?: boolean; onExplicar: () => void }) {
  return (
    <Tarjeta className={destacado ? "border-primary-600 bg-primary-600 text-white" : ""}>
      <div className="flex h-full flex-col justify-between gap-3 p-4">
        <p className={destacado ? "text-a3 font-medium text-white/80" : "text-a3 font-medium text-mid-600"}>{i.nombre}</p>
        <p className={destacado ? "text-h4 font-bold tabular-nums" : "whitespace-nowrap text-h5 font-bold tabular-nums text-dark-600"}>
          {valorIndicador(i)}
          {i.unidad === "PUNTOS" && <span className={destacado ? "ml-1 text-b2 font-medium text-white/80" : "ml-1 text-b2 text-mid-600"}>/ 100</span>}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className={destacado ? "text-c text-white/80" : "text-c text-mid-600"}>{i.detalle ?? ""}</span>
          <button onClick={onExplicar} className={destacado ? "inline-flex items-center gap-1 text-c font-semibold text-white underline" : "inline-flex items-center gap-1 text-c font-semibold text-link underline"}>
            <Calculator className="h-3.5 w-3.5" aria-hidden /> Ver cálculo
          </button>
        </div>
      </div>
    </Tarjeta>
  );
}

export default function CentroDeMando() {
  const { data, isLoading, error } = useQuery({ queryKey: ["tablero"], queryFn: () => api<Tablero>("/tablero") });
  const [explicado, setExplicado] = useState<Indicador | null>(null);

  const principales = data?.indicadores.filter((i) => PRINCIPALES.includes(i.codigo)) ?? [];
  const secundarios = data?.indicadores.filter((i) => !PRINCIPALES.includes(i.codigo)) ?? [];

  return (
    <>
      <EncabezadoPagina
        antetitulo="Centro de mando de riesgo crediticio"
        titulo="Control integral del respaldo, desde la originación hasta la liberación."
        descripcion="Una vista única para anticipar brechas, explicar cada cálculo y tomar decisiones con evidencia verificable."
        acciones={data && <Insignia tono="marca">Corte {data.fechaCorte}</Insignia>}
      />
      <MensajeError error={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {isLoading && Array.from({ length: 6 }).map((_, k) => <Esqueleto key={k} className="h-32" />)}
        {principales.map((i) => (
          <Kpi key={i.codigo} i={i} destacado={i.codigo === "INDICE_SALUD"} onExplicar={() => setExplicado(i)} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {secundarios.map((i) => (
          <Kpi key={i.codigo} i={i} onExplicar={() => setExplicado(i)} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Tarjeta className="xl:col-span-2">
          <EncabezadoTarjeta titulo="Evolución de la cobertura" subtitulo="Últimos 12 meses · exposición cubierta frente a cobertura con garantías idóneas" />
          <CuerpoTarjeta>{data ? <GraficaEvolucion datos={data.evolucion} /> : <Esqueleto className="h-72" />}</CuerpoTarjeta>
        </Tarjeta>
        <Tarjeta>
          <EncabezadoTarjeta titulo="Composición del respaldo" subtitulo="Valor admisible (después de haircut) de garantías activas por tipo" />
          <CuerpoTarjeta>
            {data ? (
              <GraficaBarras etiqueta="Valor admisible de garantías activas por tipo" datos={data.composicionPorTipo.map((c) => ({ nombre: c.nombre, valor: Number(c.valor) }))} />
            ) : (
              <Esqueleto className="h-72" />
            )}
          </CuerpoTarjeta>
        </Tarjeta>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Tarjeta className="xl:col-span-2">
          <EncabezadoTarjeta
            titulo="Casos que requieren atención"
            subtitulo="Alertas priorizadas por criticidad"
            acciones={<Link href="/monitoreo" className="inline-flex items-center gap-1 text-a3 font-semibold text-link underline">Ver monitoreo <ArrowRight className="h-4 w-4" aria-hidden /></Link>}
          />
          <Tabla>
            <thead>
              <tr>
                <Th>Criticidad</Th>
                <Th>Alerta</Th>
                <Th>Garantía / obligación</Th>
                <Th>Cliente</Th>
              </tr>
            </thead>
            <tbody>
              {data?.atencion.map((a, k) => (
                <Fila key={k}>
                  <Td><InsigniaCriticidad valor={a.criticidad} /></Td>
                  <Td>
                    <p className="font-semibold text-dark-600">{a.titulo}</p>
                    <p className="text-b3 text-mid-600">{a.detalle}</p>
                  </Td>
                  <Td className="text-b3">
                    {a.garantia && a.garantia.split(", ").slice(0, 2).map((g) => (
                      <Link key={g} href={`/garantias/${g}`} className="mr-2 font-semibold text-link underline">{g}</Link>
                    ))}
                    {a.obligacion && <span className="block text-mid-600">{a.obligacion}</span>}
                  </Td>
                  <Td className="text-b3">{a.cliente ?? "—"}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </Tarjeta>
        <Tarjeta>
          <EncabezadoTarjeta
            titulo="Controles normativos"
            subtitulo="Nivel de cumplimiento por control (M13)"
            acciones={<Link href="/cumplimiento" className="text-a3 font-semibold text-link underline">Detalle</Link>}
          />
          <CuerpoTarjeta className="space-y-4">
            {data?.controles.map((c) => (
              <div key={c.control}>
                <div className="flex items-center justify-between text-b2">
                  <span className="font-semibold text-dark-600">{c.control}</span>
                  <span className="tabular-nums text-mid-900">{porcentaje(c.nivel, 1)}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-dg-full bg-light-400" aria-hidden>
                  <div className="h-2 rounded-dg-full" style={{ width: `${Number(c.nivel) * 100}%`, background: c.estado === "CUMPLE" ? "var(--bpop-designio-color-success-600)" : c.estado === "EN_RIESGO" ? "var(--bpop-designio-color-warning-600)" : "var(--bpop-designio-color-error-600)" }} />
                </div>
                <p className="mt-1 text-c text-mid-600">{c.norma} · {humano(c.estado)}</p>
              </div>
            ))}
          </CuerpoTarjeta>
        </Tarjeta>
      </div>

      <PanelLateral abierto={!!explicado} onCerrar={() => setExplicado(null)} titulo={explicado?.nombre} subtitulo="Cómo se calcula este indicador" ancho="max-w-lg">
        {explicado && (
          <div className="space-y-5">
            <div className="rounded-dg-8 bg-light-400 p-4">
              <p className="text-a3 font-semibold text-mid-600">Fórmula</p>
              <p className="mt-1 font-mono text-b2 text-dark-600">{explicado.formula}</p>
            </div>
            <p className="text-h4 font-bold tabular-nums">{valorIndicador(explicado)}</p>
            {explicado.codigo === "INDICE_SALUD" && data && (
              <Tabla>
                <thead>
                  <tr>
                    <Th>Componente</Th>
                    <Th numerica>Peso</Th>
                    <Th numerica>Valor</Th>
                    <Th numerica>Aporte</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.componentesSalud.map((c) => (
                    <tr key={c.nombre}>
                      <Td>{c.nombre}</Td>
                      <Td numerica>{porcentaje(c.peso, 0)}</Td>
                      <Td numerica>{porcentaje(c.valor, 1)}</Td>
                      <Td numerica>{(Number(c.peso) * Number(c.valor) * 100).toLocaleString("es-CO", { maximumFractionDigits: 1 })}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )}
            <p className="flex gap-2 rounded-dg-8 border border-info-400 bg-info-100 p-3 text-b3 text-info-900">
              <Info className="h-4 w-4 shrink-0" aria-hidden />
              Fórmula propuesta en la especificación (sección M01), pendiente de validación por Riesgo de Crédito (P-09).
            </p>
            {explicado.unidad === "COP" && <p className="text-b2 text-mid-600">Valor exacto: {cop(explicado.valor)}</p>}
          </div>
        )}
      </PanelLateral>
    </>
  );
}
