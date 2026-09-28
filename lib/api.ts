import { useSesion } from "@/store/sesion";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

/** Error de la API en formato RFC 9457 (Problem Details), con Correlation ID para soporte. */
export class ErrorApi extends Error {
  constructor(
    public readonly estado: number,
    public readonly codigo: string,
    mensaje: string,
    public readonly detalles: string[],
    public readonly correlationId?: string,
  ) {
    super(mensaje);
  }
}

function correlationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function identidad(): Record<string, string> {
  const { perfil } = useSesion.getState();
  return { "X-Correlation-ID": correlationId(), "X-Usuario": perfil.usuario, "X-Roles": perfil.roles.join(",") };
}

async function error(respuesta: Response): Promise<ErrorApi> {
  const texto = await respuesta.text();
  let cuerpo: { codigo?: string; detail?: string; detalles?: string[]; correlationId?: string } | null = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch {
    cuerpo = null;
  }
  return new ErrorApi(
    respuesta.status,
    cuerpo?.codigo ?? "ERROR",
    cuerpo?.detail ?? `Error ${respuesta.status}`,
    cuerpo?.detalles ?? [],
    cuerpo?.correlationId ?? respuesta.headers.get("X-Correlation-ID") ?? undefined,
  );
}

export async function api<T>(ruta: string, opciones: RequestInit & { idempotencia?: string } = {}): Promise<T> {
  const cabeceras: Record<string, string> = { "Content-Type": "application/json", ...identidad() };
  if (opciones.idempotencia) cabeceras["Idempotency-Key"] = opciones.idempotencia;
  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { ...cabeceras, ...(opciones.headers as Record<string, string>) },
    cache: "no-store",
  });
  if (!respuesta.ok) throw await error(respuesta);
  const texto = await respuesta.text();
  return (texto ? JSON.parse(texto) : null) as T;
}

/** Envío multipart (carga de archivos): el navegador fija el Content-Type con su boundary. */
export async function subir<T>(ruta: string, datos: FormData): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, { method: "POST", body: datos, headers: identidad(), cache: "no-store" });
  if (!respuesta.ok) throw await error(respuesta);
  return (await respuesta.json()) as T;
}

/** Descarga un archivo generado por la API (plantillas, reportes) con la identidad de la sesión. */
export async function descargar(ruta: string, nombre: string): Promise<void> {
  const respuesta = await fetch(`${BASE}${ruta}`, { headers: identidad(), cache: "no-store" });
  if (!respuesta.ok) throw await error(respuesta);
  const url = URL.createObjectURL(await respuesta.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  a.click();
  URL.revokeObjectURL(url);
}

export const enviar = <T,>(ruta: string, metodo: "POST" | "PUT" | "PATCH" | "DELETE", cuerpo?: unknown) =>
  api<T>(ruta, { method: metodo, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
