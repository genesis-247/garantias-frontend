# Garantías 360 — Frontend

Interfaz web de Garantías 360 (Banco Popular): centro de mando, registro maestro y Expediente 360, cobertura explicable, motor de reglas con maker–checker, monitoreo, core transaccional y auditoría.

**Stack:** Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS 3.4 con los tokens **Designio** del Banco (`styles/`) · TanStack Query · Recharts.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
npm run dev                       # http://localhost:3000
```

Requiere el backend (`garantias-backend`) corriendo con el perfil `demo`.

- **Identidad en local y demo:** el selector del encabezado lista los usuarios activos de la administración de usuarios y perfiles, con sus roles efectivos, y envía `X-Usuario`. Así se puede demostrar el maker–checker: Ana (Riesgos) crea una regla y Juan (Aprobador) la aprueba; Diego edita un tipo y Natalia lo publica; Pedro carga un archivo y Marcela lo aprueba.
- **Identidad en producción:** se reemplaza por el inicio de sesión con Entra ID (MSAL) y el token de acceso, y el selector no se muestra (`NEXT_PUBLIC_AUTH_MODO=entra`, pendiente de integrar).

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Desarrollo, compilación y servidor de producción (`output: standalone`) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |

## Estructura

| Carpeta | Contenido |
|---|---|
| `app/` | Una ruta por módulo del menú (M01–M16) |
| `components/ui/` | Botones, tarjetas, insignias, tablas, pestañas y paneles del sistema de diseño |
| `components/` | Componentes de dominio: explicación de cobertura, línea de auditoría, tablas |
| `lib/` | Cliente de API (Correlation ID, errores RFC 9457), formatos es-CO, tipos |
| `styles/` | Tokens Designio y preset de Tailwind (ver `docs/marca/MANUAL_DE_MARCA.md`) |
| `public/marca/` | Logotipos e íconos del Banco (uso sujeto a autorización) |

Los datos que muestra la aplicación en el perfil demo son **sintéticos**.
