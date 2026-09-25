export type Macroestado =
  | "SOLICITUD" | "REGISTRO" | "ESTUDIO_JURIDICO" | "CONSTITUCION" | "PERFECCIONAMIENTO" | "ACTIVA" | "MONITOREO"
  | "ACTUALIZACION" | "EJECUCION" | "LIBERACION" | "CIERRE" | "ANULADA";

export interface GarantiaResumen {
  id: string;
  codigo: string;
  tipo: string;
  clienteDocumento: string;
  clienteNombre: string;
  producto: string;
  segmento: string;
  macroestado: Macroestado;
  estadoJuridico: string;
  estadoDocumental: string;
  idoneidad: string;
  idoneidadMotivo: string | null;
  moneda: string;
  valorComercial: number | null;
  valorAdmisible: number | null;
  valorNeto: number | null;
  fechaUltimaValoracion: string | null;
  fechaProximaValoracion: string | null;
  perfeccionada: boolean;
  fuente: string;
  aplicativoOrigen: string | null;
  referenciaExterna: string | null;
  createdAt: string;
  updatedAt: string;
  cobertura?: { obligaciones: number; ratioMinimo: number | null; exposicion: number | null; brecha: number | null } | null;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface Alerta {
  codigo: string;
  criticidad: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
  categoria: string;
  titulo: string;
  detalle: string | null;
  garantia: string | null;
  obligacion: string | null;
  cliente: string | null;
  fecha: string | null;
  origen: string;
}

export interface Indicador {
  codigo: string;
  nombre: string;
  valor: number;
  unidad: "COP" | "CONTEO" | "PORCENTAJE" | "PUNTOS";
  formula: string;
  detalle: string | null;
}

export interface CoberturaVigente {
  obligacionId: string;
  calculoId: string;
  exposicion: number;
  coberturaObjetivo: number;
  requerido: number;
  asignado: number;
  asignadoIdoneo: number;
  ratio: number | null;
  ratioIdoneo: number | null;
  descubierto: number;
  brecha: number;
  estado: string;
  actualizadoEn: string;
}

export interface PasoTraza {
  orden: number;
  ambito: "GARANTIA" | "OBLIGACION" | "ASIGNACION";
  garantiaId: string | null;
  obligacionId: string | null;
  descripcion: string;
  formula: string;
  resultado: string | null;
  regla: string | null;
}

export interface ResultadoGarantia {
  id: string;
  codigo: string;
  estado: string;
  motivo: string | null;
  idonea: boolean;
  exclusiva: boolean;
  valorBruto: number;
  haircut: number | null;
  valorAdmisible: number;
  gravamenes: number;
  valorNeto: number;
  utilizado: number;
  disponible: number;
}

export interface ResultadoObligacion {
  id: string;
  numero: string;
  estado: string;
  motivo: string | null;
  exposicion: number;
  coberturaObjetivo: number;
  requerido: number;
  asignado: number;
  asignadoIdoneo: number;
  ratio: number | null;
  ratioIdoneo: number | null;
  descubierto: number;
  brecha: number;
}

export interface Calculo {
  id: string;
  fechaCorte: string;
  disparador: string;
  correlationId: string;
  estado: string;
  hashEntradas: string;
  hashResultado: string;
  reglas: Record<string, { regla: string; version: number; hash: string }>;
  creadoPor: string;
  resultado: {
    estado: string;
    garantias: ResultadoGarantia[];
    obligaciones: ResultadoObligacion[];
    asignaciones: { orden: number; garantiaId: string; obligacionId: string; valor: number; fase: string }[];
    traza: PasoTraza[];
  };
}

export interface RegistroAuditoria {
  id: number;
  ocurridoEn: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string;
  antes: unknown;
  despues: unknown;
  motivo: string | null;
  origen: string;
  correlationId: string | null;
  hashAnterior: string;
  hash: string;
}

export interface ReglaVersion {
  id: string;
  reglaId: string;
  numero: number;
  estado: "BORRADOR" | "EN_REVISION" | "APROBADA" | "ACTIVA" | "INACTIVA" | "REEMPLAZADA" | "RECHAZADA";
  definicion: TablaDecision;
  casosPrueba: { nombre: string; entradas: Record<string, unknown>; esperado: string }[];
  creadoPor: string;
  aprobadoPor: string | null;
  motivo: string | null;
  hash: string | null;
  createdAt: string;
  enviadaEn: string | null;
  aprobadaEn: string | null;
  activadaEn: string | null;
}

export interface TablaDecision {
  filas: { condiciones: Record<string, string>; salida: { valor: string; motivo: string | null } }[];
  porDefecto: { valor: string; motivo: string | null } | null;
}
