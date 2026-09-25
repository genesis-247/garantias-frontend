"use client";

import { EncabezadoPagina } from "@/components/pagina";
import { ListaPorEstado } from "@/components/lista-por-estado";
import { Insignia } from "@/components/ui/insignia";
import { fecha } from "@/lib/formato";

export default function Liberacion() {
  return (
    <>
      <EncabezadoPagina titulo="Liberación" descripcion="Garantías cuya última obligación se canceló en Flexcube (la liberación se inicia sola) o que el Banco decidió liberar. No se libera una garantía con obligaciones activas sin autorización explícita de un Director. SLA de liberación: 15 días [supuesto P-15]." />
      <ListaPorEstado estados={["LIBERACION"]} vacio="No hay liberaciones pendientes" columnasExtra={[{ titulo: "En liberación desde", celda: (g) => <Insignia tono="advertencia">{fecha(g.updatedAt)}</Insignia> }]} />
    </>
  );
}
