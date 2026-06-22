// WhatsApp Webhook + Bot EBSA
// GET  → verificación Meta
// POST → mensajes entrantes + bot automático

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WA_TOKEN                  = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!
const WA_PHONE_ID               = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!
const VERIFY_TOKEN              = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? 'ebsa_webhook_token'
const ORG_ID                    = Deno.env.get('EBSA_ORG_ID') ?? 'a0000000-0000-0000-0000-000000000001'

const WA_API = `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`
const db     = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } },
})

// ── Tipos ──────────────────────────────────────────────────────────────────────

type BotState =
  | 'idle'
  | 'menu'
  | 'menu_tienda'
  | 'asking_name'
  | 'asking_age'
  | 'asking_beneficiaries'
  | 'selecting_plan'
  | 'confirming'
  | 'done'

interface BotContext {
  name?:          string
  age?:           number
  beneficiaries?: number
  planId?:        string
  planName?:      string
}

interface Plan {
  id:      string
  name:    string
  tagline: string
  icon:    string
}

// ── WhatsApp API ───────────────────────────────────────────────────────────────

async function sendText(to: string, body: string): Promise<void> {
  await fetch(WA_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type:    'individual',
      to,
      type: 'text',
      text: { body, preview_url: false },
    }),
  })
}

// ── Sesiones ───────────────────────────────────────────────────────────────────

async function getSession(phone: string) {
  const { data } = await db
    .from('whatsapp_bot_sessions')
    .select('*')
    .eq('phone', phone)
    .eq('org_id', ORG_ID)
    .maybeSingle()

  if (data && new Date(data.expires_at) > new Date()) return data

  // Crear sesión idle si no existe o expiró
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const { data: newSession, error: upsertError } = await db
    .from('whatsapp_bot_sessions')
    .upsert(
      { org_id: ORG_ID, phone, state: 'idle', context: {}, expires_at: expiresAt, updated_at: new Date().toISOString() },
      { onConflict: 'org_id,phone' }
    )
    .select()
    .single()
  if (upsertError) console.error('[BOT] upsert error:', JSON.stringify(upsertError), 'ORG_ID:', ORG_ID, 'phone:', phone)
  return newSession
}

async function updateSession(phone: string, state: BotState, context: BotContext): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const { error } = await db.from('whatsapp_bot_sessions').upsert(
    { org_id: ORG_ID, phone, state, context, expires_at: expiresAt, updated_at: new Date().toISOString() },
    { onConflict: 'org_id,phone' },
  )
  if (error) console.error('[BOT] updateSession error:', JSON.stringify(error), 'state:', state)
  else console.log('[BOT] session updated:', phone, '->', state)
}

// ── Planes ─────────────────────────────────────────────────────────────────────

async function getPlans(): Promise<Plan[]> {
  const { data } = await db
    .from('plan_catalog')
    .select('id, name, tagline, icon')
    .eq('org_id', ORG_ID)
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []) as Plan[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseNumber(text: string): number | null {
  const n = parseInt(text.trim())
  if (!isNaN(n)) return n
  const words: Record<string, number> = {
    uno: 1, una: 1, primero: 1, primera: 1,
    dos: 2, segundo: 2,
    tres: 3, tercero: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
  }
  const clean = text.toLowerCase().trim()
  for (const [word, num] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(clean)) return num
  }
  return null
}

// ── Crear lead en CRM ──────────────────────────────────────────────────────────

async function createLead(phone: string, ctx: BotContext): Promise<void> {
  // Buscar agente disponible
  const { data: agent } = await db
    .from('users')
    .select('id')
    .eq('org_id', ORG_ID)
    .eq('is_active', true)
    .in('role', ['admin', 'supervisor', 'agente'])
    .limit(1)
    .single()

  if (!agent) return

  // Buscar o crear cliente
  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('org_id', ORG_ID)
    .or(`phone.eq.${phone},whatsapp_phone.eq.${phone}`)
    .single()

  let clientId = existing?.id

  if (!clientId) {
    const parts = (ctx.name ?? 'Prospecto WA').split(' ')
    const { data: newClient } = await db
      .from('clients')
      .insert({
        org_id:         ORG_ID,
        agent_id:       agent.id,
        first_name:     parts[0],
        last_name:      parts.slice(1).join(' ') || 'WA',
        phone,
        whatsapp_phone: phone,
        status:         'prospecto',
        lead_source:    'whatsapp_bot',
      })
      .select('id')
      .single()
    clientId = newClient?.id
  }

  if (!clientId) return

  await db.from('activities').insert({
    org_id:      ORG_ID,
    client_id:   clientId,
    agent_id:    agent.id,
    type:        'contacto',
    channel:     'whatsapp',
    subject:     `Lead bot WhatsApp — ${ctx.planName ?? 'sin plan'}`,
    description: [
      `Nombre: ${ctx.name ?? '-'}`,
      `Edad: ${ctx.age ?? '-'} años`,
      `Beneficiarios: ${ctx.beneficiaries ?? 0}`,
      `Plan de interés: ${ctx.planName ?? '-'}`,
      `Teléfono: ${phone}`,
    ].join('\n'),
    status: 'pendiente',
  })
}

// ── Bot principal ──────────────────────────────────────────────────────────────

async function handleBot(phone: string, text: string): Promise<void> {
  const session = await getSession(phone)
  const state   = ((session?.state ?? 'idle') as BotState)
  const ctx     = ((session?.context ?? {}) as BotContext)
  const trimmed = text.trim().toLowerCase()

  // Keywords globales → volver al menú
  if (/^(menu|inicio|hola|buenas|buenos|ola|hi)$/.test(trimmed) && state !== 'idle' && state !== 'menu') {
    await updateSession(phone, 'idle', {})
    await handleBot(phone, text)
    return
  }

  // ── IDLE: bienvenida ────────────────────────────────────────────────────────
  if (state === 'idle') {
    await sendText(phone,
      `👋 ¡Hola! Soy el asistente de *EBSA*.\n\n` +
      `¿En qué te puedo ayudar?\n\n` +
      `1️⃣  Planes de salud EBSA\n` +
      `2️⃣  Cotizar un plan\n` +
      `3️⃣  🛒 Tienda EBSA Multitienda\n` +
      `4️⃣  Hablar con un asesor\n\n` +
      `_Respondé con el número de tu elección._`
    )
    await updateSession(phone, 'menu', {})
    return
  }

  // ── MENU PRINCIPAL ──────────────────────────────────────────────────────────
  if (state === 'menu') {
    const num = parseNumber(text)

    if (num === 1) {
      const plans = await getPlans()
      const list  = plans.map((p, i) => `${i + 1}. ${p.icon} *${p.name}* — ${p.tagline}`).join('\n')
      await sendText(phone,
        `🏥 *Planes EBSA Medicina Prepaga:*\n\n${list}\n\n` +
        `Todos incluyen: consultas médicas, urgencias, análisis, ambulancia e internación.\n\n` +
        `Respondé *2* para cotizar o *4* para hablar con un asesor.`
      )
      await updateSession(phone, 'menu', {})
      return
    }

    if (num === 2) {
      await sendText(phone, `¡Perfecto! Vamos a cotizar tu plan 📋\n\n¿Cuál es tu nombre completo?`)
      await updateSession(phone, 'asking_name', {})
      return
    }

    if (num === 3) {
      await sendText(phone,
        `🛒 *EBSA Multitienda*\n\n` +
        `Productos para tu hogar y tu salud con beneficios exclusivos para afiliados EBSA.\n\n` +
        `¿Qué categoría te interesa?\n\n` +
        `1️⃣  💻 Electrónica\n` +
        `2️⃣  💊 Farmacia / Medicamentos\n` +
        `3️⃣  🩺 Equipos Médicos\n` +
        `4️⃣  🛍️ Ver todas las categorías\n\n` +
        `_Respondé con el número de tu elección._`
      )
      await updateSession(phone, 'menu_tienda', {})
      return
    }

    if (num === 4) {
      await sendText(phone,
        `✅ Un asesor de *EBSA* se va a comunicar con vos a la brevedad.\n\n` +
        `_Gracias por contactarte con EBSA_ 💙`
      )
      await createLead(phone, ctx)
      await updateSession(phone, 'done', {})
      return
    }

    await sendText(phone,
      `Elegí una opción:\n\n1️⃣ Planes de salud\n2️⃣ Cotizar\n3️⃣ Tienda\n4️⃣ Hablar con asesor`
    )
    return
  }

  // ── MENU TIENDA ─────────────────────────────────────────────────────────────
  if (state === 'menu_tienda') {
    const num = parseNumber(text)

    const categorias: Record<number, { nombre: string; url: string; emoji: string }> = {
      1: { nombre: 'Electrónica',            url: 'https://ebsamultitienda.click/categoria/electronica',     emoji: '💻' },
      2: { nombre: 'Farmacia / Medicamentos', url: 'https://ebsamultitienda.click/categoria/farmacia',        emoji: '💊' },
      3: { nombre: 'Equipos Médicos',         url: 'https://ebsamultitienda.click/categoria/equipos-medicos', emoji: '🩺' },
      4: { nombre: 'Todas las categorías',    url: 'https://ebsamultitienda.click',                          emoji: '🛍️' },
    }

    const cat = categorias[num ?? 0]

    if (cat) {
      await sendText(phone,
        `${cat.emoji} *${cat.nombre}*\n\n` +
        `Explorá todos los productos en:\n${cat.url}\n\n` +
        `¿Querés que un asesor te ayude a elegir o consultar disponibilidad? Respondé *SÍ* o *NO*.`
      )
      await updateSession(phone, 'confirming', { ...ctx, planName: `Tienda: ${cat.nombre}` })
      return
    }

    await sendText(phone,
      `Elegí una categoría:\n\n1️⃣ Electrónica\n2️⃣ Farmacia\n3️⃣ Equipos Médicos\n4️⃣ Ver todo`
    )
    return
  }

  // ── ASKING NAME ─────────────────────────────────────────────────────────────
  if (state === 'asking_name') {
    if (text.trim().length < 2) {
      await sendText(phone, '¿Me decís tu nombre completo?')
      return
    }
    const name = text.trim()
    await sendText(phone, `Gracias, *${name}*! 😊\n\n¿Cuántos años tenés?`)
    await updateSession(phone, 'asking_age', { ...ctx, name })
    return
  }

  // ── ASKING AGE ──────────────────────────────────────────────────────────────
  if (state === 'asking_age') {
    const age = parseNumber(text)
    if (!age || age < 1 || age > 99) {
      await sendText(phone, 'Por favor ingresá tu edad en años. Ej: *35*')
      return
    }
    await sendText(phone, `¿Cuántos familiares vas a incluir en el plan?\n_(escribí *0* si es solo para vos)_`)
    await updateSession(phone, 'asking_beneficiaries', { ...ctx, age })
    return
  }

  // ── ASKING BENEFICIARIES ────────────────────────────────────────────────────
  if (state === 'asking_beneficiaries') {
    const bens = parseNumber(text)
    if (bens === null || bens < 0 || bens > 10) {
      await sendText(phone, 'Ingresá el número de familiares del 0 al 10.')
      return
    }
    const plans = await getPlans()
    const list  = plans.map((p, i) => `${i + 1}. ${p.icon} *${p.name}* — ${p.tagline}`).join('\n')
    const who   = bens === 0 ? 'solo para vos' : `para vos + ${bens} familiar${bens > 1 ? 'es' : ''}`
    await sendText(phone,
      `Perfecto, ${who}. 👌\n\n¿Qué plan te interesa?\n\n${list}\n\n` +
      `_Respondé con el número o escribí *3* para que un asesor te dé el precio exacto._`
    )
    await updateSession(phone, 'selecting_plan', { ...ctx, beneficiaries: bens })
    return
  }

  // ── SELECTING PLAN ──────────────────────────────────────────────────────────
  if (state === 'selecting_plan') {
    if (/asesor|agente|precio|costo|cuánto|cuanto/.test(trimmed)) {
      await sendText(phone,
        `✅ Perfecto, *${ctx.name}*! Un asesor de EBSA te va a contactar con el precio personalizado.\n\n` +
        `¡Gracias por tu interés! 💙`
      )
      await createLead(phone, ctx)
      await updateSession(phone, 'done', {})
      return
    }

    const plans = await getPlans()
    const num   = parseNumber(text)
    const plan  = plans[(num ?? 0) - 1]

    if (!plan) {
      const list = plans.map((p, i) => `${i + 1}. ${p.icon} ${p.name}`).join('\n')
      await sendText(phone, `Elegí un número:\n\n${list}`)
      return
    }

    await sendText(phone,
      `Elegiste el plan *${plan.icon} ${plan.name}*. ✅\n\n` +
      `📋 *Resumen:*\n` +
      `👤 Nombre: ${ctx.name}\n` +
      `🎂 Edad: ${ctx.age} años\n` +
      `👨‍👩‍👧 Familiares: ${ctx.beneficiaries}\n` +
      `🏥 Plan: ${plan.name}\n\n` +
      `Un asesor te va a contactar con el precio exacto.\n\n` +
      `¿Confirmás que te contactemos? Respondé *SÍ* o *NO*.`
    )
    await updateSession(phone, 'confirming', { ...ctx, planId: plan.id, planName: plan.name })
    return
  }

  // ── CONFIRMING ──────────────────────────────────────────────────────────────
  if (state === 'confirming') {
    if (/^(sí|si|yes|confirmo|dale|ok|listo|claro|afirmativo)/i.test(trimmed)) {
      await sendText(phone,
        `🎉 ¡Perfecto, *${ctx.name}*! Un asesor de *EBSA* te va a escribir a la brevedad.\n\n` +
        `_EBSA Planes de Salud · Cuidamos tu salud_ 💙`
      )
      await createLead(phone, ctx)
      await updateSession(phone, 'done', {})
      return
    }

    if (/^(no|cancel|salir)/i.test(trimmed)) {
      await sendText(phone, 'Entendido. Si necesitás algo más escribime cuando quieras. ¡Hasta pronto! 👋')
      await updateSession(phone, 'done', {})
      return
    }

    await sendText(phone, 'Respondé *SÍ* para confirmar o *NO* para cancelar.')
    return
  }

  // ── DONE → reiniciar ────────────────────────────────────────────────────────
  await updateSession(phone, 'idle', {})
  await handleBot(phone, text)
}

// ── Deduplicación de mensajes ──────────────────────────────────────────────────

const processed = new Map<string, number>()
function isDuplicate(id: string): boolean {
  const now = Date.now()
  for (const [k, t] of processed) {
    if (now - t > 5 * 60 * 1000) processed.delete(k)
  }
  if (processed.has(id)) return true
  processed.set(id, now)
  return false
}

// ── Handler principal ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // GET: verificación del webhook por Meta
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode')
    const token     = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // POST: eventos entrantes
  let body: any
  try { body = await req.json() }
  catch { return new Response('Bad Request', { status: 400 }) }

  const value = body?.entry?.[0]?.changes?.[0]?.value
  if (!value) return new Response('OK', { status: 200 })

  // Mensajes entrantes → bot
  for (const msg of value.messages ?? []) {
    if (isDuplicate(msg.id)) continue
    const phone = msg.from
    const text  = msg.text?.body?.trim() ?? ''
    if (!text) continue

    try { await handleBot(phone, text) }
    catch (err) { console.error('[EBSA bot]', err) }
  }

  // Status updates → actualizar estado en whatsapp_messages
  for (const status of value.statuses ?? []) {
    await db.from('whatsapp_messages')
      .update({
        status:            status.status,
        status_updated_at: new Date().toISOString(),
      })
      .eq('wa_message_id', status.id)
  }

  return new Response('OK', { status: 200 })
})
