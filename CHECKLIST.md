# SeguroCRM — Checklist de Desarrollo por Fase

---

## Fase 1 — Fundamentos `82% completo`

### Multi-tenancy
- [x] Campo `org_id` en todas las tablas
- [x] Row-Level Security habilitado en todas las tablas
- [x] Función `get_user_org_id()` para RLS policies
- [x] Tabla `organizations` como entidad tenant

### Schema de Base de Datos
- [x] 30 tablas creadas con migraciones SQL
- [x] Triggers de `updated_at` automáticos
- [x] Trigger comisión automática al pagar
- [x] Trigger recordatorio de renovación a 30 días
- [x] Trigger sincronización estado cliente ↔ planes

### Roles y Permisos
- [x] Enum `user_role` con 6 roles (superadmin, admin, supervisor, agente, asistente, auditor)
- [x] Tabla `role_permissions` con 25+ flags booleanos
- [x] Componente `PermissionGuard` en frontend
- [x] Carga de permisos en `AuthContext` al login
- [x] Mapear los 25 permisos DB al tipo `Permissions` en `lib/auth-context.tsx` (35 permisos mapeados)
- [x] Middleware `middleware.ts` de Next.js para proteger rutas por rol

### Autenticación
- [x] Login email/password con Supabase Auth
- [x] Session management con `onAuthStateChange`
- [x] JWT de Supabase integrado con RLS
- [x] SSO / OAuth con Google Workspace
- [x] MFA (autenticación de dos factores)
- [x] Claims de `org_id` y `role` en el JWT (hook SQL en migración 029)

---

## Fase 2 — Primer Cliente `70% completo`

### Planes EBSA
- [x] 4 planes seeded: Sana, Confort, Excellent, Adultos Mayores
- [x] 12 categorías de cobertura con detalles
- [x] Campo `agent_commission_pct` por plan
- [ ] Tabla de precios por edad / grupo familiar
- [ ] Comparador visual de planes lado a lado
- [ ] Generador de PDF para cotizaciones

### Cotizaciones y Ventas
- [x] Tablas `quotations` + `quotation_items`
- [x] Cálculo de prima mensual/anual y comisión
- [x] Pipeline de ventas en dashboard (5 etapas)
- [ ] Formulario de cotización completo con selector de beneficiarios
- [ ] Envío de cotización por WhatsApp/email desde la app

### Dashboard
- [x] 8 KPIs en tiempo real (pólizas, prima, tasa cierre, leads)
- [x] Distribución de planes (Sana/Confort/Excellent/AM)
- [x] Alertas de renovación a 30 días
- [x] Últimas 6 actividades recientes
- [ ] Selector de período (mes / trimestre / año)

### Audit Log — BLOQUEANTE para venta enterprise
- [x] Tabla `audit_log` con schema completo (entity, action, old_data, new_data)
- [x] RLS policy (solo admin puede leer)
- [x] Permiso `can_view_audit_log` en DB
- [x] Trigger SQL que escriba a `audit_log` en clients, client_plans, payments, users (migración 034 ✅ ejecutada)
- [x] Mapear `can_view_audit_log` al tipo `Permissions` del frontend
- [x] Página `/auditoria` para que admin vea el historial (filtros, diff before/after, export CSV)

### Exportación de Datos — BLOQUEANTE para venta enterprise
- [x] Flag `can_export_data` en `role_permissions`
- [x] `exportToCsv()` helper en `lib/supabase.ts` (sin dependencias externas, BOM UTF-8)
- [x] Botón "Exportar CSV" en página Clientes (exporta la vista filtrada actual)
- [x] Botón "Exportar CSV" en página Comisiones
- [x] Mapear `can_export_data` al tipo `Permissions` del frontend
- [x] Botones visibles solo si `permissions.can_export_data === true`

---

## Fase 3 — Expansión `80% completo`

### Dashboard de Supervisor
- [x] Filtro por agente (selector de usuario del equipo, visible para can_view_all_clients)
- [x] Ranking de agentes con pólizas vendidas y comisiones (card en dashboard)
- [ ] Gráfico de tendencia temporal (ventas por semana/mes)
- [x] Métricas de equipo vs métricas individuales (filtro por agente aplica a KPIs)
- [x] Vista consolidada multi-agente para supervisor

### Reportes
- [x] Página `/reportes` con templates predefinidos
- [x] Reporte de cartera activa por agente
- [x] Reporte de comisiones por período
- [x] Reporte de renovaciones próximas (filtro 15/30/60/90 días, badge urgencia)
- [x] Reporte de conversión por canal (bar chart + tabla)

### Campañas Masivas
- [x] Tabla `campaigns` + `campaign_recipients` en DB
- [x] Endpoint `POST /api/whatsapp/send-bulk`
- [x] UI para crear y programar campañas (`/campanas`)
- [x] Seguimiento de entrega y apertura (stats en cards: enviados/entregados/fallidos)
- [x] Segmentación de destinatarios por plan/estado

### API Endpoints (Server-side)
- [x] `POST /api/whatsapp/send-bulk`
- [ ] `GET /api/clientes` con filtros y paginación
- [ ] `GET /api/export/cartera`
- [ ] `GET /api/reportes/comisiones`
- [ ] Validación de rol en todos los endpoints

---

## Fase 4 — Enterprise `18% completo`

### Autenticación Enterprise
- [ ] SSO con Google Workspace (OAuth 2.0)
- [ ] SAML 2.0 para corporaciones
- [ ] MFA obligatorio para roles admin/supervisor
- [ ] Claims de `org_id` + `role` embebidos en JWT

### Inteligencia Artificial (Claude API)
- [ ] Instalar `@anthropic-ai/sdk`
- [ ] Resumen automático de conversaciones WhatsApp/Messenger
- [ ] Sugerencia de próxima acción en pipeline
- [ ] Borrador de email/mensaje de cotización desde datos del cliente
- [ ] Análisis de objeciones frecuentes por segmento

### Compliance y Trazabilidad
- [ ] Audit trail completo (ver sección Fase 2)
- [ ] Retención configurable de datos por organización
- [ ] Exportación de datos completa para GDPR/LGPD
- [ ] Política de contraseñas configurable por org

### Escalabilidad Multi-org
- [x] Arquitectura multi-tenant lista (org_id en todo)
- [ ] Panel de superadmin para gestionar organizaciones
- [ ] Onboarding automático de nueva organización
- [ ] Facturación por organización (SaaS billing)
- [ ] Límites de usuarios/clientes por plan de suscripción

---

## Orden sugerido — Esta semana

```
Día 1  →  Trigger audit_log (SQL) + mapear permisos faltantes al frontend
Día 2  →  Endpoint export CSV/Excel + botones en Clientes y Comisiones
Día 3  →  Página /auditoria mínima + middleware de rutas Next.js
```
