import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/formato";

type Variante = "primario" | "secundario" | "fantasma" | "peligro";

const estilos: Record<Variante, string> = {
  primario: "bg-primary-600 text-white hover:bg-primary-grad active:bg-primary-900",
  secundario: "border border-primary-600 bg-white text-primary-600 hover:bg-primary-100 hover:text-primary-900 active:bg-primary-400",
  fantasma: "text-primary-600 hover:bg-light-400",
  peligro: "bg-error-900 text-white hover:opacity-90",
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  compacto?: boolean;
  cargando?: boolean;
}

/** Botón Designio (Portal Bancario): 48 px, radio 8, Inter 14 bold; variante compacta de 40 px para barras de herramientas. */
export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = "primario", compacto = true, cargando, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-dg-8 font-bold transition-colors disabled:cursor-not-allowed disabled:bg-light-900 disabled:text-white disabled:border-transparent",
        compacto ? "h-control-compact px-4 text-a2" : "h-control px-8 text-a2",
        estilos[variante],
        className,
      )}
      {...props}
    >
      {cargando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
