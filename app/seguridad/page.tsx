"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldAlert, UserPlus } from "lucide-react";
import { api, enviar } from "@/lib/api";
import { cn, fechaHora, humano } from "@/lib/formato";
import type { RegistroAuditoria } from "@/lib/tipos";
import { tieneRol, useSesion } from "@/store/sesion";
import { EncabezadoPagina } from "@/components/pagina";
import { Tarjeta, CuerpoTarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
import { Insignia } from "@/components/ui/insignia";
import { Tabla, Td, Th } from "@/components/ui/tabla";
import { Campo, claseEntrada, Esqueleto, MensajeError, PanelLateral, Pestanas, Vacio } from "@/components/ui/varios";
import { LineaAuditoria } from "@/components/linea-auditoria";

interface Perfil {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  roles: string[];
  activo: boolean;
  sistema: boolean;
  usuarios: number;
  actualizadoPor: string | null;
  updatedAt: string;
}

interface Usuario {
  usuario: string;
  nombre: string;
  cargo: string | null;
  correo: string | null;
  area: string | null;
  perfiles: string[];
  activo: boolean;
  roles: string[];
  actualizadoPor: string | null;
  updatedAt: string;
}

type Pestana = "usuarios" | "perfiles" | "roles" | "auditoria";

const ESCRITURA = ["OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR", "JURIDICA_GESTOR", "JURIDICA_DIRECTOR", "RIESGOS_GESTOR", "APROBADOR_REGLAS", "ADMIN_FUNCIONAL", "ADMIN_SEGURIDAD", "SISTEMA"];
const OPERACION = ["OPERACIONES_GESTOR", "OPERACIONES_DIRECTOR", "JURIDICA_GESTOR", "JURIDICA_DIRECTOR"];

/** Misma regla de segregación de funciones que aplica el backend (aviso previo; la API decide). */
function conflictos(roles: string[]) {
  const c: string[] = [];
  if (roles.includes("AUDITOR")) roles.filter((r) => ESCRITURA.includes(r)).forEach((r) => c.push(`Auditor y ${humano(r)}: el Auditor no escribe`));
  ["ADMIN_FUNCIONAL", "ADMIN_SEGURIDAD"].filter((a) => roles.includes(a)).forEach((a) =>
    roles.filter((r) => OPERACION.includes(r)).forEach((r) => c.push(`${humano(a)} y ${humano(r)}: la administración no opera garantías`)));
  if (roles.includes("RIESGOS_GESTOR") && roles.includes("APROBADOR_REGLAS")) c.push("Quien propone reglas no las aprueba");
  return c;
}

export default function Seguridad() {
  const { perfil } = useSesion();
  const esAdmin = tieneRol(perfil, "ADMIN_SEGURIDAD");
  const puedeVer = esAdmin || tieneRol(perfil, "AUDITOR");
  const [pestana, setPestana] = useState<Pestana>("usuarios");
  const [usuarioSel, setUsuarioSel] = useState<Usuario | "nuevo" | null>(null);
  const [perfilSel, setPerfilSel] = useState<Perfil | "nuevo" | null>(null);
  const [filtro, setFiltro] = useState("");
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api<Record<string, string>>("/seguridad/roles") });
  const perfiles = useQuery({ queryKey: ["perfiles"], queryFn: () => api<Perfil[]>("/seguridad/perfiles"), enabled: puedeVer });
  const usuarios = useQuery({ queryKey: ["usuarios"], queryFn: () => api<Usuario[]>("/seguridad/usuarios"), enabled: puedeVer });
  const auditoria = useQuery({
    queryKey: ["auditoria-seguridad"],
    queryFn: async () => {
      const [u, p] = await Promise.all([api<RegistroAuditoria[]>("/auditoria?entidad=Usuario&limite=100"), api<RegistroAuditoria[]>("/auditoria?entidad=Perfil&limite=100")]);
      return [...u, ...p].sort((a, b) => b.id - a.id);
    },
    enabled: puedeVer && pestana === "auditoria",
  });

  if (!puedeVer) {
    return (
      <>
        <EncabezadoPagina titulo="Usuarios y perfiles" />
        <Tarjeta><Vacio titulo="Sin acceso" detalle="La administra el Administrador de seguridad; Auditoría la consulta." /></Tarjeta>
      </>
    );
  }

  const nombrePerfil = (c: string) => perfiles.data?.find((p) => p.codigo === c)?.nombre ?? c;
  const lista = usuarios.data?.filter((u) => `${u.usuario} ${u.nombre} ${u.cargo ?? ""} ${u.area ?? ""}`.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <>
      <EncabezadoPagina
        antetitulo="Administración · M24"
        titulo="Usuarios y perfiles"
        descripcion="Los perfiles agrupan roles por área y nivel (sección 4). Los roles efectivos de un usuario registrado son los de sus perfiles activos; la API aplica la segregación de funciones: el Auditor no escribe, la administración no opera garantías y nadie modifica su propio usuario."
        acciones={esAdmin && (
          <>
            <Boton variante="secundario" onClick={() => { setPestana("perfiles"); setPerfilSel("nuevo"); }}><Plus className="h-4 w-4" /> Nuevo perfil</Boton>
            <Boton onClick={() => { setPestana("usuarios"); setUsuarioSel("nuevo"); }}><UserPlus className="h-4 w-4" /> Nuevo usuario</Boton>
          </>
        )}
      />
      <p className="mb-4 rounded-dg-8 border border-info-800 bg-info-100 px-4 py-3 text-b3 text-info-900">
        En producción la autenticación es Microsoft Entra ID (SSO + MFA). Cuando el usuario del token está registrado aquí, sus permisos son los de sus perfiles; si no, se usan los app roles del token. Un usuario inactivo no entra.
      </p>
      <Tarjeta>
        <div className="px-5 pt-2">
          <Pestanas<Pestana>
            activa={pestana}
            onCambiar={setPestana}
            opciones={[
              { id: "usuarios", etiqueta: "Usuarios", conteo: usuarios.data?.length },
              { id: "perfiles", etiqueta: "Perfiles", conteo: perfiles.data?.length },
              { id: "roles", etiqueta: "Catálogo de roles", conteo: roles.data ? Object.keys(roles.data).length : undefined },
              { id: "auditoria", etiqueta: "Auditoría" },
            ]}
          />
        </div>
        <MensajeError error={usuarios.error ?? perfiles.error} />
        {pestana === "usuarios" && (
          usuarios.isLoading ? <Esqueleto className="m-4 h-64" /> : (
            <>
              <div className="border-b border-light-600 p-4"><input className={`${claseEntrada} max-w-sm`} placeholder="Buscar usuario, nombre, cargo o área" aria-label="Buscar usuario" value={filtro} onChange={(e) => setFiltro(e.target.value)} /></div>
              <Tabla>
                <thead><tr><Th>Usuario</Th><Th>Cargo / área</Th><Th>Perfiles</Th><Th>Roles efectivos</Th><Th>Estado</Th><Th>Última modificación</Th><Th /></tr></thead>
                <tbody>
                  {lista?.map((u) => (
                    <tr key={u.usuario} className={cn(!u.activo && "text-mid-400")}>
                      <Td><p className="font-semibold">{u.nombre}</p><p className="font-mono text-c text-mid-600">{u.usuario}</p></Td>
                      <Td className="text-b3">{u.cargo ?? "—"}<br /><span className="text-mid-600">{u.area ?? ""}</span></Td>
                      <Td><span className="flex flex-wrap gap-1">{u.perfiles.map((p) => <Insignia key={p} tono="marca" sinIcono>{nombrePerfil(p)}</Insignia>)}</span></Td>
                      <Td className="text-c text-mid-600">{u.roles.join(", ") || "—"}</Td>
                      <Td><Insignia tono={u.activo ? "exito" : "neutro"}>{u.activo ? "Activo" : "Inactivo"}</Insignia></Td>
                      <Td className="text-b3">{u.actualizadoPor ?? "—"}<br /><span className="text-mid-600">{fechaHora(u.updatedAt)}</span></Td>
                      <Td>{esAdmin && u.usuario !== perfil.usuario && <Boton variante="fantasma" onClick={() => setUsuarioSel(u)} aria-label={`Editar ${u.nombre}`}><Pencil className="h-4 w-4" /></Boton>}</Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            </>
          )
        )}
        {pestana === "perfiles" && (
          perfiles.isLoading ? <Esqueleto className="m-4 h-64" /> : (
            <Tabla>
              <thead><tr><Th>Perfil</Th><Th>Roles</Th><Th numerica>Usuarios</Th><Th>Estado</Th><Th /></tr></thead>
              <tbody>
                {perfiles.data?.map((p) => (
                  <tr key={p.codigo}>
                    <Td><p className="font-semibold">{p.nombre} {p.sistema && <Insignia tono="neutro" sinIcono>Base</Insignia>}</p><p className="font-mono text-c text-mid-600">{p.codigo}</p>{p.descripcion && <p className="text-b3 text-mid-600">{p.descripcion}</p>}</Td>
                    <Td><span className="flex flex-wrap gap-1">{p.roles.map((r) => <Insignia key={r} tono="info" sinIcono>{humano(r)}</Insignia>)}</span></Td>
                    <Td numerica>{p.usuarios}</Td>
                    <Td><Insignia tono={p.activo ? "exito" : "neutro"}>{p.activo ? "Activo" : "Inactivo"}</Insignia></Td>
                    <Td>{esAdmin && <Boton variante="fantasma" onClick={() => setPerfilSel(p)} aria-label={`Editar ${p.nombre}`}><Pencil className="h-4 w-4" /></Boton>}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )
        )}
        {pestana === "roles" && (
          <CuerpoTarjeta className="grid gap-6 lg:grid-cols-2">
            <ul className="space-y-2">
              {roles.data && Object.entries(roles.data).map(([r, d]) => (
                <li key={r} className="rounded-dg-8 border border-light-600 p-3">
                  <p className="font-mono text-a3 font-semibold text-primary-900">{r}</p>
                  <p className="text-b2">{d}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-3 text-b2">
              <h3 className="flex items-center gap-2 text-s2 font-semibold"><ShieldAlert className="h-5 w-5 text-primary-600" aria-hidden /> Segregación de funciones</h3>
              <p>La API rechaza perfiles o asignaciones que combinen:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Auditor</strong> con cualquier rol que escriba.</li>
                <li><strong>Administrador funcional</strong> o <strong>de seguridad</strong> con roles que operan garantías (Operaciones, Jurídica).</li>
                <li><strong>Gestor de riesgos</strong> con <strong>Aprobador de reglas</strong>.</li>
              </ul>
              <p>Además, en cada operación se aplica el maker–checker: quien crea o edita una regla, una versión de tipo o una carga masiva no la aprueba, y nadie modifica sus propios perfiles.</p>
            </div>
          </CuerpoTarjeta>
        )}
        {pestana === "auditoria" && <CuerpoTarjeta>{auditoria.data ? <LineaAuditoria registros={auditoria.data} /> : <Esqueleto className="h-40" />}</CuerpoTarjeta>}
      </Tarjeta>
      {usuarioSel && <PanelUsuario u={usuarioSel} perfiles={perfiles.data ?? []} onCerrar={() => setUsuarioSel(null)} />}
      {perfilSel && <PanelPerfil p={perfilSel} catalogo={roles.data ?? {}} onCerrar={() => setPerfilSel(null)} />}
    </>
  );
}

function PanelUsuario({ u, perfiles, onCerrar }: { u: Usuario | "nuevo"; perfiles: Perfil[]; onCerrar: () => void }) {
  const cliente = useQueryClient();
  const nuevo = u === "nuevo";
  const [f, setF] = useState({
    usuario: nuevo ? "" : u.usuario, nombre: nuevo ? "" : u.nombre, cargo: nuevo ? "" : u.cargo ?? "", correo: nuevo ? "" : u.correo ?? "",
    area: nuevo ? "" : u.area ?? "", perfiles: nuevo ? [] as string[] : u.perfiles, activo: nuevo ? true : u.activo,
  });
  const m = useMutation({
    mutationFn: () => enviar(nuevo ? "/seguridad/usuarios" : `/seguridad/usuarios/${f.usuario}`, nuevo ? "POST" : "PUT",
      { ...f, cargo: f.cargo || null, correo: f.correo || null, area: f.area || null }),
    onSuccess: () => {
      cliente.invalidateQueries();
      onCerrar();
    },
  });
  const rolesResultantes = [...new Set(perfiles.filter((p) => f.perfiles.includes(p.codigo) && p.activo).flatMap((p) => p.roles))].sort();
  const avisos = conflictos(rolesResultantes);
  const set = (k: "usuario" | "nombre" | "cargo" | "correo" | "area") => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <PanelLateral abierto onCerrar={onCerrar} titulo={nuevo ? "Nuevo usuario" : `Editar ${f.nombre}`} subtitulo="El usuario debe coincidir con el de Entra ID (preferred_username)." ancho="max-w-xl">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Usuario" requerido><input className={`${claseEntrada} font-mono`} value={f.usuario} onChange={set("usuario")} disabled={!nuevo} pattern="[A-Za-z0-9._@\-]{3,80}" required /></Campo>
        <Campo etiqueta="Nombre" requerido><input className={claseEntrada} value={f.nombre} onChange={set("nombre")} required /></Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Cargo"><input className={claseEntrada} value={f.cargo} onChange={set("cargo")} /></Campo>
          <Campo etiqueta="Área"><input className={claseEntrada} value={f.area} onChange={set("area")} /></Campo>
        </div>
        <Campo etiqueta="Correo"><input type="email" className={claseEntrada} value={f.correo} onChange={set("correo")} /></Campo>
        <fieldset>
          <legend className="text-a3 font-medium">Perfiles</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {perfiles.map((p) => (
              <label key={p.codigo} className={cn("flex items-start gap-2 rounded-dg-8 border p-2 text-b3", f.perfiles.includes(p.codigo) ? "border-primary-600 bg-primary-100" : "border-light-600", !p.activo && "opacity-60")}>
                <input type="checkbox" className="mt-0.5" checked={f.perfiles.includes(p.codigo)}
                  onChange={(e) => setF((x) => ({ ...x, perfiles: e.target.checked ? [...x.perfiles, p.codigo] : x.perfiles.filter((c) => c !== p.codigo) }))} />
                <span><span className="font-semibold">{p.nombre}</span>{!p.activo && " (inactivo)"}<br /><span className="text-mid-600">{p.roles.join(", ")}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-b3 text-mid-600">Roles efectivos: {rolesResultantes.join(", ") || "ninguno (solo lectura autenticada)"}</p>
        {avisos.length > 0 && (
          <ul className="list-disc rounded-dg-8 border border-error-600 bg-error-100 py-2 pl-8 pr-3 text-b3 text-error-900">{avisos.map((a) => <li key={a}>{a}</li>)}</ul>
        )}
        <label className="flex items-center gap-2 text-a2"><input type="checkbox" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} /> Usuario activo</label>
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending} disabled={avisos.length > 0}>{nuevo ? "Crear usuario" : "Guardar cambios"}</Boton>
      </form>
    </PanelLateral>
  );
}

function PanelPerfil({ p, catalogo, onCerrar }: { p: Perfil | "nuevo"; catalogo: Record<string, string>; onCerrar: () => void }) {
  const cliente = useQueryClient();
  const nuevo = p === "nuevo";
  const [f, setF] = useState({
    codigo: nuevo ? "" : p.codigo, nombre: nuevo ? "" : p.nombre, descripcion: nuevo ? "" : p.descripcion ?? "",
    roles: nuevo ? [] as string[] : p.roles, activo: nuevo ? true : p.activo,
  });
  const m = useMutation({
    mutationFn: () => enviar(nuevo ? "/seguridad/perfiles" : `/seguridad/perfiles/${f.codigo}`, nuevo ? "POST" : "PUT", { ...f, descripcion: f.descripcion || null }),
    onSuccess: () => {
      cliente.invalidateQueries();
      onCerrar();
    },
  });
  const avisos = conflictos(f.roles);
  return (
    <PanelLateral abierto onCerrar={onCerrar} titulo={nuevo ? "Nuevo perfil" : `Editar perfil ${f.nombre}`}
      subtitulo={!nuevo && p.usuarios > 0 ? `Lo usan ${p.usuarios} usuario(s): cambiar sus roles cambia sus permisos de inmediato.` : "Agrupa roles del catálogo."} ancho="max-w-xl">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <Campo etiqueta="Código" requerido ayuda="MAYÚSCULAS_CON_GUIONES">
          <input className={`${claseEntrada} font-mono`} value={f.codigo} disabled={!nuevo} onChange={(e) => setF((x) => ({ ...x, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))} pattern="[A-Z][A-Z0-9_]{2,49}" required />
        </Campo>
        <Campo etiqueta="Nombre" requerido><input className={claseEntrada} value={f.nombre} onChange={(e) => setF((x) => ({ ...x, nombre: e.target.value }))} required /></Campo>
        <Campo etiqueta="Descripción"><input className={claseEntrada} value={f.descripcion} onChange={(e) => setF((x) => ({ ...x, descripcion: e.target.value }))} /></Campo>
        <fieldset>
          <legend className="text-a3 font-medium">Roles</legend>
          <div className="mt-2 space-y-2">
            {Object.entries(catalogo).map(([r, d]) => (
              <label key={r} className={cn("flex items-start gap-2 rounded-dg-8 border p-2 text-b3", f.roles.includes(r) ? "border-primary-600 bg-primary-100" : "border-light-600")}>
                <input type="checkbox" className="mt-0.5" checked={f.roles.includes(r)}
                  onChange={(e) => setF((x) => ({ ...x, roles: e.target.checked ? [...x.roles, r] : x.roles.filter((y) => y !== r) }))} />
                <span><span className="font-mono font-semibold">{r}</span><br /><span className="text-mid-600">{d}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        {avisos.length > 0 && (
          <ul className="list-disc rounded-dg-8 border border-error-600 bg-error-100 py-2 pl-8 pr-3 text-b3 text-error-900">{avisos.map((a) => <li key={a}>{a}</li>)}</ul>
        )}
        <label className="flex items-center gap-2 text-a2"><input type="checkbox" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} /> Perfil activo</label>
        <MensajeError error={m.error} />
        <Boton type="submit" cargando={m.isPending} disabled={avisos.length > 0 || f.roles.length === 0}>{nuevo ? "Crear perfil" : "Guardar cambios"}</Boton>
      </form>
    </PanelLateral>
  );
}
