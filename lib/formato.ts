const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const compacto = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });
const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

type Num = number | string | null | undefined;

const valor = (n: Num) => (n === null || n === undefined || n === "" ? null : Number(n));

export const cop = (n: Num) => (valor(n) === null ? "—" : pesos.format(valor(n)!));
export const copCompacto = (n: Num) => (valor(n) === null ? "—" : `$\u00A0${compacto.format(valor(n)!).replace(/ /g, "\u00A0")}`);
export const entero = (n: Num) => (valor(n) === null ? "—" : numero.format(valor(n)!));

/** Ratio (0,866667) → "86,67 %". */
export const porcentaje = (ratio: Num, decimales = 2) =>
  valor(ratio) === null
    ? "—"
    : `${(valor(ratio)! * 100).toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;

/** Valor que ya viene en puntos porcentuales (75,67) → "75,67 %". */
export const puntos = (n: Num, decimales = 1) =>
  valor(n) === null ? "—" : `${valor(n)!.toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;

export const fecha = (f: string | null | undefined) =>
  f ? new Date(f.length === 10 ? `${f}T12:00:00` : f).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fechaHora = (f: string | null | undefined) =>
  f
    ? new Date(f).toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

/** Fecha de hoy (AAAA-MM-DD) en America/Bogota, no en UTC. */
export const hoyLocal = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

export const mes = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-CO", { month: "short", year: "2-digit" });

/** Etiquetas en español para los códigos del dominio (los códigos no llevan tildes). */
const ETIQUETAS: Record<string, string> = {
  ESTUDIO_JURIDICO: "Estudio jurídico", CONSTITUCION: "Constitución", ACTUALIZACION: "Actualización", EJECUCION: "Ejecución",
  LIBERACION: "Liberación", IDONEA: "Idónea", NO_IDONEA: "No idónea", NO_EVALUADA: "No evaluada", VEHICULO: "Vehículo",
  HIPOTECARIO_VIVIENDA: "Hipotecario vivienda", LIBRANZA: "Libranza", TARJETA_CREDITO: "Tarjeta de crédito",
  CAPITAL_TRABAJO: "Capital de trabajo", LIBRE_INVERSION: "Libre inversión", BANCA_EMPRESAS: "Banca Empresas", PERSONAS: "Personas",
  CRITICA: "Crítica", SIN_ESTUDIO: "Sin estudio", CON_OBSERVACIONES: "Con observaciones", REAL_INMUEBLE: "Real inmueble",
  FONDO_GARANTIAS: "Fondo de garantías", FIDUCIARIA: "Fiduciaria", DEPOSITO: "Depósito", MOBILIARIA: "Mobiliaria",
  DERECHO_ECONOMICO: "Derecho económico", AVALUO_COMERCIAL: "Avalúo comercial", AVALUO_CATASTRAL: "Avalúo catastral",
  GUIA_FASECOLDA: "Guía Fasecolda", INDICE: "Índice", SALDO_CERTIFICADO: "Saldo certificado", VALOR_CONTRATO: "Valor del contrato",
  API_PRODUCTO: "API de producto", EN_REVISION: "En revisión", EN_RIESGO: "En riesgo", CUMPLE: "Cumple", BRECHA: "Brecha",
  CREAR_GARANTIA: "Creación de la garantía", CAMBIAR_ESTADO: "Cambio de estado", ESTUDIO: "Estudio", VALORAR: "Valoración",
  PERFECCIONAR: "Perfeccionamiento", CALCULAR_COBERTURA: "Cálculo de cobertura", VINCULAR_OBLIGACION: "Vinculación de obligación",
  DESVINCULAR_OBLIGACION: "Desvinculación de obligación", REEVALUAR_IDONEIDAD: "Reevaluación de idoneidad",
  CREAR_REGLA: "Creación de la regla", EDITAR_REGLA: "Edición de la regla", ENVIAR_REGLA: "Envío a aprobación",
  APROBAR_REGLA: "Aprobación", RECHAZAR_REGLA: "Rechazo", ACTIVAR_REGLA: "Activación", DESACTIVAR_REGLA: "Desactivación",
  NUEVA_VERSION_REGLA: "Nueva versión", CREAR_TIPO_GARANTIA: "Creación del tipo de garantía",
  OBLIGACIONDESEMBOLSADA: "Desembolso (Flexcube)", OBLIGACIONCANCELADA: "Cancelación (Flexcube)", MORAACTUALIZADA: "Mora actualizada (Flexcube)",
  SALDOOBLIGACIONACTUALIZADO: "Saldo actualizado (Flexcube)", OBLIGACIONCASTIGADA: "Castigo (Flexcube)",
  EVENTO_PUBLICADO: "Evento publicado", EVENTO_RECIBIDO: "Evento recibido", CALCULO_COBERTURA: "Cálculo de cobertura", AUDITORIA: "Auditoría",
  NUMERO: "Número", FRACCION: "Fracción", DECIMAL_NO_NEGATIVO: "Decimal no negativo", METODO: "Método", BOOLEANO: "Booleano",
  CARGA_INICIAL_DEMO: "Carga inicial (demo)", CAMBIO_GARANTIA: "Cambio en la garantía", RECALCULO_MANUAL: "Recálculo manual",
  // Incremento 2: tipos, constitución, carga masiva y seguridad.
  NUEVA_VERSION_TIPO: "Nueva versión del tipo", EDITAR_TIPO_GARANTIA: "Edición del tipo", ENVIAR_TIPO_GARANTIA: "Envío a aprobación",
  PUBLICAR_TIPO_GARANTIA: "Publicación (aprobada)", RECHAZAR_TIPO_GARANTIA: "Rechazo", DESCARTAR_VERSION_TIPO: "Borrador descartado",
  INACTIVAR_TIPO_GARANTIA: "Inactivación del tipo", REACTIVAR_TIPO_GARANTIA: "Reactivación del tipo",
  GENERAR_PLAN_CONSTITUCION: "Plan de constitución generado", ACTIVIDAD_CONSTITUCION: "Avance de constitución",
  ACTUALIZAR_GARANTIA: "Actualización de datos", CREAR_CARGA_MASIVA: "Carga masiva validada", ENVIAR_CARGA_MASIVA: "Carga enviada a aprobación",
  APROBAR_CARGA_MASIVA: "Carga aprobada", RECHAZAR_CARGA_MASIVA: "Carga rechazada", CANCELAR_CARGA_MASIVA: "Carga cancelada",
  PROCESAR_CARGA_MASIVA: "Carga procesada", CREAR_USUARIO: "Alta de usuario", EDITAR_USUARIO: "Cambio de usuario",
  INACTIVAR_USUARIO: "Inactivación de usuario", ACTIVAR_USUARIO: "Activación de usuario", CREAR_PERFIL: "Alta de perfil", EDITAR_PERFIL: "Cambio de perfil",
  BORRADOR: "Borrador", PUBLICADA: "Publicada", REEMPLAZADA: "Reemplazada", RECHAZADA: "Rechazada", EN_CURSO: "En curso",
  COMPLETADA: "Completada", BLOQUEADA: "Bloqueada", NO_APLICA: "No aplica", PENDIENTE: "Pendiente", VALIDADA: "Validada",
  CON_ERRORES: "Con errores", EN_APROBACION: "En aprobación", EN_PROCESO: "En proceso", PROCESADA: "Procesada",
  PROCESADA_CON_FALLOS: "Procesada con fallos", CANCELADA: "Cancelada", VALIDA: "Válida", OMITIDA: "Omitida", FALLIDA: "Fallida",
  CARGA_MASIVA: "Carga masiva", MANUAL: "Captura manual", TEXTO_LARGO: "Texto largo", MONEDA: "Moneda", FECHA: "Fecha",
  LISTA: "Lista", LISTA_MULTIPLE: "Selección múltiple", TEXTO: "Texto", OPERACIONES_GESTOR: "Gestor de operaciones",
  OPERACIONES_DIRECTOR: "Director de operaciones", JURIDICA_GESTOR: "Gestor jurídico", JURIDICA_DIRECTOR: "Director jurídico",
  RIESGOS_GESTOR: "Gestor de riesgos", APROBADOR_REGLAS: "Aprobador de reglas", ADMIN_FUNCIONAL: "Administrador funcional",
  ADMIN_SEGURIDAD: "Administrador de seguridad", CAMARA_COMERCIO: "Cámara de Comercio", ORIP: "ORIP", RGM: "RGM", RUNT: "RUNT",
  FNA: "FNA", FNG: "FNG", FAG: "FAG",
};

export const humano = (codigo: string | null | undefined): string => {
  if (!codigo) return "—";
  if (ETIQUETAS[codigo]) return ETIQUETAS[codigo];
  if (codigo.startsWith("FLEXCUBE ")) return `Flexcube: ${humano(codigo.slice(9).toUpperCase())}`;
  const t = codigo.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const cn = (...clases: (string | false | null | undefined)[]) => clases.filter(Boolean).join(" ");
