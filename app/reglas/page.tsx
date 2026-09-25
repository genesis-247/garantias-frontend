"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { humano } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError } from "@/components/ui/varios";
import { Insignia, InsigniaRegla } from "@/components/ui/insignia";
import { Tabla, Td, Th, Fila } from "@/components/ui/tabla";

interface Item {
  regla: { codigo: string; nombre: string; descripcion: string; tipo: string };
  activa: number | null;
  pendientes: number;
  ultima: { numero: number; estado: string } | null;
}

export default function Reglas() {
  const { data, isLoading, error } = useQuery({ queryKey: ["reglas"], queryFn: () => api<Item[]>("/reglas") });
  return (
    <>
      <EncabezadoPagina
        titulo="Motor de reglas"
        descripcion="Reglas no-code en tablas de decisión: haircuts, idoneidad, cobertura objetivo, distribución, prioridades y periodicidades. Una regla solo entra en producción cuando la aprueba un usuario distinto de quien la creó (maker–checker). Los valores precargados son ilustrativos: los define Riesgo de Crédito."
      />
      <MensajeError error={error} />
      <Tarjeta>
        {isLoading ? <Esqueleto className="m-4 h-64" /> : (
          <Tabla>
            <thead><tr><Th>Regla</Th><Th>Tipo</Th><Th>Versión activa</Th><Th>Última versión</Th><Th>Pendientes de aprobación</Th></tr></thead>
            <tbody>
              {data?.map((r) => (
                <Fila key={r.regla.codigo}>
                  <Td>
                    <Link href={`/reglas/${r.regla.codigo}`} className="font-semibold text-primary-600 hover:underline">{r.regla.codigo} · {r.regla.nombre}</Link>
                    <p className="max-w-2xl text-b3 text-mid-600">{r.regla.descripcion}</p>
                  </Td>
                  <Td className="text-b3">{humano(r.regla.tipo)}</Td>
                  <Td>{r.activa ? <Insignia tono="exito">v{r.activa}</Insignia> : <Insignia tono="error">Sin versión activa</Insignia>}</Td>
                  <Td>{r.ultima && <span className="flex items-center gap-2 text-b3">v{r.ultima.numero} <InsigniaRegla valor={r.ultima.estado} /></span>}</Td>
                  <Td>{r.pendientes > 0 ? <Insignia tono="advertencia">{r.pendientes} en revisión</Insignia> : "—"}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </>
  );
}
