/*
  # Datos Iniciales (Seed Data)
  
  1. Organización de prueba
  2. Permisos por rol (6 roles)
  3. Catálogo de 4 planes EBSA con coberturas
  4. Plantillas WhatsApp y Messenger
  5. Configuración del sistema
*/

-- Organización
INSERT INTO organizations (id, name, ruc, phone, email) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Mi Agencia de Seguros', '80099999-1', '(021) 555-0100', 'info@miagencia.com.py')
ON CONFLICT (id) DO NOTHING;

-- Permisos por rol
INSERT INTO role_permissions (
    org_id, role, 
    can_manage_catalog, can_upload_plan_pdfs, can_delete_clients, 
    can_view_all_clients, can_view_all_plans, can_view_all_commissions, 
    can_manage_commissions, can_view_all_activities, can_delete_activities, 
    can_create_campaigns, can_send_campaigns, can_create_invoices, 
    can_export_data, can_manage_users, can_manage_org, can_view_audit_log
) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'superadmin', true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true),
    ('a0000000-0000-0000-0000-000000000001', 'admin', true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, true),
    ('a0000000-0000-0000-0000-000000000001', 'supervisor', false, true, false, true, true, true, false, true, false, true, true, false, true, false, false, false),
    ('a0000000-0000-0000-0000-000000000001', 'agente', false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false),
    ('a0000000-0000-0000-0000-000000000001', 'asistente', false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false),
    ('a0000000-0000-0000-0000-000000000001', 'auditor', false, false, false, true, true, true, false, true, false, false, false, false, true, false, false, true)
ON CONFLICT (org_id, role) DO NOTHING;

-- Catálogo de planes EBSA
INSERT INTO plan_catalog (id, org_id, code, name, tier, tier_level, tagline, icon, color, agent_commission_pct, sort_order) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'sana', 'Sana', 'sana', 1, 'Plan básico accesible', '🌿', '#34D399', 15.00, 1),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'confort', 'Confort', 'confort', 2, 'Equilibrio costo-cobertura', '⭐', '#FBBF24', 14.00, 2),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'excellent', 'Excellent', 'excellent', 3, 'Cobertura premium completa', '💎', '#8B5CF6', 15.00, 3),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'adultos_mayores', 'Adultos Mayores', 'adultos_mayores', 2, 'Diseñado para +60 años', '🤝', '#F97316', 12.00, 4)
ON CONFLICT (org_id, code) DO NOTHING;

-- Coberturas Plan Sana
INSERT INTO plan_coverages (plan_catalog_id, category, quantity, waiting_period, details, is_unlimited, waiting_days, sort_order) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'consultas', 'Ilimitada', 'Inmediata', 'Todas las especialidades. Psicología 1, psiquiatría 1, nutricionista 1', true, 0, 1),
    ('b0000000-0000-0000-0000-000000000001', 'urgencias', 'Ilimitada', 'Inmediata', 'Consultas ilimitadas. Proc. menores carencia 180d. Nebulizaciones 10', true, 0, 2),
    ('b0000000-0000-0000-0000-000000000001', 'analisis', '~120 tipos', '60 días', 'Hemograma, glucosa, perfil lipídico/hepático/renal, coagulograma, cultivos', false, 60, 3),
    ('b0000000-0000-0000-0000-000000000001', 'imagenes', 'Limitada', '60-120 días', 'Rx 10 pos (60d). Eco 2 (120d). PAP 2/año, ECG 2/año, mamografía 2/año', false, 60, 4),
    ('b0000000-0000-0000-0000-000000000001', 'internacion', '10 días pensión', 'No qx 90d / Qx 360d', 'Salas compartidas. UCI 1 día. Sin medicamentos', false, 90, 5),
    ('b0000000-0000-0000-0000-000000000001', 'cirugia', 'Según listado', '360 días', 'General, ginecológica, mastológica, ORL, traumatológica, urológica', false, 360, 6),
    ('b0000000-0000-0000-0000-000000000001', 'maternidad', 'Con cobertura', 'Normal 365d / Cesárea 540d', 'Lab limitado. Eco a cargo beneficiario. Nursery 72hs', false, 365, 7),
    ('b0000000-0000-0000-0000-000000000001', 'fisioterapia', '10 sesiones', 'Inmediata', 'Masaje manual excluido equipo', false, 0, 8),
    ('b0000000-0000-0000-0000-000000000001', 'odontologia', 'Básica', 'Inmediata', 'Examen 1, extracción 2, profilaxis 1, flúor 1, obturación 2, Rx 2', false, 0, 9),
    ('b0000000-0000-0000-0000-000000000001', 'ambulancia', 'Ilimitada', 'Inmediata', 'Domiciliarias, emergencias, traslados, equipos', true, 0, 10),
    ('b0000000-0000-0000-0000-000000000001', 'salud_mental', '1 sesión c/u', 'Inmediata', 'Psicología 1, psiquiatría 1, nutricionista 1', false, 0, 11),
    ('b0000000-0000-0000-0000-000000000001', 'procedimientos', 'Ilimitada trauma/ORL/uro', '180 días', 'Flebología 2, piel/huesos 2, proctología 1', false, 180, 12)
ON CONFLICT (plan_catalog_id, category) DO NOTHING;

-- Coberturas Plan Excellent
INSERT INTO plan_coverages (plan_catalog_id, category, quantity, waiting_period, details, is_unlimited, waiting_days, sort_order) VALUES
    ('b0000000-0000-0000-0000-000000000003', 'consultas', 'Ilimitada', 'Inmediata', 'Todas las especialidades. Psicología 4, psiquiatría 4, nutricionista 4', true, 0, 1),
    ('b0000000-0000-0000-0000-000000000003', 'urgencias', 'Ilimitada', 'Inmediata', 'Medicamentos Gs.150.000/evento. Proc. y enfermería ilimitados', true, 0, 2),
    ('b0000000-0000-0000-0000-000000000003', 'analisis', 'Ilimitada 400+ tipos', 'Inmediata', 'Marcadores tumorales, hormonas, TORCH, hepatitis, HIV, inmunoglobulinas', true, 0, 3),
    ('b0000000-0000-0000-0000-000000000003', 'imagenes', 'Ilimitada', 'Inmediata/30d', 'Rx ilimitadas. TAC ilimitada. Eco ilimitadas. RMN 2/año. Holter, MAPA', true, 0, 4),
    ('b0000000-0000-0000-0000-000000000003', 'internacion', '45 días pensión', 'No qx 30d / Qx 180d', 'Salas privadas. UCI 20 días. Medicamentos Gs.1.500.000/año. Transfusiones 15', false, 30, 5),
    ('b0000000-0000-0000-0000-000000000003', 'cirugia', 'Lista extensa', '180 días', 'Todo + digestiva, hepática, urología completa, oftalmología, pediátrica congénita', false, 180, 6),
    ('b0000000-0000-0000-0000-000000000003', 'maternidad', 'Completa', '365 días', 'Lab completo + TORCH. Eco 4D, morfológica. Medicamentos Gs.1.500.000', false, 365, 7),
    ('b0000000-0000-0000-0000-000000000003', 'fisioterapia', '20 sesiones', 'Inmediata', 'Fomentaciones, ondas cortas, ultrasonido, infrarrojo, tracción cervical', false, 0, 8),
    ('b0000000-0000-0000-0000-000000000003', 'odontologia', 'Básica preventiva', 'Inmediata', 'Examen 1, extracción 2, profilaxis 1, flúor 1, obturación 2, Rx 2', false, 0, 9),
    ('b0000000-0000-0000-0000-000000000003', 'ambulancia', 'Ilimitada', 'Inmediata', 'Domiciliarias, emergencias, traslados, equipos, oxígeno, medicamentos', true, 0, 10),
    ('b0000000-0000-0000-0000-000000000003', 'salud_mental', '4 sesiones c/u', 'Inmediata', 'Psicología 4, psiquiatría 4, nutricionista 4', false, 0, 11),
    ('b0000000-0000-0000-0000-000000000003', 'procedimientos', 'Ilimitada + extras', 'Inmediata/30d', 'Trauma/ORL/uro ilimitados. Flebología 4. Piel 2. Proctología 2. Plástica ilimitada', true, 0, 12)
ON CONFLICT (plan_catalog_id, category) DO NOTHING;

-- Plantillas WhatsApp
INSERT INTO whatsapp_templates (org_id, name, category, body_template, variables) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Bienvenida', 'bienvenida', 'Hola {nombre}! Soy tu asesor EBSA. Estoy para ayudarte a encontrar el plan ideal.', ARRAY['nombre']),
    ('a0000000-0000-0000-0000-000000000001', 'Cotización', 'cotizacion', 'Hola {nombre}, tu cotización: Plan {plan}, Prima {monto}. Avanzamos?', ARRAY['nombre','plan','monto']),
    ('a0000000-0000-0000-0000-000000000001', 'Recordatorio pago', 'pago', 'Hola {nombre}, tu pago del plan {plan} está próximo. Pagá por QR Bancard o Tigo Money.', ARRAY['nombre','plan']),
    ('a0000000-0000-0000-0000-000000000001', 'Renovación', 'renovacion', 'Hola {nombre}, tu plan {plan} vence pronto. Conversamos?', ARRAY['nombre','plan']),
    ('a0000000-0000-0000-0000-000000000001', 'Cumpleaños', 'cumpleanos', 'Feliz cumpleaños {nombre}! Que tengas mucha salud.', ARRAY['nombre'])
ON CONFLICT DO NOTHING;

-- Plantillas Messenger
INSERT INTO messenger_templates (org_id, name, category, body_template, variables) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Bienvenida', 'bienvenida', 'Hola {nombre}! Te escribo por Messenger. Soy asesor EBSA.', ARRAY['nombre']),
    ('a0000000-0000-0000-0000-000000000001', 'Cotización', 'cotizacion', 'Hola {nombre}, tu cotización EBSA: Plan {plan}, Prima {monto}.', ARRAY['nombre','plan','monto']),
    ('a0000000-0000-0000-0000-000000000001', 'Seguimiento', 'seguimiento', 'Hola {nombre}, pudiste revisar la propuesta EBSA?', ARRAY['nombre']),
    ('a0000000-0000-0000-0000-000000000001', 'Info coberturas', 'informacion', 'Hola {nombre}, nuestros planes incluyen consultas ilimitadas, internación, cirugías, emergencias 24/7.', ARRAY['nombre']),
    ('a0000000-0000-0000-0000-000000000001', 'Invitación', 'seguimiento', 'Hola {nombre}, cuándo te queda bien para hablar sobre planes de salud?', ARRAY['nombre'])
ON CONFLICT DO NOTHING;

-- Configuración del sistema
INSERT INTO system_config (org_id, key, value, description) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'currency', '"PYG"', 'Moneda'),
    ('a0000000-0000-0000-0000-000000000001', 'currency_symbol', '"₲"', 'Símbolo'),
    ('a0000000-0000-0000-0000-000000000001', 'country', '"PY"', 'País'),
    ('a0000000-0000-0000-0000-000000000001', 'tax_rate_10', '10', 'IVA %'),
    ('a0000000-0000-0000-0000-000000000001', 'payment_grace_days', '5', 'Días de gracia'),
    ('a0000000-0000-0000-0000-000000000001', 'renewal_alert_days', '30', 'Días alerta renovación'),
    ('a0000000-0000-0000-0000-000000000001', 'wa_api_version', '"v21.0"', 'Versión API WhatsApp'),
    ('a0000000-0000-0000-0000-000000000001', 'sifen_environment', '"test"', 'Ambiente SIFEN'),
    ('a0000000-0000-0000-0000-000000000001', 'max_plan_pdf_size_mb', '4', 'Tamaño máximo PDF de plan en MB')
ON CONFLICT (org_id, key) DO NOTHING;