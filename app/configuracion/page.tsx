"use client";

import { useState } from "react";
import { useTipos } from "@/lib/consultas";
import { humano, cn } from "@/lib/formato";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Esqueleto, MensajeError } from "@/components/ui/varios";
import { Insignia } from "@/components/ui/insignia";
import { Tabla, Td, Th } from "@/components/ui/tabla";

export default function Configuracion() {
  const { data, isLoading, error } = useTipos();
  const [sel, setSel] = useState<string | null>(null);
  const tipo = data?.find((t) => t.tipo.codigo === sel) ?? data?.[0];
  return (
    <>
      <EncabezadoPagina titulo="Tipos de garantía" descripcion="Catálogo configurable sin desarrollo (M16, modelo Proceder): campos personalizados con obligatoriedad por estado, llave natural para detectar duplicados y versiones inmutables. En este incremento se administra por API; el editor visual llega en el incremento 2." />
      <MensajeError error={error} />
      {isLoading ? <Esqueleto className="h-96" /> : (
        <div className="grid gap-6 xl:grid-cols-4">
          <Tarjeta>
            <ul className="p-2">
              {data?.map((t) => (
                <li key={t.tipo.codigo}>
                  <button onClick={() => setSel(t.tipo.codigo)} className={cn("w-full rounded-dg-8 px-3 py-2 text-left hover:bg-light-400", tipo?.tipo.codigo === t.tipo.codigo && "bg-primary-100")}>
                    <span className="block text-a2 font-semibold">{t.tipo.nombre}</span>
                    <span className="text-c text-mid-600">{t.tipo.codigo} · v{t.version.numero}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Tarjeta>
          {tipo && (
            <Tarjeta className="xl:col-span-3">
              <EncabezadoTarjeta titulo={tipo.tipo.nombre} subtitulo={`${tipo.tipo.codigo} · clase ${humano(tipo.tipo.clase)} · versión publicada ${tipo.version.numero}`} />
              <CuerpoTarjeta className="flex flex-wrap gap-2">
                <Insignia tono={tipo.tipo.requiereAvaluo ? "info" : "neutro"}>{tipo.tipo.requiereAvaluo ? "Requiere avalúo" : "Sin avalúo"}</Insignia>
                <Insignia tono={tipo.tipo.requierePoliza ? "info" : "neutro"}>{tipo.tipo.requierePoliza ? "Requiere póliza" : "Sin póliza"}</Insignia>
                <Insignia tono="marca">Registro: {tipo.tipo.registroPublico === "NINGUNO" ? "no aplica" : tipo.tipo.registroPublico}</Insignia>
                <Insignia tono="neutro">{tipo.tipo.admiteMultiples ? "Puede respaldar varias obligaciones" : "Una sola obligación"}</Insignia>
              </CuerpoTarjeta>
              <Tabla>
                <thead><tr><Th>Campo</Th><Th>Tipo de dato</Th><Th>Grupo</Th><Th>Obligatorio</Th><Th>Llave</Th><Th>Opciones / ayuda</Th></tr></thead>
                <tbody>
                  {[...tipo.campos].sort((a, b) => a.orden - b.orden).map((c) => (
                    <tr key={c.codigo}>
                      <Td><p className="font-semibold">{c.etiqueta}</p><p className="font-mono text-c text-mid-600">{c.codigo}</p></Td>
                      <Td className="text-b3">{humano(c.tipo)}</Td>
                      <Td className="text-b3">{c.grupo ?? "—"}</Td>
                      <Td className="text-b3">{c.obligatorio ? (c.obligatorioDesde ? `Desde ${humano(c.obligatorioDesde)}` : "Desde el registro") : "No"}</Td>
                      <Td>{c.llave ? <Insignia tono="marca">Llave</Insignia> : "—"}</Td>
                      <Td className="text-b3">{c.opciones?.map((o) => o.etiqueta).join(", ") ?? c.ayuda ?? "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            </Tarjeta>
          )}
        </div>
      )}
    </>
  );
}
