import { Bot, Eye, FileSearch, Lock, MessageSquareQuote, ShieldOff } from "lucide-react";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta } from "@/components/ui/tarjeta";
import { Insignia } from "@/components/ui/insignia";

const PRINCIPIOS = [
  [ShieldOff, "No decide ni modifica", "No ejecuta decisiones crediticias ni cambia garantías. Consulta, resume, explica y recomienda acciones para revisión humana."],
  [Lock, "Ve lo que tú ves", "Consulta las APIs de Garantías 360 con los permisos del usuario que pregunta."],
  [MessageSquareQuote, "Siempre cita la fuente", "Cada respuesta enlaza la garantía, el cálculo, la regla o el documento que usó. Sin fuente, responde que no sabe."],
  [FileSearch, "Explica con la traza", "Las explicaciones de cobertura salen de la traza del cálculo, no de inferencias."],
  [Eye, "Auditable", "Cada pregunta, fuente y respuesta queda en la auditoría con el modelo y su versión."],
] as const;

export default function Asistente() {
  return (
    <>
      <EncabezadoPagina titulo={<span className="flex items-center gap-3">Asistente IA / Copiloto de garantías <Insignia tono="info">Fase 2</Insignia></span>} descripcion="Planeado para la fase 2 (M02). Requiere definir el modelo aprobado por el Banco y su política de IA (P-25), desplegado en el tenant de Azure del Banco." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRINCIPIOS.map(([Icono, t, d]) => (
          <Tarjeta key={t}>
            <CuerpoTarjeta>
              <Icono className="h-6 w-6 text-primary-600" aria-hidden />
              <p className="mt-3 text-s2 font-semibold">{t}</p>
              <p className="mt-1 text-b2 text-mid-600">{d}</p>
            </CuerpoTarjeta>
          </Tarjeta>
        ))}
        <Tarjeta className="bg-primary-600 text-white">
          <CuerpoTarjeta>
            <Bot className="h-6 w-6" aria-hidden />
            <p className="mt-3 text-s2 font-semibold">Preguntas previstas</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-b2 text-white/90">
              <li>¿Qué garantías tienen problemas de cobertura?</li>
              <li>¿Cuáles avalúos vencen en los próximos 30 días?</li>
              <li>¿Por qué esta garantía tiene una cobertura de 86 %?</li>
              <li>¿Qué regla generó esta alerta?</li>
            </ul>
          </CuerpoTarjeta>
        </Tarjeta>
      </div>
    </>
  );
}
