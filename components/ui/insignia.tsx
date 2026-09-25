import { AlertTriangle, CheckCircle2, CircleDashed, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn, humano } from "@/lib/formato";

type Tono = "exito" | "advertencia" | "error" | "info" | "neutro" | "marca";

const tonos: Record<Tono, string> = {
  exito: "bg-success-100 text-success-900",
  advertencia: "bg-warning-100 text-warning-text",
  error: "bg-error-100 text-error-900",
  info: "bg-info-100 text-info-900",
  neutro: "bg-light-400 text-mid-600",
  marca: "bg-primary-100 text-primary-900",
};

const iconos: Record<Tono, typeof Info> = {
  exito: CheckCircle2,
  advertencia: AlertTriangle,
  error: XCircle,
  info: Info,
  neutro: CircleDashed,
  marca: Info,
};

/** Insignia de estado: siempre ícono + texto, nunca solo color (WCAG, manual §3.7). */
export function Insignia({ tono = "neutro", children, className, sinIcono }: { tono?: Tono; children: ReactNode; className?: string; sinIcono?: boolean }) {
  const Icono = iconos[tono];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-dg-full px-2 py-0.5 text-b3 font-semibold", tonos[tono], className)}>
      {!sinIcono && <Icono className="h-3.5 w-3.5" aria-hidden />}
      {children}
    </span>
  );
}

const TONO_IDONEIDAD: Record<string, Tono> = { IDONEA: "exito", CONDICIONADA: "advertencia", NO_IDONEA: "error", NO_EVALUADA: "neutro" };
const TONO_ESTADO: Record<string, Tono> = {
  ACTIVA: "exito", MONITOREO: "exito", ACTUALIZACION: "info", PERFECCIONAMIENTO: "info", CONSTITUCION: "info",
  ESTUDIO_JURIDICO: "advertencia", REGISTRO: "info", SOLICITUD: "info", EJECUCION: "error", LIBERACION: "advertencia",
  CIERRE: "neutro", ANULADA: "neutro",
};
const TONO_CRITICIDAD: Record<string, Tono> = { CRITICA: "error", ALTA: "advertencia", MEDIA: "info", BAJA: "neutro" };
const TONO_REGLA: Record<string, Tono> = {
  ACTIVA: "exito", APROBADA: "info", EN_REVISION: "advertencia", BORRADOR: "neutro", RECHAZADA: "error", REEMPLAZADA: "neutro", INACTIVA: "neutro",
};

export const InsigniaIdoneidad = ({ valor }: { valor: string }) => (
  <Insignia tono={TONO_IDONEIDAD[valor] ?? "neutro"}>{valor === "NO_IDONEA" ? "No idónea" : humano(valor)}</Insignia>
);
export const InsigniaEstado = ({ valor }: { valor: string }) => <Insignia tono={TONO_ESTADO[valor] ?? "neutro"}>{humano(valor)}</Insignia>;
export const InsigniaCriticidad = ({ valor }: { valor: string }) => (
  <Insignia tono={TONO_CRITICIDAD[valor] ?? "neutro"}>{valor === "CRITICA" ? "Crítica" : humano(valor)}</Insignia>
);
export const InsigniaRegla = ({ valor }: { valor: string }) => <Insignia tono={TONO_REGLA[valor] ?? "neutro"}>{humano(valor)}</Insignia>;
