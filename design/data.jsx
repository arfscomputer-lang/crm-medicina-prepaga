// data.jsx — mock realistic Paraguay data for SeguroCRM

const PLANS = {
  sana:      { id: "sana",      name: "EBSA Sana",      tier: "ESENCIAL",  color: "var(--plan-sana)",      tone: "sana",      tagline: "Salud esencial para la vida diaria",        comision: 12, prima: 285000 },
  confort:   { id: "confort",   name: "EBSA Confort",   tier: "FAMILIAR",  color: "var(--plan-confort)",   tone: "confort",   tagline: "Cobertura completa para tu familia",        comision: 14, prima: 485000 },
  excellent: { id: "excellent", name: "EBSA Excellent", tier: "PREMIUM",   color: "var(--plan-excellent)", tone: "excellent", tagline: "La experiencia premium en salud privada",   comision: 16, prima: 985000 },
  adultos:   { id: "adultos",   name: "EBSA Adultos Mayores", tier: "60+", color: "var(--plan-adultos)",   tone: "adultos",   tagline: "Especializado para mayores de 60 años",     comision: 18, prima: 645000 },
};

const PLAN_LIST = Object.values(PLANS);

// Coverage matrix (yes/limit/no)
const COVERAGES = [
  { id: "consultas",    label: "Consultas médicas",            sana: "Ilimitadas", confort: "Ilimitadas", excellent: "Ilimitadas", adultos: "Ilimitadas" },
  { id: "urgencias",    label: "Urgencias 24h",                sana: "✓",          confort: "✓",          excellent: "✓",          adultos: "✓" },
  { id: "internacion",  label: "Internación clínica",          sana: "Hasta 30 días", confort: "Hasta 90 días", excellent: "Ilimitada", adultos: "Hasta 60 días" },
  { id: "cirugia",      label: "Cirugías programadas",         sana: "Básicas",    confort: "Completas",  excellent: "Completas + alta complejidad", adultos: "Completas" },
  { id: "maternidad",   label: "Maternidad y parto",           sana: "—",          confort: "✓",          excellent: "Premium",    adultos: "—" },
  { id: "odontologia",  label: "Odontología",                  sana: "Básica",     confort: "Estética",   excellent: "Estética + ortodoncia", adultos: "Prótesis incluidas" },
  { id: "laboratorio",  label: "Estudios de laboratorio",      sana: "Hasta Gs. 800.000/año", confort: "Hasta Gs. 2.000.000/año", excellent: "Ilimitados", adultos: "Hasta Gs. 1.500.000/año" },
  { id: "imagenes",     label: "Imágenes y diagnóstico",       sana: "Básicos",    confort: "Avanzados",  excellent: "Resonancia, PET", adultos: "Avanzados" },
  { id: "medicamentos", label: "Medicamentos ambulatorios",    sana: "40% descuento", confort: "60% descuento", excellent: "80% descuento", adultos: "70% descuento" },
  { id: "internacional",label: "Cobertura internacional",      sana: "—",          confort: "Emergencias", excellent: "Mundial",   adultos: "Emergencias" },
];

const ROLES = {
  ADMIN:      { id: "ADMIN",      label: "Admin",      desc: "Acceso total a toda la agencia" },
  SUPERVISOR: { id: "SUPERVISOR", label: "Supervisor", desc: "Ve toda su zona y equipo" },
  AGENTE:     { id: "AGENTE",     label: "Agente",     desc: "Ve solo su cartera de clientes" },
  VIEWER:     { id: "VIEWER",     label: "Viewer",     desc: "Solo lectura" },
};

const USERS = [
  { id: "u1", nombre: "María Ozuna",       email: "maria.ozuna@segurocrm.com.py",    role: "ADMIN",      iniciales: "MO", color: "linear-gradient(135deg, #F87171, #FBBF24)" },
  { id: "u2", nombre: "Carlos Benítez",    email: "c.benitez@segurocrm.com.py",      role: "SUPERVISOR", iniciales: "CB", color: "linear-gradient(135deg, #60A5FA, #4F7DFF)" },
  { id: "u3", nombre: "Lourdes Aquino",    email: "lourdes.aquino@segurocrm.com.py", role: "AGENTE",     iniciales: "LA", color: "linear-gradient(135deg, #34D399, #60A5FA)" },
  { id: "u4", nombre: "Diego Martínez",    email: "diego.martinez@segurocrm.com.py", role: "AGENTE",     iniciales: "DM", color: "linear-gradient(135deg, #A78BFA, #F87171)" },
  { id: "u5", nombre: "Patricia Velázquez",email: "p.velazquez@segurocrm.com.py",    role: "AGENTE",     iniciales: "PV", color: "linear-gradient(135deg, #F4B95E, #F87171)" },
  { id: "u6", nombre: "Roberto Cáceres",   email: "r.caceres@segurocrm.com.py",      role: "VIEWER",     iniciales: "RC", color: "linear-gradient(135deg, #8A91A2, #5E6677)" },
];

// 18 realistic clients
const CLIENTES = [
  { id: "c01", nombre: "Rodrigo Insfrán",         ci: "4.582.317", tel: "+595 981 224-851", email: "rodrigo.insfran@gmail.com",    plan: "excellent", estado: "activo",    ultimoContacto: "Hace 2h",   agente: "u3", ciudad: "Asunción",         beneficiarios: 3, prima: 1185000, inicio: "2025-03-12", fin: "2026-03-12", etapa: 5 },
  { id: "c02", nombre: "Carolina Espínola",       ci: "3.844.220", tel: "+595 972 558-310", email: "c.espinola@hotmail.com",       plan: "confort",   estado: "activo",    ultimoContacto: "Ayer",      agente: "u3", ciudad: "Asunción",         beneficiarios: 2, prima: 685000,  inicio: "2024-11-04", fin: "2025-11-04", etapa: 5 },
  { id: "c03", nombre: "Hugo Villalba",           ci: "5.221.985", tel: "+595 985 117-642", email: "hugo.villalba@empresa.com.py", plan: "confort",   estado: "activo",    ultimoContacto: "Hace 3 días", agente: "u4", ciudad: "Luque",          beneficiarios: 4, prima: 925000,  inicio: "2025-01-20", fin: "2026-01-20", etapa: 5 },
  { id: "c04", nombre: "Marlene Cantero",         ci: "2.108.553", tel: "+595 991 322-008", email: "marlene.cantero@yahoo.com",    plan: "adultos",   estado: "activo",    ultimoContacto: "Hace 5h",   agente: "u5", ciudad: "San Lorenzo",      beneficiarios: 1, prima: 645000,  inicio: "2025-06-15", fin: "2026-06-15", etapa: 5 },
  { id: "c05", nombre: "Javier Recalde",          ci: "4.117.844", tel: "+595 983 884-117", email: "j.recalde@gmail.com",          plan: "sana",      estado: "activo",    ultimoContacto: "Hace 1 día", agente: "u3", ciudad: "Capiatá",        beneficiarios: 1, prima: 285000,  inicio: "2025-09-01", fin: "2026-09-01", etapa: 5 },
  { id: "c06", nombre: "Sandra Galeano",          ci: "3.502.671", tel: "+595 971 209-559", email: "sandra.galeano@gmail.com",     plan: "sana",      estado: "vencido",   ultimoContacto: "Hace 12 días", agente: "u4", ciudad: "Lambaré",       beneficiarios: 1, prima: 285000,  inicio: "2024-04-22", fin: "2025-04-22", etapa: 5 },
  { id: "c07", nombre: "Fernando Ojeda",          ci: "4.998.012", tel: "+595 984 663-441", email: "f.ojeda@outlook.com",          plan: "confort",   estado: "cotizado",  ultimoContacto: "Hoy 10:42", agente: "u3", ciudad: "Asunción",         beneficiarios: 3, prima: 0,       inicio: "—",        fin: "—",        etapa: 3 },
  { id: "c08", nombre: "Beatriz Mendoza",         ci: "5.667.114", tel: "+595 972 117-882", email: "b.mendoza@gmail.com",          plan: "sana",      estado: "cotizado",  ultimoContacto: "Hoy 09:11", agente: "u4", ciudad: "Fernando de la Mora", beneficiarios: 2, prima: 0,       inicio: "—",        fin: "—",        etapa: 3 },
  { id: "c09", nombre: "Alejandro Duarte",        ci: "6.118.220", tel: "+595 981 770-220", email: "alejandro.duarte@gmail.com",   plan: "excellent", estado: "negociacion", ultimoContacto: "Hace 1h",  agente: "u3", ciudad: "Asunción",       beneficiarios: 4, prima: 0,       inicio: "—",        fin: "—",        etapa: 4 },
  { id: "c10", nombre: "Liliana Romero",          ci: "3.224.078", tel: "+595 991 558-117", email: "lili.romero@gmail.com",        plan: null,        estado: "prospecto", ultimoContacto: "Hace 2 días", agente: "u5", ciudad: "Ñemby",         beneficiarios: 0, prima: 0,       inicio: "—",        fin: "—",        etapa: 1 },
  { id: "c11", nombre: "Marcelo Aranda",          ci: "4.443.991", tel: "+595 985 226-114", email: "m.aranda@gmail.com",           plan: null,        estado: "prospecto", ultimoContacto: "Hace 4 días", agente: "u4", ciudad: "Asunción",      beneficiarios: 0, prima: 0,       inicio: "—",        fin: "—",        etapa: 1 },
  { id: "c12", nombre: "Verónica Acuña",          ci: "5.880.334", tel: "+595 972 113-007", email: "veronica.acuna@gmail.com",     plan: null,        estado: "contactado",ultimoContacto: "Hace 6h",   agente: "u3", ciudad: "Asunción",         beneficiarios: 0, prima: 0,       inicio: "—",        fin: "—",        etapa: 2 },
  { id: "c13", nombre: "Néstor Riveros",          ci: "4.005.881", tel: "+595 981 005-220", email: "nestor.riveros@gmail.com",     plan: "adultos",   estado: "activo",    ultimoContacto: "Hace 7 días", agente: "u5", ciudad: "Encarnación",   beneficiarios: 2, prima: 875000,  inicio: "2025-02-08", fin: "2026-02-08", etapa: 5 },
  { id: "c14", nombre: "Mirta Fleitas",           ci: "3.991.226", tel: "+595 991 008-336", email: "mirta.fleitas@gmail.com",      plan: "confort",   estado: "activo",    ultimoContacto: "Hace 4 días", agente: "u4", ciudad: "Itauguá",       beneficiarios: 3, prima: 785000,  inicio: "2025-07-19", fin: "2026-07-19", etapa: 5 },
  { id: "c15", nombre: "Cristian López",          ci: "5.117.443", tel: "+595 984 117-553", email: "cristian.lopez@gmail.com",     plan: "sana",      estado: "activo",    ultimoContacto: "Hace 2 días", agente: "u3", ciudad: "Mariano R. Alonso", beneficiarios: 1, prima: 285000, inicio: "2025-08-30", fin: "2026-08-30", etapa: 5 },
  { id: "c16", nombre: "Romina Báez",             ci: "4.778.119", tel: "+595 985 558-001", email: "romina.baez@gmail.com",        plan: "excellent", estado: "activo",    ultimoContacto: "Hoy 11:30",   agente: "u3", ciudad: "Asunción",     beneficiarios: 5, prima: 1425000, inicio: "2025-05-12", fin: "2026-05-12", etapa: 5 },
  { id: "c17", nombre: "Gustavo Britos",          ci: "5.334.118", tel: "+595 972 117-441", email: "gustavo.britos@gmail.com",     plan: null,        estado: "prospecto", ultimoContacto: "Hace 8 días", agente: "u4", ciudad: "Villa Elisa",   beneficiarios: 0, prima: 0,       inicio: "—",        fin: "—",        etapa: 1 },
  { id: "c18", nombre: "Patricia Núñez",          ci: "3.667.220", tel: "+595 991 220-118", email: "p.nunez@gmail.com",            plan: "confort",   estado: "negociacion", ultimoContacto: "Hoy 14:55", agente: "u5", ciudad: "Asunción",     beneficiarios: 2, prima: 0,       inicio: "—",        fin: "—",        etapa: 4 },
];

// Activities
const ACTIVIDADES = [
  { id: "a01", canal: "whatsapp", clienteId: "c07", agente: "u3", fecha: "Hoy 10:42",  resumen: "Envío de cotización Confort para grupo familiar de 3 personas.", tipo: "envio" },
  { id: "a02", canal: "whatsapp", clienteId: "c08", agente: "u4", fecha: "Hoy 09:11",  resumen: "Consulta sobre cobertura odontológica del plan Sana.", tipo: "consulta" },
  { id: "a03", canal: "llamada",  clienteId: "c09", agente: "u3", fecha: "Hace 1h",    resumen: "Negociación de plan Excellent con cobertura internacional. Solicita descuento.", tipo: "negociacion" },
  { id: "a04", canal: "messenger",clienteId: "c12", agente: "u3", fecha: "Hace 6h",    resumen: "Primer contacto. Interesada en plan familiar.", tipo: "primer-contacto" },
  { id: "a05", canal: "email",    clienteId: "c16", agente: "u3", fecha: "Hoy 11:30",  resumen: "Confirmación de pago de prima mensual.", tipo: "pago" },
  { id: "a06", canal: "reunion",  clienteId: "c18", agente: "u5", fecha: "Hoy 14:55",  resumen: "Reunión presencial. Cliente firma contrato pendiente.", tipo: "reunion" },
  { id: "a07", canal: "whatsapp", clienteId: "c06", agente: "u4", fecha: "Hace 12 días", resumen: "Recordatorio de renovación. Sin respuesta.", tipo: "recordatorio" },
  { id: "a08", canal: "llamada",  clienteId: "c01", agente: "u3", fecha: "Hace 2h",    resumen: "Llamada de seguimiento. Cliente satisfecho con la cobertura.", tipo: "seguimiento" },
  { id: "a09", canal: "whatsapp", clienteId: "c02", agente: "u3", fecha: "Ayer 16:20", resumen: "Solicitud de inclusión de nuevo beneficiario.", tipo: "modificacion" },
  { id: "a10", canal: "email",    clienteId: "c03", agente: "u4", fecha: "Hace 3 días", resumen: "Envío de credencial digital actualizada.", tipo: "envio" },
  { id: "a11", canal: "messenger",clienteId: "c10", agente: "u5", fecha: "Hace 2 días", resumen: "Lead frío. Solicita info por mensaje patrocinado.", tipo: "primer-contacto" },
  { id: "a12", canal: "whatsapp", clienteId: "c11", agente: "u4", fecha: "Hace 4 días", resumen: "Sin respuesta luego de 3 mensajes.", tipo: "primer-contacto" },
];

// Commission entries
const COMISIONES = [
  { id: "k01", clienteId: "c01", plan: "excellent", prima: 1185000, pct: 16, monto: 189600, periodo: "May 2026", estado: "pendiente", agente: "u3" },
  { id: "k02", clienteId: "c02", plan: "confort",   prima: 685000,  pct: 14, monto: 95900,  periodo: "May 2026", estado: "pagado",    agente: "u3" },
  { id: "k03", clienteId: "c03", plan: "confort",   prima: 925000,  pct: 14, monto: 129500, periodo: "May 2026", estado: "pendiente", agente: "u4" },
  { id: "k04", clienteId: "c04", plan: "adultos",   prima: 645000,  pct: 18, monto: 116100, periodo: "May 2026", estado: "pagado",    agente: "u5" },
  { id: "k05", clienteId: "c05", plan: "sana",      prima: 285000,  pct: 12, monto: 34200,  periodo: "May 2026", estado: "pagado",    agente: "u3" },
  { id: "k06", clienteId: "c13", plan: "adultos",   prima: 875000,  pct: 18, monto: 157500, periodo: "May 2026", estado: "pendiente", agente: "u5" },
  { id: "k07", clienteId: "c14", plan: "confort",   prima: 785000,  pct: 14, monto: 109900, periodo: "May 2026", estado: "pagado",    agente: "u4" },
  { id: "k08", clienteId: "c15", plan: "sana",      prima: 285000,  pct: 12, monto: 34200,  periodo: "May 2026", estado: "pagado",    agente: "u3" },
  { id: "k09", clienteId: "c16", plan: "excellent", prima: 1425000, pct: 16, monto: 228000, periodo: "May 2026", estado: "pendiente", agente: "u3" },
];

const COMISIONES_HISTORICO = [
  { mes: "Dic 25", monto: 1840000 },
  { mes: "Ene 26", monto: 2105000 },
  { mes: "Feb 26", monto: 1990000 },
  { mes: "Mar 26", monto: 2430000 },
  { mes: "Abr 26", monto: 2185000 },
  { mes: "May 26", monto: 1094900 },
];

const PIPELINE_STAGES = [
  { id: "prospecto",   label: "Prospecto",   count: 28, monto: 0 },
  { id: "contactado",  label: "Contactado",  count: 19, monto: 0 },
  { id: "cotizado",    label: "Cotizado",    count: 12, monto: 9_600_000 },
  { id: "negociacion", label: "Negociación", count: 7,  monto: 7_220_000 },
  { id: "cerrado",     label: "Cerrado",     count: 4,  monto: 3_945_000 },
];

// WhatsApp conversations
const WA_CONVS = [
  { id: "w1", clienteId: "c07", unread: 2, last: "Sí, me interesa el plan Confort", time: "10:42" },
  { id: "w2", clienteId: "c09", unread: 1, last: "¿Pueden bajar un poco la cuota?", time: "09:55" },
  { id: "w3", clienteId: "c02", unread: 0, last: "Gracias, perfecto", time: "Ayer" },
  { id: "w4", clienteId: "c08", unread: 0, last: "Voy a consultar con mi esposo", time: "Ayer" },
  { id: "w5", clienteId: "c06", unread: 0, last: "Te enviamos el recordatorio", time: "Lun" },
  { id: "w6", clienteId: "c12", unread: 1, last: "Hola, ¿me dan info?", time: "Lun" },
  { id: "w7", clienteId: "c14", unread: 0, last: "Recibido el carnet, gracias", time: "Dom" },
  { id: "w8", clienteId: "c03", unread: 0, last: "Listo, lo agendamos", time: "Sáb" },
];

const WA_TEMPLATES = [
  { id: "t1", titulo: "Bienvenida", body: "Hola {{nombre}}, gracias por tu interés en EBSA. Soy {{agente}} y voy a ayudarte a encontrar el plan ideal para vos y tu familia." },
  { id: "t2", titulo: "Envío de cotización", body: "Hola {{nombre}}, te paso la cotización del plan {{plan}}. Prima mensual: Gs. {{prima}}. Cualquier consulta estoy a disposición." },
  { id: "t3", titulo: "Recordatorio de renovación", body: "Hola {{nombre}}, tu plan vence el {{fecha}}. ¿Coordinamos la renovación esta semana?" },
  { id: "t4", titulo: "Seguimiento post-cierre", body: "Hola {{nombre}}, ¿cómo estás con tu nueva cobertura? ¿Hay algo en lo que pueda ayudarte?" },
  { id: "t5", titulo: "Confirmación de pago", body: "Confirmamos la acreditación de tu pago. Tu plan {{plan}} está activo hasta {{fecha}}." },
];

// Mock thread for one conversation
const WA_THREAD = [
  { who: "in",  text: "Hola, buenas tardes. Vi su anuncio de EBSA.",          time: "10:18" },
  { who: "out", text: "¡Hola Fernando! Soy Lourdes de SeguroCRM. Con gusto te ayudo.", time: "10:19" },
  { who: "out", text: "¿Para cuántas personas estás cotizando?", time: "10:19" },
  { who: "in",  text: "Para mí, mi esposa y dos hijos.",                                time: "10:21" },
  { who: "in",  text: "Tengo 38 años, mi esposa 35 y los niños 6 y 4.",       time: "10:21" },
  { who: "out", text: "Perfecto. Te recomiendo el plan Confort. Cubre maternidad, internación familiar y odontología estética.", time: "10:24" },
  { who: "out", text: "Te paso la cotización 👇",                              time: "10:24" },
  { who: "out", text: "Prima mensual: Gs. 685.000 — Incluye 3 beneficiarios sin costo adicional.", time: "10:25" },
  { who: "in",  text: "Sí, me interesa el plan Confort",                       time: "10:42" },
  { who: "in",  text: "¿Cómo continuamos?",                                    time: "10:42" },
];

// Helpers
function fmtGs(n) {
  if (!n && n !== 0) return "—";
  return "Gs. " + Math.round(n).toLocaleString("es-PY");
}
function fmtNum(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("es-PY");
}
function userById(id) { return USERS.find(u => u.id === id); }
function clienteById(id) { return CLIENTES.find(c => c.id === id); }
function planById(id) { return PLANS[id]; }

function estadoBadge(estado) {
  const map = {
    activo:      { label: "Activo",       cls: "badge-success" },
    cotizado:    { label: "Cotizado",     cls: "badge-warning" },
    negociacion: { label: "Negociación",  cls: "badge-info" },
    vencido:     { label: "Vencido",      cls: "badge-error" },
    prospecto:   { label: "Prospecto",    cls: "badge-neutral" },
    contactado:  { label: "Contactado",   cls: "badge-info" },
    pagado:      { label: "Pagado",       cls: "badge-success" },
    pendiente:   { label: "Pendiente",    cls: "badge-warning" },
  };
  return map[estado] || { label: estado, cls: "badge-neutral" };
}

// Channel meta
const CANALES = {
  whatsapp:  { label: "WhatsApp",  ic: "MessageCircle", color: "var(--success)" },
  messenger: { label: "Messenger", ic: "MessageSquare", color: "var(--info)" },
  llamada:   { label: "Llamada",   ic: "Phone",         color: "var(--accent)" },
  email:     { label: "Email",     ic: "Mail",          color: "var(--fg-2)" },
  reunion:   { label: "Reunión",   ic: "Users",         color: "var(--plan-adultos)" },
};

Object.assign(window, {
  PLANS, PLAN_LIST, COVERAGES, ROLES, USERS, CLIENTES, ACTIVIDADES,
  COMISIONES, COMISIONES_HISTORICO, PIPELINE_STAGES, WA_CONVS, WA_TEMPLATES, WA_THREAD,
  CANALES, fmtGs, fmtNum, userById, clienteById, planById, estadoBadge,
});
