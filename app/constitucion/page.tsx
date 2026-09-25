"use client";

import { EncabezadoPagina } from "@/components/pagina";
import { ListaPorEstado } from "@/components/lista-por-estado";

export default function Constitucion() {
  return (
    <>
      <EncabezadoPagina titulo="Constitución y registro" descripcion="Garantías con concepto jurídico favorable pendientes de constituir y perfeccionar (escritura, ORIP, RGM, RUNT, FNA, FNG, pólizas). El perfeccionamiento exige los datos de registro obligatorios del tipo." />
      <ListaPorEstado estados={["CONSTITUCION", "PERFECCIONAMIENTO"]} vacio="No hay garantías en constitución" />
    </>
  );
}
