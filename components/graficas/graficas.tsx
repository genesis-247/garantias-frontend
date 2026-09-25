"use client";

import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { copCompacto, mes, porcentaje } from "@/lib/formato";

/** Paleta categórica validada (manual §7): orden fijo, nunca reciclada. */
export const SERIES = ["var(--g360-chart-1)", "var(--g360-chart-2)", "var(--g360-chart-3)", "var(--g360-chart-4)", "var(--g360-chart-5)", "var(--g360-chart-6)"];

const ejes = { stroke: "var(--bpop-designio-color-mid-100)", fontSize: 12, tickLine: false, axisLine: false } as const;

function CajaTooltip({ active, payload, label, formato }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; formato: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-dg-8 border border-light-600 bg-white px-3 py-2 text-b3 shadow-float">
      <p className="mb-1 font-semibold text-dark-600">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-mid-900">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {p.name}: <span className="font-semibold tabular-nums">{formato(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function GraficaEvolucion({ datos }: { datos: { periodo: string; cobertura: number | null; cobertura_idonea: number | null }[] }) {
  const filas = datos.map((d) => ({ periodo: mes(d.periodo), total: d.cobertura === null ? null : Number(d.cobertura), idonea: d.cobertura_idonea === null ? null : Number(d.cobertura_idonea) }));
  return (
    <div className="h-72" role="img" aria-label="Evolución de la cobertura del portafolio en los últimos 12 meses">
      <ResponsiveContainer>
        <LineChart data={filas} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--bpop-designio-color-light-600)" />
          <XAxis dataKey="periodo" {...ejes} />
          <YAxis {...ejes} width={48} tickFormatter={(v) => `${Math.round(v * 100)} %`} domain={["dataMin - 0.03", "dataMax + 0.03"]} />
          <Tooltip content={<CajaTooltip formato={(v) => porcentaje(v)} />} cursor={{ stroke: "var(--bpop-designio-color-mid-100)" }} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="total" name="Exposición cubierta" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="idonea" name="Cobertura idónea" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficaBarras({ datos, etiqueta }: { datos: { nombre: string; valor: number }[]; etiqueta: string }) {
  return (
    <div style={{ height: Math.max(160, datos.length * 34) }} role="img" aria-label={etiqueta}>
      <ResponsiveContainer>
        <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nombre" {...ejes} width={190} tick={{ fill: "var(--bpop-designio-color-mid-600)", fontSize: 12 }} />
          <Tooltip content={<CajaTooltip formato={(v) => copCompacto(v)} />} cursor={{ fill: "var(--bpop-designio-color-light-400)" }} />
          <Bar dataKey="valor" name="Valor admisible" fill={SERIES[0]} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="valor" position="right" formatter={(v: number) => copCompacto(v)} style={{ fontSize: 12, fill: "var(--bpop-designio-color-mid-900)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
