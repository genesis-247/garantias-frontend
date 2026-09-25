"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { entero } from "@/lib/formato";
import type { RegistroAuditoria } from "@/lib/tipos";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta, EncabezadoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { claseEntrada, Esqueleto, MensajeError } from "@/components/ui/varios";
import { LineaAuditoria } from "@/components/linea-auditoria";

interface Verificacion { integra: boolean; registrosVerificados: number; primerRegistroAlterado: number | null; detalle: string }

export default function Auditoria() {
  const [f, setF] = useState({ entidad: "", entidadId: "", usuario: "", correlationId: "" });
  const [aplicados, setAplicados] = useState(f);
  const qs = new URLSearchParams(Object.entries({ ...aplicados, limite: "200" }).filter(([, v]) => v));
  const { data, isLoading, error } = useQuery({ queryKey: ["auditoria", qs.toString()], queryFn: () => api<RegistroAuditoria[]>(`/auditoria?${qs}`) });
  const verificar = useMutation({ mutationFn: () => api<Verificacion>("/auditoria/verificacion") });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <>
      <EncabezadoPagina
        titulo="Auditoría"
        descripcion="Toda modificación queda registrada: usuario, fecha, acción, valor anterior y nuevo, motivo, origen y Correlation ID. Los registros solo se agregan y están encadenados por SHA-256: cualquier alteración se detecta."
        acciones={<Boton onClick={() => verificar.mutate()} cargando={verificar.isPending}><ShieldCheck className="h-4 w-4" /> Verificar integridad</Boton>}
      />
      {verificar.data && (
        <div className={`mb-6 flex items-start gap-3 rounded-dg-12 border p-4 ${verificar.data.integra ? "border-success-600 bg-success-100 text-success-900" : "border-error-600 bg-error-100 text-error-900"}`}>
          {verificar.data.integra ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          <div>
            <p className="text-s2 font-bold">{verificar.data.integra ? "Cadena de auditoría íntegra" : "Se detectó una alteración"}</p>
            <p className="text-b2">
              {entero(verificar.data.registrosVerificados)} registros recalculados y comparados. {verificar.data.detalle}
              {verificar.data.primerRegistroAlterado && ` Primer registro alterado: #${verificar.data.primerRegistroAlterado}.`}
            </p>
          </div>
        </div>
      )}
      <MensajeError error={verificar.error} />
      <Tarjeta>
        <EncabezadoTarjeta titulo="Línea de tiempo" subtitulo="Selecciona un registro para ver qué cambió" />
        <form className="grid grid-cols-1 gap-3 border-b border-light-600 p-4 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); setAplicados(f); }}>
          <select aria-label="Entidad" className={claseEntrada} value={f.entidad} onChange={set("entidad")}>
            <option value="">Todas las entidades</option>
            {["Garantia", "Obligacion", "Regla", "CalculoCobertura", "TipoGarantia"].map((e) => <option key={e}>{e}</option>)}
          </select>
          <input aria-label="Identificador" placeholder="GAR-…, obligación o regla" className={claseEntrada} value={f.entidadId} onChange={set("entidadId")} />
          <input aria-label="Usuario" placeholder="Usuario" className={claseEntrada} value={f.usuario} onChange={set("usuario")} />
          <input aria-label="Correlation ID" placeholder="Correlation ID" className={claseEntrada} value={f.correlationId} onChange={set("correlationId")} />
          <Boton type="submit" variante="secundario">Filtrar</Boton>
        </form>
        <CuerpoTarjeta>
          <MensajeError error={error} />
          {isLoading ? <Esqueleto className="h-64" /> : data && <LineaAuditoria registros={data} mostrarEntidad />}
        </CuerpoTarjeta>
      </Tarjeta>
    </>
  );
}
