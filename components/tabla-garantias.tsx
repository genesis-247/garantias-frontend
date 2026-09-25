"use client";

import { useRouter } from "next/navigation";
import type { GarantiaResumen } from "@/lib/tipos";
import { copCompacto, fecha, humano, porcentaje, cn } from "@/lib/formato";
import { nombreTipo, useTipos } from "@/lib/consultas";
import { Fila, Tabla, Td, Th } from "@/components/ui/tabla";
import { InsigniaEstado, InsigniaIdoneidad } from "@/components/ui/insignia";

export function TablaGarantias({ items, columnasExtra }: { items: GarantiaResumen[]; columnasExtra?: { titulo: string; celda: (g: GarantiaResumen) => React.ReactNode }[] }) {
  const router = useRouter();
  const { data: tipos } = useTipos();
  const hoy = new Date().toISOString().slice(0, 10);
  return (
    <Tabla>
      <thead>
        <tr>
          <Th>Garantía</Th>
          <Th>Cliente</Th>
          <Th>Producto</Th>
          <Th>Estado</Th>
          <Th>Idoneidad</Th>
          <Th numerica>Valor comercial</Th>
          <Th numerica>Valor neto</Th>
          <Th numerica>Cobertura</Th>
          <Th>Próx. valoración</Th>
          {columnasExtra?.map((c) => <Th key={c.titulo}>{c.titulo}</Th>)}
        </tr>
      </thead>
      <tbody>
        {items.map((g) => {
          const vencida = g.fechaProximaValoracion && g.fechaProximaValoracion < hoy;
          const ratio = g.cobertura?.ratioMinimo;
          const conBrecha = Number(g.cobertura?.brecha ?? 0) > 0;
          return (
            <Fila key={g.id} onClick={() => router.push(`/garantias/${g.codigo}`)}>
              <Td>
                <a href={`/garantias/${g.codigo}`} onClick={(e) => e.preventDefault()} className="whitespace-nowrap font-semibold text-primary-600">{g.codigo}</a>
                <p className="text-b3 text-mid-600">{nombreTipo(tipos, g.tipo)}</p>
              </Td>
              <Td>
                <p className="font-medium text-dark-600">{g.clienteNombre}</p>
                <p className="text-b3 text-mid-600">{g.clienteDocumento}</p>
              </Td>
              <Td className="text-b2">
                {humano(g.producto)}
                <p className="text-b3 text-mid-600">{humano(g.segmento)}</p>
              </Td>
              <Td><InsigniaEstado valor={g.macroestado} /></Td>
              <Td><InsigniaIdoneidad valor={g.idoneidad} /></Td>
              <Td numerica>{copCompacto(g.valorComercial)}</Td>
              <Td numerica>{copCompacto(g.valorNeto)}</Td>
              <Td numerica className={cn(conBrecha && "font-semibold text-error-900")}>
                {ratio === null || ratio === undefined ? "—" : porcentaje(ratio, 1)}
              </Td>
              <Td className={cn("text-b2", vencida && "font-semibold text-error-900")}>{fecha(g.fechaProximaValoracion)}</Td>
              {columnasExtra?.map((c) => <Td key={c.titulo}>{c.celda(g)}</Td>)}
            </Fila>
          );
        })}
      </tbody>
    </Tabla>
  );
}
