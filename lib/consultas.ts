"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type TipoDato = "TEXTO" | "TEXTO_LARGO" | "NUMERO" | "MONEDA" | "FECHA" | "BOOLEANO" | "LISTA" | "LISTA_MULTIPLE";

export interface Opcion {
  id: string;
  etiqueta: string;
  activo: boolean;
}

export interface CampoDefinicion {
  codigo: string;
  etiqueta: string;
  tipo: TipoDato;
  obligatorio: boolean;
  obligatorioDesde: string | null;
  llave: boolean;
  grupo: string | null;
  orden: number;
  ayuda: string | null;
  minimo?: number | null;
  maximo?: number | null;
  patron?: string | null;
  opciones: Opcion[] | null;
}

export interface Comportamiento {
  nombre: string;
  descripcion: string | null;
  clase: string;
  requiereAvaluo: boolean;
  requierePoliza: boolean;
  registroPublico: string;
  admiteMultiples: boolean;
}

export interface ItemChecklist {
  codigo: string;
  descripcion: string;
  obligatorio: boolean;
  ayuda: string | null;
}

export interface PlantillaActividad {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  obligatoria: boolean;
  requiereEvidencia: boolean;
  diasPlazo: number | null;
  rolResponsable: string | null;
  campos: string[];
}

export interface TipoInfo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  clase: string;
  requiereAvaluo: boolean;
  requierePoliza: boolean;
  registroPublico: string;
  admiteMultiples: boolean;
  activo: boolean;
  inactivadoPor: string | null;
  inactivadoEn: string | null;
  motivoInactivacion: string | null;
}

export interface VersionTipo {
  id: string;
  numero: number;
  estado: "BORRADOR" | "EN_REVISION" | "PUBLICADA" | "REEMPLAZADA" | "RECHAZADA" | "RETIRADA";
  comportamiento: Comportamiento;
  campos: CampoDefinicion[];
  checklistJuridico: ItemChecklist[];
  actividades: PlantillaActividad[];
  motivo: string | null;
  hash: string | null;
  creadoPor: string;
  aprobadoPor: string | null;
  createdAt: string;
  enviadaEn: string | null;
  aprobadaEn: string | null;
}

export interface TipoGarantia {
  tipo: TipoInfo;
  version: VersionTipo;
  campos: CampoDefinicion[];
}

export function useTipos(incluirInactivos = false) {
  return useQuery({
    queryKey: ["tipos-garantia", incluirInactivos],
    queryFn: () => api<TipoGarantia[]>(`/tipos-garantia${incluirInactivos ? "?incluirInactivos=true" : ""}`),
    staleTime: 300_000,
  });
}

export function nombreTipo(tipos: TipoGarantia[] | undefined, codigo: string) {
  return tipos?.find((t) => t.tipo.codigo === codigo)?.tipo.nombre ?? codigo;
}

// ------------------------------------------------------------------ constitución (M06)

export interface Actividad {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  obligatoria: boolean;
  requiereEvidencia: boolean;
  campos: string[];
  rolResponsable: string | null;
  responsable: string | null;
  fechaLimite: string | null;
  estado: "PENDIENTE" | "EN_CURSO" | "COMPLETADA" | "BLOQUEADA" | "NO_APLICA";
  evidenciaRef: string | null;
  evidenciaHash: string | null;
  datos: Record<string, unknown>;
  observacion: string | null;
  completadaPor: string | null;
  completadaEn: string | null;
  actualizadoPor: string | null;
  updatedAt: string;
}

export interface PlanConstitucion {
  garantia: string;
  macroestado: string;
  perfeccionada: boolean;
  editable: boolean;
  actividades: Actividad[];
  resumen: { total: number; cerradas: number; obligatoriasPendientes: number; bloqueadas: number; vencidas: number; completo: boolean };
}
