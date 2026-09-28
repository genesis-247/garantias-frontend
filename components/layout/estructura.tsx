"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart3, Bell, Bot, BookCheck, ChevronDown, ClipboardCheck, Database, FileSearch, Gavel, Landmark,
  LayoutDashboard, Menu, PanelLeftClose, Scale, Search, ShieldCheck, Sliders, Unlock, Workflow, Settings2, FileSpreadsheet,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/formato";
import { PERFILES, useSesion, type Perfil } from "@/store/sesion";
import { api } from "@/lib/api";
import type { Alerta } from "@/lib/tipos";

interface Item {
  href: string;
  etiqueta: string;
  icono: typeof Activity;
  fase?: string;
}

const MENU: { grupo: string; items: Item[] }[] = [
  {
    grupo: "Operación",
    items: [
      { href: "/", etiqueta: "Resumen", icono: LayoutDashboard },
      { href: "/asistente", etiqueta: "Asistente IA", icono: Bot, fase: "F2" },
      { href: "/ciclo-vida", etiqueta: "Ciclo de vida", icono: Workflow },
      { href: "/garantias", etiqueta: "Garantías", icono: Landmark },
      { href: "/estudio-juridico", etiqueta: "Estudio jurídico", icono: Scale },
      { href: "/constitucion", etiqueta: "Constitución y registro", icono: ClipboardCheck },
      { href: "/valoraciones", etiqueta: "Valoraciones", icono: BarChart3 },
      { href: "/cobertura", etiqueta: "Cobertura", icono: ShieldCheck },
      { href: "/core-transaccional", etiqueta: "Core transaccional", icono: Database },
      { href: "/monitoreo", etiqueta: "Monitoreo", icono: Activity },
      { href: "/ejecucion", etiqueta: "Ejecución", icono: Gavel },
      { href: "/liberacion", etiqueta: "Liberación", icono: Unlock },
    ],
  },
  {
    grupo: "Gobierno",
    items: [
      { href: "/cumplimiento", etiqueta: "Cumplimiento SFC", icono: BookCheck },
      { href: "/reglas", etiqueta: "Reglas", icono: Sliders },
      { href: "/auditoria", etiqueta: "Auditoría", icono: FileSearch },
    ],
  },
  {
    grupo: "Administración",
    items: [
      { href: "/configuracion", etiqueta: "Tipos de garantía", icono: Settings2 },
      { href: "/carga-masiva", etiqueta: "Carga masiva", icono: FileSpreadsheet },
      { href: "/seguridad", etiqueta: "Usuarios y perfiles", icono: UsersRound },
    ],
  },
];

const TODOS = MENU.flatMap((g) => g.items.map((i) => ({ ...i, grupo: g.grupo })));

function activo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Estructura({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [colapsada, setColapsada] = useState(false);
  const [movilAbierto, setMovilAbierto] = useState(false);

  useEffect(() => setMovilAbierto(false), [pathname]);

  return (
    <div className="flex min-h-screen">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-dg-8 focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      {movilAbierto && <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-[rgba(22,23,24,0.35)] lg:hidden" onClick={() => setMovilAbierto(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-primary-600 text-white transition-all lg:sticky lg:top-0 lg:h-screen",
          colapsada ? "w-[72px]" : "w-64",
          movilAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-white/10", colapsada ? "justify-center" : "px-5")}>
          {colapsada ? (
            <Image src="/marca/isotipo-blanco-verde.png" alt="Banco Popular" width={26} height={30} />
          ) : (
            <Image src="/marca/logo-horizontal-blanco.svg" alt="Banco Popular" width={170} height={27} priority />
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-3" aria-label="Navegación principal">
          {MENU.map((g) => (
            <div key={g.grupo} className="mb-2">
              {!colapsada && <p className="px-5 pb-1 pt-3 text-o font-semibold uppercase tracking-wider text-white/60">{g.grupo}</p>}
              <ul>
                {g.items.map((i) => {
                  const es = activo(pathname, i.href);
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        title={colapsada ? i.etiqueta : undefined}
                        aria-current={es ? "page" : undefined}
                        className={cn(
                          "relative mx-2 flex items-center gap-3 rounded-dg-8 px-3 py-2 text-a2 transition-colors",
                          es ? "bg-primary-900 font-semibold text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
                          colapsada && "justify-center",
                        )}
                      >
                        {es && <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-1 rounded-r bg-brand-600" aria-hidden />}
                        <i.icono className="h-[18px] w-[18px] shrink-0" aria-hidden />
                        {!colapsada && <span className="flex-1 truncate">{i.etiqueta}</span>}
                        {!colapsada && i.fase && <span className="rounded-dg-4 bg-white/15 px-1.5 text-o font-semibold">{i.fase}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <button
          onClick={() => setColapsada((c) => !c)}
          className="hidden items-center gap-2 border-t border-white/10 px-5 py-3 text-b3 text-white/70 hover:text-white lg:flex"
          aria-label={colapsada ? "Expandir menú" : "Colapsar menú"}
        >
          <PanelLeftClose className={cn("h-4 w-4 transition-transform", colapsada && "rotate-180")} aria-hidden />
          {!colapsada && "Colapsar menú"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Encabezado onMenu={() => setMovilAbierto(true)} />
        <main id="contenido" className="flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-light-600 px-8 py-3 text-c text-mid-600">
          Garantías 360 · Banco Popular S.A. · Datos sintéticos de demostración — no corresponden a clientes reales.
        </footer>
      </div>
    </div>
  );
}

function Encabezado({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { perfil, cambiar } = useSesion();
  const [montado, setMontado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [menuPerfil, setMenuPerfil] = useState(false);
  useEffect(() => setMontado(true), []);

  // Usuarios de demostración con sus roles efectivos (administración de perfiles, M24).
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-demo"],
    queryFn: () => api<Perfil[]>("/sesion/usuarios-demo"),
    enabled: montado,
    staleTime: 60_000,
  });
  const disponibles = usuarios && usuarios.length > 0 ? usuarios : PERFILES;
  useEffect(() => {
    const actualizado = usuarios?.find((u) => u.usuario === perfil.usuario);
    if (actualizado && (actualizado.roles.join() !== perfil.roles.join() || actualizado.nombre !== perfil.nombre)) cambiar(actualizado);
  }, [usuarios, perfil, cambiar]);

  const { data: alertas } = useQuery({
    queryKey: ["alertas", "encabezado", perfil.usuario],
    queryFn: () => api<Alerta[]>("/alertas"),
    enabled: montado,
  });
  const criticas = alertas?.filter((a) => a.criticidad === "CRITICA").length ?? 0;

  const actual = TODOS.find((i) => activo(pathname, i.href));
  const detalle = pathname.split("/").filter(Boolean)[1];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-light-600 bg-white px-4 lg:px-8" style={{ borderTop: "4px solid var(--bpop-designio-color-primary-600)" }}>
      <button className="rounded-dg-8 p-2 text-mid-600 hover:bg-light-400 lg:hidden" onClick={onMenu} aria-label="Abrir menú">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden items-center gap-3 md:flex">
        <span className="text-s2 font-bold text-primary-600">Garantías 360</span>
        <span className="h-5 w-px bg-light-600" aria-hidden />
        <nav aria-label="Migas de pan" className="text-a3 text-mid-600">
          <ol className="flex items-center gap-1.5">
            <li>{actual?.grupo ?? "Operación"}</li>
            <li aria-hidden>/</li>
            <li className={cn(!detalle && "font-semibold text-dark-600")}>
              {detalle && actual ? <Link href={actual.href} className="hover:underline">{actual.etiqueta}</Link> : actual?.etiqueta ?? "Resumen"}
            </li>
            {detalle && (
              <>
                <li aria-hidden>/</li>
                <li className="font-semibold text-dark-600">{decodeURIComponent(detalle)}</li>
              </>
            )}
          </ol>
        </nav>
      </div>
      <form
        className="ml-auto flex max-w-md flex-1 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (busqueda.trim()) router.push(`/garantias?texto=${encodeURIComponent(busqueda.trim())}`);
        }}
        role="search"
      >
        <label className="relative w-full">
          <span className="sr-only">Buscar garantía, cliente u obligación</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mid-400" aria-hidden />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="GAR-2026-…, cliente, documento o referencia"
            className="h-10 w-full rounded-dg-8 border border-light-900 bg-canvas pl-9 pr-3 text-a2 placeholder:text-mid-400 focus:border-primary-600 focus:bg-white focus:outline-none"
          />
        </label>
      </form>
      <Link href="/monitoreo" className="relative rounded-dg-8 p-2 text-mid-600 hover:bg-light-400" aria-label={`${criticas} alertas críticas`}>
        <Bell className="h-5 w-5" />
        {criticas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-dg-full bg-error-900 px-1 text-center text-o font-bold leading-[18px] text-white">
            {criticas > 99 ? "99+" : criticas}
          </span>
        )}
      </Link>
      <div className="relative">
        <button onClick={() => setMenuPerfil((m) => !m)} className="flex items-center gap-2 rounded-dg-8 px-2 py-1.5 text-left hover:bg-light-400" aria-haspopup="listbox" aria-expanded={menuPerfil}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-a3 font-bold text-primary-900" aria-hidden>
            {montado ? perfil.nombre.split(" ").map((p) => p[0]).slice(0, 2).join("") : ""}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-a3 font-semibold text-dark-600">{montado ? perfil.nombre : ""}</span>
            <span className="block text-c text-mid-600">{montado ? perfil.cargo : ""}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-mid-600" aria-hidden />
        </button>
        {menuPerfil && (
          <div className="absolute right-0 top-12 z-30 max-h-[70vh] w-80 overflow-y-auto rounded-dg-12 border border-light-600 bg-white p-2 shadow-float" role="listbox">
            <p className="px-3 py-2 text-c text-mid-600">
              Usuario de demostración (perfiles local/demo). Los roles salen de la administración de usuarios y perfiles; en producción la identidad viene de Entra ID.
            </p>
            {disponibles.map((p) => (
              <button
                key={p.usuario}
                role="option"
                aria-selected={p.usuario === perfil.usuario}
                onClick={() => {
                  cambiar(p);
                  setMenuPerfil(false);
                }}
                className={cn("flex w-full flex-col rounded-dg-8 px-3 py-2 text-left hover:bg-light-400", p.usuario === perfil.usuario && "bg-primary-100")}
              >
                <span className="text-a2 font-semibold text-dark-600">{p.nombre}</span>
                <span className="text-c text-mid-600">
                  {p.cargo} · {p.roles.join(", ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
