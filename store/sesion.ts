"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Identidad de demostración (solo modo "cabeceras", perfiles local/demo del backend). La lista de
 * usuarios y sus roles efectivos vienen de la administración de usuarios y perfiles (M24); esta
 * lista local solo se usa si el backend aún no responde. En producción la identidad y los roles
 * vienen del token de Entra ID y el selector no se muestra.
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
  { usuario: "admin.aprobadora", nombre: "Natalia Guzmán", cargo: "Administradora funcional (aprobadora)", roles: ["ADMIN_FUNCIONAL"] },
  { usuario: "seguridad.andres", nombre: "Andrés Castaño", cargo: "Administrador de seguridad", roles: ["ADMIN_SEGURIDAD"] },
  { usuario: "consulta.comercial", nombre: "Valentina Ortiz", cargo: "Gerente comercial", roles: ["CONSULTOR"] },
];

interface EstadoSesion {
  perfil: Perfil;
  cambiar: (perfil: Perfil) => void;
}

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      perfil: PERFILES[0],
      cambiar: (perfil) => set({ perfil }),
    }),
    { name: "g360-sesion" },
  ),
);

export function tieneRol(perfil: Perfil, ...roles: string[]) {
  return roles.some((r) => perfil.roles.includes(r));
}
