# Manual de marca aplicado — Garantías 360
## Banco Popular S.A. · Sistema visual para aplicaciones internas

| Campo | Valor |
|---|---|
| Versión | 0.1 — **Derivado, no oficial** |
| Fecha | 2026-09-25 |
| Fuentes | Código HTML/CSS de dos páginas públicas del Banco, guardadas el 25/09/2026: el **Portal Bancario** (`mi.bancopopular.com.co/login`, versión v5.1.3) y la página de producto **Cuenta Plateada** (`www.bancopopular.com.co`). |
| Tokens listos para usar | [`tokens.css`](tokens.css) · [`tailwind-preset.ts`](tailwind-preset.ts) |

> ⚠️ **Alcance y validez.**
> - Este manual se reconstruyó a partir del código de los sitios públicos del Banco. No reemplaza el **manual de identidad corporativa oficial** (P-19 de la especificación).
> - Cuando Mercadeo lo entregue, este documento se ajusta a ese manual.
> - El uso de la marca en Garantías 360 debe estar autorizado por el Banco.
> - Los valores marcados como **[Portal]** se tomaron del Portal Bancario, que ya es una aplicación transaccional y por eso es la referencia principal. Los marcados como **[Público]** vienen del sitio comercial.
> - Los marcados como **[G360]** son adaptaciones propias, necesarias para una aplicación empresarial densa y accesible.

---

## 1. Principios de la marca en Garantías 360

1. **Institucional antes que promocional.** El Portal Bancario usa el verde petróleo como color dominante y reserva el naranja para acciones secundarias y enlaces. Garantías 360 sigue esa jerarquía: sobriedad, confianza y datos al frente.
2. **Claridad operativa.** La tipografía es Inter en tamaños contenidos (12–18 px) y la densidad es alta, igual que en el Portal. Los usuarios son profesionales que trabajan con tablas y expedientes durante horas.
3. **Cercanía en el tono.** El Banco tutea y habla en positivo ("Bienvenido a", "Ayúdanos a protegerte", "¿Cómo podemos ayudarte?"). En Garantías 360 el tono es **cercano pero preciso**: tutear está bien; ser ambiguo, no.
4. **Accesibilidad obligatoria.** Garantías 360 exige WCAG 2.1 AA (RNF-11). Algunos colores del sitio público **no alcanzan el contraste mínimo como texto**. Para esos casos este manual define variantes accesibles (sección 3.4).

---

## 2. Logotipo

| Pieza | Archivo en el sitio | Uso en Garantías 360 |
|---|---|---|
| Logotipo horizontal (positivo) | `popularhorizontal_new.svg` **[Portal]** | Encabezado de la aplicación sobre fondo blanco. |
| Logotipo horizontal (negativo, blanco) | `popularhorizontalwhite_new.svg` **[Portal]** · `bp-logos-blanco.png` **[Público]** | Sobre verde petróleo (pantalla de ingreso, paneles oscuros). |
| Isotipo blanco-verde | `bp-isotipo-blanco-verde.png` **[Público]** | Barra lateral colapsada, favicon, espacios reducidos. |
| Sello Grupo Aval | `Isotipo.svg`, `aval.png` **[Portal]** | Pie de página, **solo si la política corporativa lo exige**. Es marca del Grupo Aval, no del Banco. |

**Pendiente:** los archivos SVG y PNG están en las carpetas `Banco Popular_files` y `Cuenta Plateada_files` del equipo que guardó las páginas y no se subieron. Hay que subirlos a `public/marca/` o, mejor, pedir los originales vectoriales a Mercadeo.

**Reglas de uso (mientras llega el manual oficial):**
- No deformar, recolorear, rotar ni aplicar sombras o efectos al logotipo.
- **Área de protección:** como mínimo, la altura de la letra "P" del logotipo alrededor de él **[G360]**.
- **Tamaño mínimo** del horizontal: 120 px de ancho en pantalla **[G360]**.
- Nombre del producto junto al logo: *Garantías 360* en Inter 600, color `--bp-ink-900`, separado del logotipo por un divisor vertical de 1 px `--bp-gray-300`.

---

## 3. Color

### 3.1 Colores institucionales

| Token | Hex | Nombre | Uso observado | Fuente |
|---|---|---|---|---|
| `--bp-primary-700` | `#105163` | **Verde petróleo Popular** | Color primario: botones principales, encabezados, anillo de foco, fondos institucionales. Declarado como `--primary-color` en el sitio público. | [Portal] [Público] |
| `--bp-primary-900` | `#0B3642` | Petróleo profundo | Botón primario presionado o cargando, texto sobre fondos claros de marca. | [Portal] |
| `--bp-primary-600` | `#26737F` | Petróleo claro | Degradado de *hover* del botón primario (`linear-gradient(to top, #26737F, #105163)`). | [Portal] |
| `--bp-primary-300` | `#87A8B1` | Petróleo grisáceo | Botón secundario presionado. | [Portal] |
| `--bp-primary-100` | `#CFDCE0` | Petróleo pálido | *Hover* del botón secundario, fondos seleccionados. | [Portal] |
| `--bp-accent-500` | `#FE680D` | **Naranja Popular** | Enlaces, acciones de texto, íconos de producto, resaltados. | [Portal] |
| `--bp-accent-400` | `#F99B35` | Naranja claro | *Hover* de enlaces; también estado de advertencia (`--fourth-color`). | [Portal] [Público] |
| `--bp-green-500` | `#27C112` | **Verde Popular** | Éxito, selección, interruptores activos, indicador de carrusel. En el sitio público figura como `--secondary-color: #21C112`. | [Portal] [Público] |
| `--bp-green-600` | `#21A10F` | Verde oscuro | Acción de texto secundaria, íconos de cerrar, barras de desplazamiento. | [Portal] |

### 3.2 Estados (semánticos)

| Estado | Borde / ícono | Fondo | Fuente |
|---|---|---|---|
| Éxito | `#27C112` | `#D4F3D0` | [Portal] |
| Advertencia | `#F99B35` | `#FEEBD7` | [Portal] |
| Error | `#F93538` | `#FED7D7` (entradas: 32 % de opacidad) | [Portal] |
| Información | `#3263A4` | `#E8EFF8` **[G360]** | [Portal] (azul presente en el sitio) |

### 3.3 Neutros

| Token | Hex | Uso | Fuente |
|---|---|---|---|
| `--bp-ink-900` | `#121212` | Títulos | [Portal] |
| `--bp-ink-800` | `#2D2D2D` | Texto principal | [Portal] [Público] |
| `--bp-ink-700` | `#434343` | Texto de tablas y datos | [Portal] |
| `--bp-ink-600` | `#555555` | Texto secundario | [Portal] |
| `--bp-ink-500` | `#7B7B7B` | Texto de apoyo, pie de página (solo ≥ 14 px, contraste 4,23:1) | [Portal] |
| `--bp-gray-400` | `#9D9D9D` | Íconos inactivos | [Portal] |
| `--bp-gray-300` | `#C6C6C6` | Bordes de entradas, botón deshabilitado | [Portal] |
| `--bp-gray-200` | `#E4E4E4` | Divisores, bordes de tarjetas | [Portal] |
| `--bp-gray-100` | `#F2F2F2` | Fondos de sección | [Público] |
| `--bp-gray-50` | `#F5F5F5` | Fila seleccionada, opción activa | [Portal] |
| `--bp-canvas` | `#F6F7FB` | Fondo general de la aplicación | [Portal] [Público] |
| `--bp-white` | `#FFFFFF` | Tarjetas, paneles, tablas | [Portal] |

### 3.4 Contraste y variantes accesibles [G360]

Contraste medido sobre blanco; las variantes [G360] también se verificaron sobre los fondos de estado y los grises de fondo (WCAG 2.1: texto normal ≥ 4,5:1; texto grande o elementos gráficos ≥ 3:1):

| Color | Contraste | ¿Texto normal? | Regla en Garantías 360 |
|---|---|---|---|
| `#105163` petróleo | 8,83:1 | ✅ | Libre. |
| `#0B3642` petróleo profundo | 12,96:1 | ✅ | Libre. |
| `#FE680D` naranja | **2,92:1** | ❌ | Solo en íconos, bordes y fondos. **Para enlaces y texto usar `--bp-accent-700` `#B34808` (5,46:1; ≥ 5:1 también sobre los grises de fondo).** |
| `#F99B35` naranja claro | **2,15:1** | ❌ | Solo en bordes y fondos de advertencia, siempre con ícono. |
| `#27C112` verde | **2,41:1** | ❌ | Solo en íconos y rellenos. **Para texto de éxito usar `--bp-green-700` `#16700A` (6,26:1; 5,22:1 sobre fondo de éxito).** |
| `#21A10F` verde oscuro | 3,40:1 | ⚠️ solo ≥ 18,66 px en negrita o ≥ 24 px | Texto grande o íconos. |
| `#F93538` rojo | 3,75:1 | ⚠️ | Para texto de error usar `--bp-red-700` `#B01B1A` (6,96:1; 5,27:1 sobre fondo de error). |
| `#3263A4` azul | 6,08:1 | ✅ | Libre. |
| Blanco sobre `#105163` | 8,83:1 | ✅ | Texto de botones primarios y encabezados. |

**Regla:** el color nunca es el único portador de significado. Todo estado lleva además ícono y texto.

### 3.5 Proporción de uso
Aproximación observada en el Portal y recomendada para Garantías 360:
- **70 %** neutros (blanco, `#F6F7FB`, grises);
- **20 %** verde petróleo (barra lateral, encabezados de tarjeta, botones primarios);
- **7 %** naranja (enlaces, acentos);
- **3 %** verde y estados.

---

## 4. Tipografía

| Rol | Familia | Fuente |
|---|---|---|
| **Principal (interfaz)** | **Inter** (400, 500, 600, 700). Disponible en Google Fonts. | [Portal] — familia dominante en botones, etiquetas, títulos y formularios. |
| Alternativa del sitio comercial | `Helvetica Neue, Inter, ui-sans-serif, system-ui` | [Público] |
| Numérica en tablas **[G360]** | Inter con `font-variant-numeric: tabular-nums` | Alinea montos y porcentajes. |

> El sitio comercial carga también *Satoshi* (ventanas emergentes) y *Poppins* (componente del Grupo Aval). **No forman parte de la identidad del Banco en el Portal** y no se usan en Garantías 360.

**Escala tipográfica** (derivada de los tamaños del Portal: 11, 12, 13, 14, 16, 18, 24 px):

| Token | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `display` **[G360]** | 32 / 40 | 700 | Cifra principal de un indicador (KPI). |
| `h1` | 24 / 32 | 700 | Título de página. |
| `h2` | 18 / 28 | 700 | Título de sección, título de ingreso (Portal: 18 px negrita). |
| `h3` | 16 / 24 | 600 | Título de tarjeta, de modal y de panel. |
| `body` | 14 / 20 | 400 | Texto general, celdas de tabla, botones (600–700). |
| `small` | 12 / 17 | 500 | Etiquetas de formulario (Portal: 12 px / 500), metadatos. |
| `caption` | 11 / 16 | 400 | Pie de página, notas, versión. |

Pesos: **600** para énfasis y acciones de texto; **700** para botones y títulos; **500** para etiquetas. Es la distribución observada en el Portal.

---

## 5. Espaciado, radios y elevación

| Elemento | Valor | Fuente |
|---|---|---|
| Unidad base | 4 px (escala 4, 8, 12, 16, 24, 32, 48) | [G360] (el Portal usa múltiplos de 4) |
| Radio de botones y entradas | **8 px** | [Portal] |
| Radio de tarjetas y contenedores | **12 px** | [Portal] |
| Radio de chips y etiquetas | 4 px; píldora 200 px | [Portal] |
| Radio de toasts | 10 px | [Portal] |
| Sombra de tarjeta | `0 2px 4px 0 rgba(35, 46, 36, 0.12)` | [Portal] |
| Sombra de elementos flotantes | `0 6px 12px rgba(0, 0, 0, 0.15)` | [Portal] |
| Sombra de modal | `0 16px 24px 0 rgba(0, 0, 0, 0.14)` | [Portal] |

---

## 6. Componentes

### 6.1 Botones [Portal]
| Variante | Reposo | Hover | Presionado / cargando |
|---|---|---|---|
| **Primario** | fondo `#105163`, texto blanco | degradado `#26737F → #105163` | fondo `#0B3642` |
| **Secundario** | fondo blanco, borde 1 px `#105163`, texto `#105163` | fondo `#CFDCE0`, borde y texto `#0B3642` | fondo `#87A8B1`, texto `#0B3642` |
| **Deshabilitado** | fondo `#C6C6C6`, texto blanco (los elementos deshabilitados están exentos del contraste WCAG, pero se acompañan de un *tooltip* que explica por qué están bloqueados **[G360]**) | — | — |
| **Texto / enlace** | `#B34808` **[G360]** (en el Portal, `#FE680D`), 600, subrayado | `#FE680D` | — |
| **Peligro** **[G360]** | fondo `#B01B1A`, texto blanco | `#8F1615` | — |

- **Medidas:** alto 48 px (40 px en la variante compacta **[G360]** para tablas y barras de herramientas), padding 14 × 32 px, Inter 14 px 700, radio 8 px, transición de 0,3 s.
- **Foco visible:** `outline: 2px solid #105163; outline-offset: 2px; box-shadow: 0 0 0 3px rgba(16, 81, 99, 0.15)`.

### 6.2 Campos de formulario [Portal]
- **Entrada:** alto 48 px (40 px en compacto **[G360]**), padding 10 × 12 px, radio 8 px, borde 1 px `#C6C6C6`, cursor de texto `#105163`, texto 14 px.
- **Etiqueta:** 12 px / 500, color `#000000` (en Garantías 360, `--bp-ink-800`). Campo obligatorio: asterisco `#F93538`.
- **Error:** borde `#F93538`, fondo `rgba(254, 215, 215, 0.32)`, mensaje en `--bp-red-700`.
- **Advertencia:** borde `#F99B35`, fondo `rgba(254, 235, 215, 0.32)`.
- **Desplegables:** la opción seleccionada lleva fondo `#F5F5F5`, peso 600 y texto verde (en Garantías 360, `--bp-green-700`); flecha en naranja.

### 6.3 Estructura de la aplicación [G360, sobre patrones del Portal]
- **Barra lateral:** fondo `#105163`, texto e íconos blancos (70 % de opacidad en reposo, 100 % activos). El ítem activo lleva fondo `#0B3642` y un indicador izquierdo de 4 px en naranja `#FE680D`, retomando el acento del Portal.
- **Encabezado:** blanco, 64 px de alto, borde inferior `#E4E4E4`, con logotipo, nombre del producto, buscador global, notificaciones y usuario. **Franja institucional:** borde superior de 4 px `#105163` (el Portal usa 10 px en su navegación, `.green-line`).
- **Migas de pan:** 12 px, `--bp-ink-600`; el nivel actual en `--bp-ink-900`.
- **Tarjetas:** blancas, radio 12 px, sombra de tarjeta, padding 24 px, título h3.
- **Tarjetas de indicador (KPI):** etiqueta en `small`, cifra en `display` con números tabulares, variación con ícono ▲▼ y texto, y enlace "Ver cálculo" (explicabilidad).
- **Tablas:** encabezado 12 px / 600 sobre `#F5F5F5`; filas de 44 px (32 px en modo denso); divisores `#E4E4E4`; *hover* `#F6F7FB`; fila seleccionada `#CFDCE0` a 40 %; montos alineados a la derecha con números tabulares.
- **Estados (badges):** píldoras de 12 px / 600 con ícono y el fondo del estado:

| Estado de la garantía | Estilo |
|---|---|
| Idónea / Activa / Perfeccionada | Éxito (`#D4F3D0`, texto `#16700A`) |
| Condicionada / Por vencer / En estudio | Advertencia (`#FEEBD7`, texto `#8A4A00` **[G360]**) |
| No idónea / Vencida / Rechazada / Brecha crítica | Error (`#FED7D7`, texto `#B01B1A`) |
| En trámite / Informativo | Información (`#E8EFF8`, texto `#3263A4`) |
| Liberada / Cerrada / Anulada | Neutro (`#F2F2F2`, texto `#555555`) |

- **Toasts:** radio 10 px, borde del color del estado, sombra flotante, abajo a la derecha, ancho máximo 390 px **[Portal]**.
- **Modales y paneles laterales:** título 16 px / 600 **[Portal]**, radio 12 px, sombra de modal, fondo de superposición `rgba(22, 23, 24, 0.35)` **[Público]**.

### 6.4 Iconografía
- El Portal usa íconos de línea de 24 px coloreados por máscara (`mask`), p. ej. `24-payments-finance-piggy-bank`, `24-essential-delete`. Es un estilo de línea redondeada de trazo uniforme.
- **[G360]:** usar un set de línea equivalente (p. ej., *Lucide*, que ya es el de shadcn/ui) con trazo de 1,5–2 px, a 16, 20 o 24 px, coloreado con tokens de texto o de estado. No mezclar íconos rellenos con íconos de línea.

---

## 7. Visualización de datos [G360]

La marca aporta los colores. El método (formas, marcas, interacción) sigue la guía de visualización del proyecto. **La paleta categórica se validó con el validador de paletas**: pasa las seis verificaciones en modo claro y oscuro (banda de luminosidad, croma, separación para daltonismo, separación normal y contraste).

| Orden | Hex | Relación con la marca |
|---|---|---|
| 1 | `#00879B` | Petróleo Popular, aclarado para gráficas |
| 2 | `#E8620C` | Naranja Popular |
| 3 | `#4E7FD0` | Azul de información |
| 4 | `#3AA64A` | Verde Popular |
| 5 | `#B86BC9` | Violeta de apoyo |
| 6 | `#8C6A00` | Ocre de apoyo |

- **Por qué no se usa `#105163` en gráficas:** es demasiado oscuro y poco saturado para la banda de lectura de gráficas (se confunde con gris). Se reserva para la interfaz.
- **Reglas:**
  - Los colores se asignan **siempre en este orden** y nunca se reciclan. Más de 6 series se agrupan en "Otros" o se dividen en gráficos pequeños.
  - El color sigue a la entidad, no a su posición: por ejemplo, "Hipoteca" conserva el mismo color en todos los tableros.
  - Con 2 o más series siempre hay leyenda, más etiquetas directas si son 4 o menos.
  - El par Naranja ↔ Petróleo tiene separación tritan de 6,0: es legal solo con leyenda o etiquetas, que ya son obligatorias.
- **Secuencial** (magnitud, p. ej. un mapa de calor de cobertura): un solo tono de petróleo, de `#CFDCE0` a `#0B3642`.
- **Divergente** (p. ej., cobertura frente a objetivo): `#B34808` (bajo el objetivo) → gris `#E4E4E4` (en el objetivo) → `#00879B` (sobre el objetivo).
- **Estados en gráficas:** solo los de la sección 3.2, con ícono y etiqueta. Nunca se usan como "serie 4".

---

## 8. Imagen y tono

**Fotografía [Público]:**
- personas reales en situaciones cotidianas y positivas: parejas, adultos mayores, familias, trabajadores con su tarjeta o su portátil;
- luz natural y ambientes cálidos.
- **En Garantías 360** la fotografía se limita a la pantalla de ingreso y a los estados vacíos. Las pantallas de trabajo no llevan imágenes decorativas.

**Ilustración [Portal]:** personajes planos (series `Woman-*.svg`) en los carruseles de la pantalla de ingreso. Se pueden usar en estados vacíos y en la bienvenida.

**Voz y tono [Portal] [Público]:**

| Atributo | Así sí | Así no |
|---|---|---|
| Cercano, en segunda persona (tú) | "Revisa los documentos pendientes de esta garantía." | "Se requiere que el usuario revise…" |
| Claro y directo | "Esta garantía no se puede liberar: tiene 2 obligaciones activas en Flexcube." | "Error 409: conflicto de estado." |
| Positivo y orientado a la acción | "Ayúdanos a completar el expediente" (Portal: "Ayúdanos a protegerte") | "Expediente inválido." |
| Preciso con cifras | "Cobertura 86,67 % — faltan $20.000.000 para el objetivo." | "Cobertura baja." |

- **Mensajes de sistema:** qué pasó, por qué y qué hacer. Siempre en español de Colombia.
- **Formatos:** montos `$ 1.234.567` (COP, sin decimales), porcentajes `86,67 %`, fechas `25/09/2026`, horas `11:50 a. m.` (formato del Portal).
- **Lema institucional observado:** *"El banco para el mejor momento de la vida"* [Público]. No se usa dentro de Garantías 360, que es una herramienta interna.

---

## 9. Accesibilidad [Portal + G360]
- El Portal ya implementa **foco visible**, controles **A− / A+** de tamaño de texto e **ícono de contraste** [Público]. Garantías 360 mantiene el foco visible con el estilo del Portal y soporta zoom del 200 % sin pérdida de contenido.
- Contraste AA con las variantes de la sección 3.4.
- Navegación completa por teclado y atributos ARIA en tablas, paneles y modales.
- Los estados nunca se comunican solo con color.

---

## 10. Pendientes
1. **Manual oficial de identidad** de Banco Popular (Mercadeo) y **archivos vectoriales del logotipo**.
2. **Autorización** del uso de la marca en Garantías 360.
3. Validar con Mercadeo las adaptaciones **[G360]**, en especial las variantes accesibles del naranja y del verde y la paleta de gráficas.
4. Confirmar si existe un **sistema de diseño corporativo** para aplicaciones internas (el Portal usa PrimeNG con un tema propio).
