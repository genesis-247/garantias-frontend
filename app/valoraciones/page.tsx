"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GarantiaResumen, Pagina } from "@/lib/tipos";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError } from "@/components/ui/varios";
import { TablaGarantias } from "@/components/tabla-garantias";

export default function Valoraciones() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["garantias", "proximaValoracion"],
    queryFn: () => api<Pagina<GarantiaResumen>>("/garantias?orden=proximaValoracion&tamano=60"),
  });
  const conFecha = data?.items.filter((g) => g.fechaProximaValoracion && ["ACTIVA", "MONITOREO", "ACTUALIZACION", "EJECUCION"].includes(g.macroestado)) ?? [];
  return (
    <>
      <EncabezadoPagina titulo="Valoraciones" descripcion="Garantías ordenadas por su próxima valoración (periodicidad por regla: vehículos 12 meses con Fasecolda, inmuebles según política de Riesgos). Registra una valoración nueva desde el expediente; el histórico es inmutable y cada cambio recalcula la cobertura." />
      <MensajeError error={error} />
      <Tarjeta>
        <EncabezadoTarjeta titulo="Próximas a vencer y vencidas" subtitulo="Las fechas en rojo ya vencieron: la regla de haircut aplica un descuento adicional y la garantía deja de ser idónea." />
        {isLoading ? <Esqueleto className="m-4 h-64" /> : <TablaGarantias items={conFecha} />}
      </Tarjeta>
    </>
  );
}
