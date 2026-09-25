"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Fingerprint, RotateCcw, XCircle } from "lucide-react";
import { api, enviar } from "@/lib/api";
import { cop, fechaHora, humano, porcentaje, cn } from "@/lib/formato";
import type { Calculo, CoberturaVigente } from "@/lib/tipos";
import { Boton } from "@/components/ui/boton";
import { Esqueleto, MensajeError } from "@/components/ui/varios";
import { Insignia, InsigniaEstado, InsigniaIdoneidad } from "@/components/ui/insignia";
import { Tabla, Td, Th } from "@/components/ui/tabla";

interface RespuestaCobertura {
  obligacion: { numero: string; clienteNombre: string; clienteDocumento: string; producto: string; segmento: string; estado: string; diasMora: number };
  exposicion: number;
  garantias: { codigo: string; tipo: string; macroestado: string; idoneidad: string }[];
  cobertura?: CoberturaVigente;
  calculo?: Calculo;
  historial: { id: string; fechaCorte: string; estado: string; disparador: string }[];
}

function Cifra({ etiqueta, valor, fuerte, tono }: { etiqueta: string; valor: string; fuerte?: boolean; tono?: "error" | "exito" }) {
  return (
    <div className="rounded-dg-8 border border-light-600 bg-white p-3">
      <p className="text-c font-medium text-mid-600">{etiqueta}</p>
      <p className={cn("mt-0.5 tabular-nums", fuerte ? "text-s1 font-bold" : "text-b1 font-semibold", tono === "error" && "text-error-900", tono === "exito" && "text-success-900")}>{valor}</p>
    </div>
  );
}

/** Explicación completa de la cobertura de una obligación (RF-0803): cifras, garantías, traza y reproducción. */
export function ExplicacionCobertura({ numero }: { numero: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cobertura", numero],
    queryFn: () => api<RespuestaCobertura>(`/obligaciones/${encodeURIComponent(numero)}/cobertura`),
  });
  const reproducir = useMutation({
    mutationFn: (id: string) => enviar<{ reproducible: boolean; hashResultadoOriginal: string; hashResultadoReproducido: string }>(`/calculos-cobertura/${id}/reproduccion`, "POST"),
  });

  if (isLoading) return <Esqueleto className="h-96" />;
  if (error) return <MensajeError error={error} />;
  if (!data) return null;
  const c = data.cobertura;
  const calc = data.calculo;
  const codigoDe = (id: string | null) => calc?.resultado.garantias.find((g) => g.id === id)?.codigo ?? "";
  const numeroDe = (id: string | null) => calc?.resultado.obligaciones.find((o) => o.id === id)?.numero ?? "";
  const obligacionId = calc?.resultado.obligaciones.find((o) => o.numero === numero)?.id;
  const garantiasDelGrupo = new Set(calc?.resultado.asignaciones.filter((a) => a.obligacionId === obligacionId).map((a) => a.garantiaId));
  const pasos = calc?.resultado.traza.filter((p) => p.obligacionId === obligacionId || (p.ambito === "GARANTIA" && garantiasDelGrupo.has(p.garantiaId ?? ""))) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-b2 text-mid-600">
        <span className="font-semibold text-dark-600">{data.obligacion.clienteNombre}</span>·<span>{humano(data.obligacion.producto)}</span>·
        <InsigniaEstado valor={data.obligacion.estado} />
        {data.obligacion.diasMora > 0 && <Insignia tono="error">{data.obligacion.diasMora} días de mora</Insignia>}
      </div>

      {c ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cifra etiqueta="Exposición (Flexcube)" valor={cop(c.exposicion)} />
          <Cifra etiqueta="Cobertura objetivo" valor={porcentaje(c.coberturaObjetivo, 0)} />
          <Cifra etiqueta="Requerido" valor={cop(c.requerido)} />
          <Cifra etiqueta="Valor asignado" valor={cop(c.asignado)} />
          <Cifra etiqueta="Cobertura real" valor={c.ratio === null ? "Sin exposición" : porcentaje(c.ratio)} fuerte tono={c.brecha > 0 ? "error" : "exito"} />
          <Cifra etiqueta="Cobertura idónea" valor={c.ratioIdoneo === null ? "—" : porcentaje(c.ratioIdoneo)} fuerte />
          <Cifra etiqueta="Descubierto" valor={cop(c.descubierto)} tono={c.descubierto > 0 ? "error" : undefined} />
          <Cifra etiqueta="Brecha frente al objetivo" valor={cop(c.brecha)} tono={c.brecha > 0 ? "error" : undefined} />
        </div>
      ) : (
        <p className="text-b2 text-mid-600">Esta obligación aún no tiene un cálculo de cobertura.</p>
      )}

      {calc && (
        <>
          <section>
            <h3 className="mb-2 text-s2 font-semibold">Garantías del cálculo</h3>
            <Tabla>
              <thead>
                <tr>
                  <Th>Garantía</Th>
                  <Th numerica>Valor bruto</Th>
                  <Th numerica>Haircut</Th>
                  <Th numerica>Admisible</Th>
                  <Th numerica>Gravámenes</Th>
                  <Th numerica>Neto</Th>
                  <Th numerica>Utilizado</Th>
                  <Th numerica>Disponible</Th>
                  <Th>Uso</Th>
                </tr>
              </thead>
              <tbody>
                {calc.resultado.garantias.map((g) => (
                  <tr key={g.id} className={cn(!garantiasDelGrupo.has(g.id) && "text-mid-400")}>
                    <Td>
                      <Link href={`/garantias/${g.codigo}`} className="whitespace-nowrap font-semibold text-link underline">{g.codigo}</Link>
                      {g.estado !== "VALIDA" && <p className="text-c text-error-900">{humano(g.estado)}: {g.motivo}</p>}
                      {!g.idonea && g.estado === "VALIDA" && <p className="text-c text-warning-text">No cuenta como idónea</p>}
                    </Td>
                    <Td numerica>{cop(g.valorBruto)}</Td>
                    <Td numerica>{g.haircut === null ? "—" : porcentaje(g.haircut, 0)}</Td>
                    <Td numerica>{cop(g.valorAdmisible)}</Td>
                    <Td numerica>{cop(g.gravamenes)}</Td>
                    <Td numerica className="font-semibold">{cop(g.valorNeto)}</Td>
                    <Td numerica>{cop(g.utilizado)}</Td>
                    <Td numerica>{cop(g.disponible)}</Td>
                    <Td className="text-b3">{g.exclusiva ? "Exclusiva" : "Compartida"}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          </section>

          <section>
            <h3 className="mb-1 text-s2 font-semibold">¿Cómo se obtuvo cada cifra?</h3>
            <p className="mb-3 text-b3 text-mid-600">Traza del cálculo, paso a paso, con la regla y la versión que aplicó en cada uno.</p>
            <ol className="relative space-y-3 border-l-2 border-primary-100 pl-6">
              {pasos.map((p) => (
                <li key={p.orden} className="relative">
                  <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-o font-bold text-white">{p.orden}</span>
                  <p className="text-b2 font-semibold text-dark-600">
                    {p.descripcion}
                    {p.ambito === "ASIGNACION" && <span className="font-normal text-mid-600"> ({codigoDe(p.garantiaId)} → {numeroDe(p.obligacionId)})</span>}
                  </p>
                  <p className="mt-0.5 break-words font-mono text-b3 text-mid-900">{p.formula}</p>
                  <p className="mt-0.5 text-b3">
                    <span className="font-semibold tabular-nums text-primary-600">
                      = {p.ambito === "OBLIGACION" && p.descripcion.startsWith("Cobertura") ? porcentaje(p.resultado) : cop(p.resultado)}
                    </span>
                    {p.regla && <span className="ml-2 text-mid-600">· Regla {p.regla}</span>}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-dg-12 border border-light-600 bg-light-400 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 text-b3 text-mid-900">
                <p className="flex items-center gap-1.5 text-b2 font-semibold text-dark-600"><Fingerprint className="h-4 w-4" aria-hidden /> Evidencia del cálculo</p>
                <p>Cálculo <span className="font-mono">{calc.id}</span> · {fechaHora(calc.fechaCorte)} · {humano(calc.disparador)} · por {calc.creadoPor}</p>
                <p>Hash de entradas: <span className="break-all font-mono">{calc.hashEntradas}</span></p>
                <p>Hash del resultado: <span className="break-all font-mono">{calc.hashResultado}</span></p>
                <p>Reglas: {Object.values(calc.reglas).map((r) => `${r.regla} v${r.version}`).join(" · ")}</p>
              </div>
              <Boton variante="secundario" onClick={() => reproducir.mutate(calc.id)} cargando={reproducir.isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Reproducir cálculo
              </Boton>
            </div>
            {reproducir.data && (
              <p className={cn("mt-3 flex items-center gap-2 text-b2 font-semibold", reproducir.data.reproducible ? "text-success-900" : "text-error-900")}>
                {reproducir.data.reproducible ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {reproducir.data.reproducible
                  ? "Reproducido: las mismas entradas y reglas producen exactamente el mismo resultado (hash idéntico)."
                  : "El resultado reproducido no coincide con el original."}
              </p>
            )}
            <MensajeError error={reproducir.error} />
          </section>

          {data.historial.length > 1 && (
            <section>
              <h3 className="mb-2 text-s2 font-semibold">Versiones del cálculo</h3>
              <ul className="space-y-1 text-b3">
                {data.historial.map((h) => (
                  <li key={h.id} className="flex flex-wrap gap-2 text-mid-900">
                    <span className="tabular-nums">{fechaHora(h.fechaCorte)}</span>·<span>{humano(h.disparador)}</span>·<span>{humano(h.estado)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {data.garantias.length > 0 && (
        <p className="text-b3 text-mid-600">
          Garantías vinculadas: {data.garantias.map((g) => (
            <span key={g.codigo} className="mr-3 inline-flex items-center gap-1">
              <Link href={`/garantias/${g.codigo}`} className="font-semibold text-link underline">{g.codigo}</Link> <InsigniaIdoneidad valor={g.idoneidad} />
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
