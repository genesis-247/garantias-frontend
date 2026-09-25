"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface TipoGarantia {
  tipo: { id: string; codigo: string; nombre: string; clase: string; requiereAvaluo: boolean; requierePoliza: boolean; registroPublico: string; admiteMultiples: boolean; activo: boolean };
  version: { numero: number };
  campos: {
    codigo: string;
    etiqueta: string;
    tipo: string;
    obligatorio: boolean;
    obligatorioDesde: string | null;
    llave: boolean;
    grupo: string | null;
    orden: number;
    ayuda: string | null;
    opciones: { id: string; etiqueta: string; activo: boolean }[] | null;
  }[];
}

export function useTipos() {
  return useQuery({ queryKey: ["tipos-garantia"], queryFn: () => api<TipoGarantia[]>("/tipos-garantia"), staleTime: 300_000 });
}

export function nombreTipo(tipos: TipoGarantia[] | undefined, codigo: string) {
  return tipos?.find((t) => t.tipo.codigo === codigo)?.tipo.nombre ?? codigo;
}
