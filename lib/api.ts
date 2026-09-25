import { useSesion } from "@/store/sesion";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

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

export async function api<T>(ruta: string, opciones: RequestInit & { idempotencia?: string } = {}): Promise<T> {
  const { perfil } = useSesion.getState();
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-ID": correlationId(),
    "X-Usuario": perfil.usuario,
    "X-Roles": perfil.roles.join(","),
  };
  if (opciones.idempotencia) cabeceras["Idempotency-Key"] = opciones.idempotencia;
  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: { ...cabeceras, ...(opciones.headers as Record<string, string>) },
    cache: "no-store",
  });
  const texto = await respuesta.text();
  const cuerpo = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) {
    throw new ErrorApi(
      respuesta.status,
      cuerpo?.codigo ?? "ERROR",
      cuerpo?.detail ?? `Error ${respuesta.status}`,
      cuerpo?.detalles ?? [],
      cuerpo?.correlationId ?? respuesta.headers.get("X-Correlation-ID") ?? undefined,
    );
  }
  return cuerpo as T;
}

export const enviar = <T,>(ruta: string, metodo: "POST" | "PUT" | "DELETE", cuerpo?: unknown) =>
  api<T>(ruta, { method: metodo, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
