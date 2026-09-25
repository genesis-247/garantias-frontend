"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { porcentaje, humano } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Esqueleto } from "@/components/ui/varios";
import { Insignia } from "@/components/ui/insignia";
import { Tabla, Td, Th } from "@/components/ui/tabla";

export default function Cumplimiento() {
  const { data, isLoading } = useQuery({ queryKey: ["tablero"], queryFn: () => api<{ controles: { control: string; norma: string; nivel: number; estado: string }[] }>("/tablero") });
  return (
    <>
      <EncabezadoPagina titulo="Cumplimiento SFC" descripcion="Controles verificables derivados del marco normativo (sección 3 de la especificación). En este incremento los controles se calculan automáticamente; el catálogo configurable, las brechas con garantías afectadas y los planes de remediación llegan en el incremento 2." />
      <Tarjeta>
        <EncabezadoTarjeta titulo="Controles" subtitulo="Cumple ≥ 95 % · En riesgo ≥ 80 % · Brecha < 80 %" />
        {isLoading ? <Esqueleto className="m-4 h-48" /> : (
          <Tabla>
            <thead><tr><Th>Control</Th><Th>Norma</Th><Th numerica>Nivel</Th><Th>Estado</Th></tr></thead>
            <tbody>
              {data?.controles.map((c) => (
                <tr key={c.control}>
                  <Td className="font-semibold">{c.control}</Td>
                  <Td className="text-b3">{c.norma}</Td>
                  <Td numerica>{porcentaje(c.nivel, 1)}</Td>
                  <Td><Insignia tono={c.estado === "CUMPLE" ? "exito" : c.estado === "EN_RIESGO" ? "advertencia" : "error"}>{humano(c.estado)}</Insignia></Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </>
  );
}
