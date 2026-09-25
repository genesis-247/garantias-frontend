"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { cop, porcentaje, cn } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { claseEntrada, Esqueleto, MensajeError } from "@/components/ui/varios";
import { ExplicacionCobertura } from "@/components/explicacion-cobertura";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";
import type { CoberturaVigente } from "@/lib/tipos";

interface Cliente {
  cliente: string;
  obligaciones: { obligacion: string; producto: string; estado: string; exposicion: number; cobertura: CoberturaVigente | null }[];
}

const EJEMPLOS = [
  ["CT-2026-001104", "Hipoteca compartida (prorrata) — Inversiones Altavista"],
  ["LS-2025-000988", "Flota de cinco vehículos — Transportes del Centro"],
  ["CT-2026-000912", "FNG 70 % — Industrias Metálicas Andinas"],
  ["TC-4509-2231", "CDT con excedente — Carlos Andrés Méndez"],
  ["LIB-2026-000871", "Cesantías FNA fuera de vivienda — control negativo"],
];

function Cobertura() {
  const params = useSearchParams();
  const [numero, setNumero] = useState(params.get("obligacion") ?? "CT-2026-001104");
  const [texto, setTexto] = useState(numero);
  const [documento, setDocumento] = useState("");
  const cliente = useQuery({
    queryKey: ["cobertura-cliente", documento],
    queryFn: () => api<Cliente>(`/clientes/${encodeURIComponent(documento)}/cobertura`),
    enabled: documento.length > 3,
  });
  return (
    <>
      <EncabezadoPagina
        titulo="Cobertura"
        descripcion="Cálculo completamente explicable: exposición, haircut, valor admisible, neto, asignado, disponible, cobertura objetivo y real, descubierto y brecha — con la traza de cada cifra y su reproducción verificable."
      />
      <div className="grid gap-6 xl:grid-cols-4">
        <div className="space-y-6">
          <Tarjeta>
            <EncabezadoTarjeta titulo="Por obligación" />
            <CuerpoTarjeta className="space-y-3">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setNumero(texto.trim()); }}>
                <input aria-label="Número de obligación" className={claseEntrada} value={texto} onChange={(e) => setTexto(e.target.value)} />
                <Boton type="submit" aria-label="Consultar"><Search className="h-4 w-4" /></Boton>
              </form>
              <p className="text-c font-semibold uppercase text-mid-600">Casos de ejemplo</p>
              <ul className="space-y-1">
                {EJEMPLOS.map(([n, d]) => (
                  <li key={n}>
                    <button onClick={() => { setNumero(n); setTexto(n); }} className={cn("w-full rounded-dg-8 px-2 py-1.5 text-left text-b3 hover:bg-light-400", numero === n && "bg-primary-100")}>
                      <span className="font-semibold text-primary-600">{n}</span>
                      <span className="block text-mid-600">{d}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </CuerpoTarjeta>
          </Tarjeta>
          <Tarjeta>
            <EncabezadoTarjeta titulo="Por cliente" subtitulo="Consolidado que consume FICO" />
            <CuerpoTarjeta className="space-y-3">
              <input aria-label="Documento del cliente" placeholder="Documento (p. ej. 860112233)" className={claseEntrada} value={documento} onChange={(e) => setDocumento(e.target.value.trim())} />
              <MensajeError error={cliente.error} />
              {cliente.data && (
                <Tabla>
                  <thead><tr><Th>Obligación</Th><Th numerica>Exposición</Th><Th numerica>Cob.</Th></tr></thead>
                  <tbody>
                    {cliente.data.obligaciones.map((o) => (
                      <Fila key={o.obligacion} onClick={() => { setNumero(o.obligacion); setTexto(o.obligacion); }}>
                        <Td className="text-b3 font-semibold text-primary-600">{o.obligacion}</Td>
                        <Td numerica className="text-b3">{cop(o.exposicion)}</Td>
                        <Td numerica className="text-b3">{o.cobertura?.ratio == null ? "—" : porcentaje(o.cobertura.ratio, 0)}</Td>
                      </Fila>
                    ))}
                  </tbody>
                </Tabla>
              )}
            </CuerpoTarjeta>
          </Tarjeta>
        </div>
        <Tarjeta className="xl:col-span-3">
          <EncabezadoTarjeta titulo={`Obligación ${numero}`} subtitulo="Cobertura vigente, garantías del grupo y traza del cálculo" />
          <CuerpoTarjeta>{numero ? <ExplicacionCobertura key={numero} numero={numero} /> : null}</CuerpoTarjeta>
        </Tarjeta>
      </div>
    </>
  );
}

export default function PaginaCobertura() {
  return <Suspense fallback={<Esqueleto className="h-96" />}><Cobertura /></Suspense>;
}
