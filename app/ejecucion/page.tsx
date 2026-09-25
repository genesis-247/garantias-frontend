"use client";

import { EncabezadoPagina } from "@/components/pagina";
import { ListaPorEstado } from "@/components/lista-por-estado";

export default function Ejecucion() {
  return (
    <>
      <EncabezadoPagina titulo="Ejecución" descripcion="Garantías en proceso de ejecución. El inicio lo autoriza un Director de Jurídica (RF-1104). El registro de etapas, recuperación estimada y obtenida llega en el incremento 2." />
      <ListaPorEstado estados={["EJECUCION"]} vacio="No hay garantías en ejecución" />
    </>
  );
}
