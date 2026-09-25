"use client";

import { EncabezadoPagina } from "@/components/pagina";
import { ListaPorEstado } from "@/components/lista-por-estado";
import { Insignia } from "@/components/ui/insignia";
import { humano } from "@/lib/formato";

export default function EstudioJuridico() {
  return (
    <>
      <EncabezadoPagina titulo="Estudio jurídico" descripcion="Bandeja de garantías pendientes de concepto jurídico. Abre el expediente para registrar el resultado: el concepto final lo emite un Director de Jurídica. Checklist, hallazgos y condicionamientos detallados llegan en el incremento 2." />
      <ListaPorEstado estados={["REGISTRO", "ESTUDIO_JURIDICO"]} vacio="No hay garantías pendientes de estudio" columnasExtra={[{ titulo: "Estado jurídico", celda: (g) => <Insignia tono="advertencia">{humano(g.estadoJuridico)}</Insignia> }]} />
    </>
  );
}
