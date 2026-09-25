"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { entero, humano } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Esqueleto } from "@/components/ui/varios";

const ETAPAS = [
  ["SOLICITUD", "Aplicativo de producto", "La solicitud nace en el aplicativo de producto"],
  ["REGISTRO", "API de registro", "Garantías 360 valida los campos del tipo y crea el GAR-…"],
  ["ESTUDIO_JURIDICO", "Jurídica (Appian)", "Concepto, hallazgos y condicionamientos"],
  ["CONSTITUCION", "Operaciones (Appian)", "Firma, escritura, radicación"],
  ["PERFECCIONAMIENTO", "Operaciones", "Registro público: ORIP, RGM, RUNT, FNA, FNG"],
  ["ACTIVA", "Flexcube", "Se activa con el desembolso de la obligación"],
  ["MONITOREO", "Garantías 360", "Valoraciones, pólizas, cobertura y alertas"],
  ["EJECUCION", "Jurídica", "Cuando hay incumplimiento"],
  ["LIBERACION", "Flexcube + Operaciones", "Se inicia al cancelar la última obligación"],
  ["CIERRE", "Operaciones", "Paz y salvo, cancelación de registro y entrega de documentos"],
] as const;

export default function CicloDeVida() {
  const { data, isLoading } = useQuery({ queryKey: ["tablero"], queryFn: () => api<{ porEstado: { macroestado: string; garantias: number }[] }>("/tablero") });
  const conteo = (e: string) => data?.porEstado.find((p) => p.macroestado === e)?.garantias ?? 0;
  return (
    <>
      <EncabezadoPagina titulo="Ciclo de vida" descripcion="Macroestados fijos comunes a todos los tipos de garantía (M03). Cada transición se hace por la API de Garantías 360, que la valida y la registra en la auditoría; Appian orquesta las tareas humanas." />
      <Tarjeta>
        <EncabezadoTarjeta titulo="Garantías por etapa" subtitulo="Selecciona una etapa para ver sus garantías" />
        <CuerpoTarjeta>
          {isLoading ? <Esqueleto className="h-48" /> : (
            <ol className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {ETAPAS.map(([e, resp, desc], k) => (
                <li key={e}>
                  <Link href={`/garantias?macroestado=${e}`} className="block h-full rounded-dg-12 border border-light-600 p-4 transition-colors hover:border-primary-600 hover:bg-canvas">
                    <p className="flex items-center justify-between text-c font-semibold text-mid-600"><span>Etapa {k + 1}</span>{k < ETAPAS.length - 1 && <ArrowRight className="h-4 w-4" aria-hidden />}</p>
                    <p className="mt-1 text-s2 font-bold text-primary-600">{humano(e)}</p>
                    <p className="mt-1 text-h4 font-bold tabular-nums">{entero(conteo(e))}</p>
                    <p className="mt-1 text-b3 text-mid-600">{desc}</p>
                    <p className="mt-2 text-c font-semibold text-dark-600">Responsable: {resp}</p>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CuerpoTarjeta>
      </Tarjeta>
    </>
  );
}
