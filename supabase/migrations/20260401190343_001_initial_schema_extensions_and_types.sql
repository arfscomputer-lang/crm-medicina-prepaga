/*
  # SeguroCRM v3 - Extensiones y Tipos Enumerados
  
  1. Extensiones PostgreSQL
    - uuid-ossp: Generación de UUIDs
    - pgcrypto: Encriptación
    - pg_trgm: Búsqueda por similitud
    - unaccent: Búsqueda sin acentos
  
  2. Tipos Enumerados
    - user_role: Roles del sistema (6 roles)
    - client_status: Estados de clientes
    - plan_tier: Niveles de planes EBSA
    - client_plan_status: Estados de planes contratados
    - payment_frequency: Frecuencias de pago
    - payment_status: Estados de pagos
    - payment_method: Métodos de pago Paraguay
    - channel_type: Canales de comunicación
    - activity_type: Tipos de actividad CRM
    - msg_direction: Dirección de mensajes
    - msg_status: Estados de mensajes
    - campaign_status: Estados de campañas
    - invoice_type: Tipos de factura SIFEN
    - commission_status: Estados de comisiones
    - coverage_category: Categorías de cobertura médica
*/

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Tipos enumerados
CREATE TYPE user_role AS ENUM (
    'superadmin',
    'admin',
    'supervisor',
    'agente',
    'asistente',
    'auditor'
);

CREATE TYPE client_status AS ENUM (
    'prospecto', 'cotizado', 'activo', 'vencido', 'cancelado', 'inactivo'
);

CREATE TYPE plan_tier AS ENUM (
    'sana', 'confort', 'excellent', 'adultos_mayores'
);

CREATE TYPE client_plan_status AS ENUM (
    'cotizado', 'pendiente', 'activo', 'suspendido', 'vencido', 'cancelado', 'renovado'
);

CREATE TYPE payment_frequency AS ENUM (
    'mensual', 'trimestral', 'semestral', 'anual'
);

CREATE TYPE payment_status AS ENUM (
    'pendiente', 'pagado', 'vencido', 'anulado'
);

CREATE TYPE payment_method AS ENUM (
    'transferencia_bancaria', 'qr_bancard', 'tigo_money', 'personal_pay',
    'tarjeta_debito', 'tarjeta_credito', 'efectivo', 'debito_automatico', 'cheque'
);

CREATE TYPE channel_type AS ENUM (
    'whatsapp', 'messenger', 'llamada', 'call', 'email',
    'reunion', 'meeting', 'sms', 'presencial', 'otro'
);

CREATE TYPE activity_type AS ENUM (
    'contacto_inicial', 'envio_cotizacion', 'seguimiento', 'recordatorio_pago',
    'cobranza', 'renovacion', 'reclamo', 'soporte', 'felicitacion',
    'nota_interna', 'campana', 'otro'
);

CREATE TYPE msg_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE msg_status AS ENUM (
    'pendiente', 'enviado', 'entregado', 'leido', 'respondido', 'fallido'
);

CREATE TYPE campaign_status AS ENUM (
    'borrador', 'programada', 'enviando', 'completada', 'cancelada'
);

CREATE TYPE invoice_type AS ENUM (
    'factura_electronica', 'nota_credito', 'nota_debito',
    'autofactura', 'nota_remision'
);

CREATE TYPE commission_status AS ENUM (
    'devengado', 'cobrado', 'anulado'
);

CREATE TYPE coverage_category AS ENUM (
    'consultas', 'urgencias', 'analisis', 'imagenes', 'internacion',
    'cirugia', 'maternidad', 'fisioterapia', 'odontologia',
    'ambulancia', 'salud_mental', 'procedimientos'
);