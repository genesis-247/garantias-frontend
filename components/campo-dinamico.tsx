"use client";

import type { CampoDefinicion } from "@/lib/consultas";
import { humano } from "@/lib/formato";
import { Campo, claseEntrada } from "@/components/ui/varios";

/** Valor de formulario: texto para casi todo, booleano o lista de ids según el tipo de dato. */
export type ValorCampo = string | boolean | string[] | undefined;

/** Convierte el valor del formulario al JSON que espera la API (null = no informado). */
export function aJson(c: CampoDefinicion, v: ValorCampo): unknown {
  if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return null;
  switch (c.tipo) {
    case "NUMERO":
    case "MONEDA":
      return Number(v);
    case "BOOLEANO":
      return v === true || v === "true";
    case "LISTA_MULTIPLE":
      return v;
    default:
      return typeof v === "string" ? v.trim() : v;
  }
}

/** Valor existente (atributo de la garantía) → valor de formulario. */
export function desdeJson(c: CampoDefinicion, v: unknown): ValorCampo {
  if (v === null || v === undefined) return c.tipo === "LISTA_MULTIPLE" ? [] : undefined;
  if (c.tipo === "BOOLEANO") return v === true;
  if (c.tipo === "LISTA_MULTIPLE") return Array.isArray(v) ? v.map(String) : [];
  return String(v);
}

/** Campo del formulario dinámico generado desde la definición del tipo (RF-1609, RF-1704). */
export function CampoDinamico({ campo, valor, onCambiar, requerido }: { campo: CampoDefinicion; valor: ValorCampo; onCambiar: (v: ValorCampo) => void; requerido?: boolean }) {
  const obligatorio = requerido ?? (campo.obligatorio && !campo.obligatorioDesde);
  const ayuda = [campo.ayuda, campo.obligatorio && campo.obligatorioDesde ? `Obligatorio desde ${humano(campo.obligatorioDesde)}` : null, campo.llave ? "Llave natural: detecta duplicados" : null]
    .filter(Boolean)
    .join(" · ");
  const activas = (campo.opciones ?? []).filter((o) => o.activo);

  if (campo.tipo === "BOOLEANO") {
    return (
      <Campo etiqueta={campo.etiqueta} requerido={obligatorio} ayuda={ayuda || undefined}>
        <select className={claseEntrada} value={valor === undefined ? "" : valor ? "true" : "false"} onChange={(e) => onCambiar(e.target.value === "" ? undefined : e.target.value === "true")} required={obligatorio}>
          <option value="">Selecciona…</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </Campo>
    );
  }
  if (campo.tipo === "LISTA") {
    return (
      <Campo etiqueta={campo.etiqueta} requerido={obligatorio} ayuda={ayuda || undefined}>
        <select className={claseEntrada} value={(valor as string) ?? ""} onChange={(e) => onCambiar(e.target.value || undefined)} required={obligatorio}>
          <option value="">Selecciona…</option>
          {activas.map((o) => <option key={o.id} value={o.id}>{o.etiqueta}</option>)}
        </select>
      </Campo>
    );
  }
  if (campo.tipo === "LISTA_MULTIPLE") {
    const lista = Array.isArray(valor) ? valor : [];
    return (
      <fieldset>
        <legend className="text-a3 font-medium text-dark-900">{campo.etiqueta}{obligatorio && <span className="ml-0.5 text-error-600">*</span>}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {activas.map((o) => (
            <label key={o.id} className="flex items-center gap-1.5 rounded-dg-8 border border-light-900 px-2 py-1 text-b3">
              <input type="checkbox" checked={lista.includes(o.id)} onChange={(e) => onCambiar(e.target.checked ? [...lista, o.id] : lista.filter((x) => x !== o.id))} />
              {o.etiqueta}
            </label>
          ))}
        </div>
        {ayuda && <span className="mt-1 block text-c text-mid-600">{ayuda}</span>}
      </fieldset>
    );
  }
  if (campo.tipo === "TEXTO_LARGO") {
    return (
      <Campo etiqueta={campo.etiqueta} requerido={obligatorio} ayuda={ayuda || undefined}>
        <textarea className={`${claseEntrada} h-24 py-2`} value={(valor as string) ?? ""} onChange={(e) => onCambiar(e.target.value)} required={obligatorio} />
      </Campo>
    );
  }
  const numerico = campo.tipo === "NUMERO" || campo.tipo === "MONEDA";
  return (
    <Campo etiqueta={campo.etiqueta + (campo.tipo === "MONEDA" ? " (COP)" : "")} requerido={obligatorio} ayuda={ayuda || undefined}>
      <input
        className={claseEntrada}
        type={campo.tipo === "FECHA" ? "date" : numerico ? "number" : "text"}
        step={numerico ? "any" : undefined}
        min={numerico && campo.minimo != null ? campo.minimo : undefined}
        max={numerico && campo.maximo != null ? campo.maximo : undefined}
        pattern={campo.tipo === "TEXTO" && campo.patron ? campo.patron.replace(/^\^/, "").replace(/\$$/, "") : undefined}
        maxLength={campo.tipo === "TEXTO" ? 200 : undefined}
        value={(valor as string) ?? ""}
        onChange={(e) => onCambiar(e.target.value)}
        required={obligatorio}
      />
    </Campo>
  );
}
