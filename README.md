# NORBOT Group · CRM

CRM de gestión de redes sociales para **NORBOT Group**, hecho por **Istmo Marketing PA**.
Panel general, pipeline de leads con drag & drop, embudo, pautas de Meta Ads, páginas por
cuenta, reportes imprimibles e importación de datos por CSV con fusión por cuenta.

**Stack:** Next.js 16 (App Router, TypeScript) · Supabase (Postgres + Auth) · desplegable en Vercel.

---

## Requisitos

- Node.js 20+ (probado con Node 24).
- Un proyecto de Supabase con las tablas `cuentas`, `leads`, `campanas`, `metricas`, `posts`.

## Variables de entorno

Crea un archivo `.env.local` en la raíz (usa `.env.example` como plantilla). **No se sube al repo.**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

- Las dos `NEXT_PUBLIC_*` son seguras para el navegador.
- `SUPABASE_SERVICE_ROLE_KEY` es **secreta**: solo se usa en el servidor (Server Actions y el
  script de seed). Nunca se incluye en el bundle del cliente.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Seed de datos demo

Reescribe (limpia + inserta) las tablas con los datos demo de `lib/data.ts`. Usa la
`service_role` key del `.env.local`. Es idempotente (puedes correrlo cuantas veces quieras).

```bash
npm run seed
```

> El comando es `node --env-file=.env.local --import tsx scripts/seed.ts`. La service_role key
> se lee del `.env.local`; nunca se pasa por la línea de comandos ni se versiona.

Salida esperada:

```
✓ Seed completado. Filas por tabla:
   cuentas   3
   leads     40
   campanas  10
   metricas  18
   posts     9
```

> También puedes reescribir los datos demo desde la propia app: en cualquier página de cuenta,
> **Importar datos → Restaurar demo**.

## Autenticación

Todas las rutas están protegidas (`proxy.ts`). Sin sesión, se redirige a `/login`.

- Login con correo y contraseña (Supabase Auth).
- No hay registro público: los usuarios se crean desde el **dashboard de Supabase**
  (Authentication → Users) o con la API admin.
- El botón **Cerrar sesión** está al pie de la barra lateral.

## Despliegue en Vercel

1. Conecta el repo de GitHub en Vercel.
2. Define las tres variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en el proyecto de Vercel.
3. Deploy. (El seed se corre localmente con `npm run seed`, no en el build.)

## Estructura

```
app/            Rutas (página principal, /login, Server Actions, layout)
components/     UI (sidebar, KPIs, gráficas, modales, páginas de cada vista)
lib/            data (semilla), csv (parsers/import), format, mappers, tipos
lib/supabase/   clientes server/browser (@supabase/ssr) y admin (service_role)
scripts/seed.ts Script de seed
proxy.ts        Protección de rutas (auth)
reference/      Artefacto original de referencia (diseño)
```
