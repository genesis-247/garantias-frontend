"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Perfiles de demostración (solo modo "cabeceras", perfiles local/demo del backend). En producción la
 * identidad y los roles vienen del token de Entra ID y este selector no se muestra.
 */
export interface Perfil {
  usuario: string;
  nombre: string;
  cargo: string;
  roles: string[];
}

export const PERFILES: Perfil[] = [
  { usuario: "operaciones.pedro", nombre: "Pedro Ramírez", cargo: "Gestor de operaciones", roles: ["OPERACIONES_GESTOR"] },
  { usuario: "operaciones.directora", nombre: "Marcela Duarte", cargo: "Directora de operaciones", roles: ["OPERACIONES_DIRECTOR"] },
  { usuario: "juridica.laura", nombre: "Laura Montoya", cargo: "Abogada de garantías", roles: ["JURIDICA_GESTOR"] },
  { usuario: "juridica.directora", nombre: "Catalina Rueda", cargo: "Directora jurídica", roles: ["JURIDICA_DIRECTOR"] },
  { usuario: "riesgos.ana", nombre: "Ana Beltrán", cargo: "Analista de riesgo de crédito", roles: ["RIESGOS_GESTOR"] },
  { usuario: "aprobador.juan", nombre: "Juan Camilo Rey", cargo: "Aprobador de reglas", roles: ["APROBADOR_REGLAS"] },
  { usuario: "auditoria.sofia", nombre: "Sofía Herrera", cargo: "Auditora interna", roles: ["AUDITOR"] },
  { usuario: "admin.funcional", nombre: "Diego Parra", cargo: "Administrador funcional", roles: ["ADMIN_FUNCIONAL", "SISTEMA"] },
  { usuario: "consulta.comercial", nombre: "Valentina Ortiz", cargo: "Gerente comercial", roles: ["CONSULTOR"] },
];

interface EstadoSesion {
  perfil: Perfil;
  cambiar: (usuario: string) => void;
}

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      perfil: PERFILES[0],
      cambiar: (usuario) => set({ perfil: PERFILES.find((p) => p.usuario === usuario) ?? PERFILES[0] }),
    }),
    { name: "g360-sesion" },
  ),
);

export function tieneRol(perfil: Perfil, ...roles: string[]) {
  return roles.some((r) => perfil.roles.includes(r));
}
