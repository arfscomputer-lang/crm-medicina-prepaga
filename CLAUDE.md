# SeguroCRM — Contexto del Proyecto

## Descripción
CRM especializado para agentes de medicina prepaga (EBSA) en Paraguay. Gestiona clientes, planes, cotizaciones, comisiones, y comunicación multicanal (WhatsApp + Messenger). Arquitectura SaaS multi-tenant orientada a venta enterprise.

## Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **ORM**: Drizzle ORM + postgres driver
- **UI**: Lucide React + class-variance-authority
- **Deploy**: Netlify (`@netlify/plugin-nextjs`)
- **Mensajería**: WhatsApp Business API + Facebook Messenger API

## Estructura del proyecto
```
app/                    # Pages (App Router)
  page.tsx              # Dashboard principal (filtro agente + ranking)
  clientes/             # Gestión de clientes (export CSV)
  planes/               # Planes contratados
  catalogo/             # Catálogo de planes EBSA
  comisiones/           # Comisiones por agente (export CSV)
  actividades/          # Log de interacciones CRM
  whatsapp/             # Consola WhatsApp (conversaciones reales + Realtime)
  messenger/            # Consola Messenger
  campanas/             # Campañas masivas (segmentación + programación)
  reportes/             # 4 reportes predefinidos (export CSV)
  auditoria/            # Audit trail (filtros + diff before/after + export CSV)
  configuracion/        # Config de la organización
  login/                # Login email/password
  api/
    whatsapp/
      send-bulk/        # POST — envío masivo con template Meta
      send/             # POST — envío individual texto (nuevo)

components/
  Sidebar.tsx           # Navegación principal (con links condicionales por permiso)
  PermissionGuard.tsx   # Protección por permiso (+ RoleBadge)
  ProtectedRoute.tsx    # Protección de rutas autenticadas

lib/
  auth-context.tsx      # AuthProvider, useAuth, tipos User/Permissions
  supabase.ts           # Cliente Supabase + tipos + helpers + exportToCsv()
  whatsapp-api.ts       # SDK WhatsApp Business (sendTextMessage, sendTemplateMessage, sendBulkMessages)

supabase/migrations/    # 34 archivos SQL (001–034)
CHECKLIST.md            # Checklist de desarrollo por fase
```

## Base de datos (30 tablas)
Todas las tablas tienen `org_id` para multi-tenancy. RLS habilitado en todas.

| Tablas clave | Propósito |
|---|---|
| `organizations` | Tenants del sistema |
| `users` | Usuarios con 6 roles |
| `role_permissions` | 25+ flags booleanos por org+rol |
| `plan_catalog` | Planes EBSA (Sana/Confort/Excellent/Adultos Mayores) |
| `clients` + `beneficiaries` | Clientes y dependientes |
| `client_plans` + `quotations` | Planes contratados y cotizaciones |
| `payments` + `commissions` | Pagos y comisiones automáticas |
| `activities` | Log CRM de interacciones |
| `whatsapp_conversations` | Conversaciones WhatsApp activas |
| `whatsapp_messages` | Mensajes con status (pendiente/enviado/entregado/leído) |
| `whatsapp_templates` | Templates personalizables (fallback a defaults si vacía) |
| `messenger_*` | Mensajería Facebook Messenger |
| `campaigns` + `campaign_recipients` | Campañas masivas con métricas |
| `contact_tags` + `client_tag_assignments` | Tags personalizados para segmentación |
| `audit_log` | Trazabilidad completa — triggers activos en clients, client_plans, payments, users |
| `reminders` | Recordatorios automáticos de renovación |

## Autenticación y permisos
- **Auth**: Supabase Auth con email/password + Google OAuth (`loginWithGoogle` en `lib/auth-context.tsx`)
- **MFA**: TOTP implementado — `enrollMfa`, `verifyMfaLogin`, `unenrollMfa` en auth-context. UI en `components/MfaSetup.tsx`
- **Roles**: `superadmin`, `admin`, `supervisor`, `agente`, `asistente`, `auditor`
- **Permisos**: 35 flags cargados desde `role_permissions` al hacer login (`lib/auth-context.tsx`)
- **Guardia de UI**: `<PermissionGuard permission="can_xxx">` en componentes
- **Middleware**: `middleware.ts` usa `createServerClient` + `supabase.auth.getUser()` para validación real de JWT. Rutas públicas: `/login`, `/auth/callback`. API routes retornan 401, page routes redirigen a `/login`
- **Cliente Supabase**: `lib/supabase.ts` usa `createBrowserClient` de `@supabase/ssr` (sesión en cookies, no localStorage — permite que el middleware valide el JWT)
- **RLS**: todas las queries filtran automáticamente por `org_id` via Supabase. RLS re-habilitado en todas las tablas en migración 030
- **JWT Claims**: migración `029_jwt_claims_hook.sql` embebe `org_id` y `user_role` en el token
- **Funciones SECURITY DEFINER**: `get_user_org_id()`, `get_user_role()`, `user_has_permission()`, `handle_new_user()` tienen `SET search_path = public, auth`. `anon` no tiene EXECUTE. `authenticated` tiene EXECUTE solo en las 3 helpers (necesario para RLS)

## WhatsApp Business API
- **Número**: +595 991 380147 (`WHATSAPP_PHONE_NUMBER_ID=1062732140261273`)
- **Token**: configurado en `.env.local` — puede ser temporal (24hs) o permanente (System User)
- **Token permanente**: business.facebook.com → Usuarios del sistema → Generar token → scopes `whatsapp_business_messaging` + `whatsapp_business_management` → vencimiento "Nunca"
- **Ventana de 24hs**: `sendTextMessage()` lanza `WhatsAppWindowExpiredError` (error Meta 131047) → UI muestra aviso + link a wa.me. Fuera de ventana: usar templates HSM via `sendTemplateMessage()`
- **Webhook**: Edge Function `whatsapp-webhook` en Supabase maneja mensajes entrantes y status updates
- **Campaign executor**: Edge Function `campaign-executor` en Supabase (pg_cron cada minuto) ejecuta campañas programadas sin browser abierto
- **Proyecto Flutter relacionado**: `C:\proyectos\flutter_whatsapp` — misma DB Supabase, lógica de referencia para la API. Su `.env` tiene credenciales en git (⚠️ rotar si el repo es público)

## ⚠️ Pasos manuales pendientes en Supabase Dashboard

### 1. Google OAuth (pendiente)
- Dashboard → Authentication → Providers → Google → activar
- Pegar **Client ID** y **Client Secret** de Google Cloud Console
- URL de callback autorizada en Google Cloud: `https://xglldepizialsfgzuapr.supabase.co/auth/v1/callback`
- Dominio de producción en Netlify también debe estar en "Authorized redirect URIs"

### 2. JWT Claims Hook (pendiente)
- Correr migración `supabase/migrations/20260526000001_029_jwt_claims_hook.sql` en el SQL Editor
- Dashboard → Authentication → Auth Hooks → Custom Access Token → seleccionar `public.custom_access_token_hook`
- Verificar que `supabase_auth_admin` tiene EXECUTE grant (ya está en la migración)

### 3. MFA (pendiente)
- Dashboard → Authentication → Multi-Factor → habilitar **TOTP Multi-Factor Authentication**
- Sin este switch, `enrollMfa()` falla silenciosamente

### 4. Leaked Password Protection (requiere Pro plan)
- Dashboard → Authentication → Attack Protection → "Prevent use of leaked passwords"
- Solo disponible en plan Pro. Actualmente genera 1 warning en Security Advisor (aceptable en Free)

### 5. Token Meta permanente (standby)
- Generar System User token en business.facebook.com (no vence)
- Pegar en `.env.local` como `WHATSAPP_ACCESS_TOKEN`
- Verificar con `GET https://graph.facebook.com/v18.0/1062732140261273` + Bearer token

## Security Advisor (estado actual)
- **Errores**: 0
- **Warnings**: 4 (mínimo posible con esta arquitectura)
  - 3× "Signed-In Users Can Execute SECURITY DEFINER" — intencional, RLS requiere GRANT TO authenticated
  - 1× "Leaked Password Protection Disabled" — requiere Pro plan
- **Info**: 0

## Planes EBSA
Los 4 planes están seeded en DB con coberturas completas:
- **Sana** (tier 1) — básico
- **Confort** (tier 2) — intermedio
- **Excellent** (tier 3) — premium
- **Adultos Mayores** (tier 4) — segmento senior

## Estado actual del desarrollo
Ver `CHECKLIST.md` para el detalle completo. Resumen:
- Fase 1 (Fundamentos): 100% ✅
- Fase 2 (Primer cliente): 70%
- Fase 3 (Expansión): 80% ✅
- Fase 4 (Enterprise): 25%

**Completado en sesión 2026-05-27 (parte 1):**
- RLS re-habilitado en las 30 tablas con políticas completas (migración 030)
- Middleware reescrito con validación JWT real via `@supabase/ssr`
- `createBrowserClient` reemplaza `createClient` — sesión en cookies
- Funciones SECURITY DEFINER aseguradas: `search_path`, `REVOKE FROM anon/PUBLIC` (migraciones 031-033)
- Policies RLS para `contact_tags` y `client_tag_assignments`
- Credenciales demo ocultas en producción (`NODE_ENV === 'development'`)
- Google OAuth + MFA + JWT Claims: código completo (pendiente config Dashboard)

**Completado en sesión 2026-05-27 (parte 2 — Fase 2 + Fase 3):**
- Triggers `audit_log` activos en clients, client_plans, payments, users (migración 034 ejecutada)
- `exportToCsv()` en `lib/supabase.ts` — BOM UTF-8, sin dependencias
- Export CSV en `/clientes`, `/comisiones`, `/auditoria` (gated por `can_export_data`)
- Página `/auditoria` — filtros, diff before/after en panel lateral, paginación 50 registros
- Dashboard supervisor: filtro por agente, ranking de agentes, métricas de equipo
- Página `/reportes` — 4 reportes (cartera, comisiones, renovaciones, canales) + export CSV
- Página `/campanas` — crear/programar/lanzar campañas, segmentación por status + plan + tags, templates
- Sidebar: links condicionales `/reportes`, `/campanas`, `/auditoria` por permiso
- `/whatsapp` reescrito: conversaciones reales desde BD, mensajes persistidos, Supabase Realtime, templates desde `whatsapp_templates`, indicadores de estado (✓✓), modal nueva conversación
- `app/api/whatsapp/send/route.ts` — endpoint individual con manejo de ventana 24hs
- `lib/whatsapp-api.ts` — `sendTextMessage()` + `WhatsAppWindowExpiredError`

**Pendiente próxima sesión:**
1. Token permanente Meta (System User) → activar envío real desde CRM
2. Gráfico tendencia semanal en dashboard
3. API endpoints server-side (`GET /api/clientes`, `GET /api/export/cartera`, etc.)
4. **Fase 4**: IA con Claude API — resumen de conversaciones WhatsApp, sugerencia próxima acción, borrador de cotización

## Convenciones del proyecto
- Idioma del código: inglés (variables, funciones, tipos)
- Idioma de UI: español (Paraguay)
- Formateo de moneda: `formatCurrency()` en `lib/supabase.ts`
- Formateo de teléfonos PY: función SQL `format_wa_py()` + `fmt595()` en whatsapp page (agrega prefijo 595)
- Colores por plan: `sana=verde`, `confort=azul`, `excellent=dorado`, `adultos=violeta`
- Todas las queries a Supabase son client-side con RLS (no hay servidor intermedio salvo endpoints en `/api/`)
- Cast para joins Supabase: `data as unknown as MyType[]` (Supabase devuelve relaciones como array en TS)
- `WaConversation.clients` es `ConvClient | null` en el tipo pero Supabase puede devolver array → usar cast

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_API_VERSION=v18.0
```
