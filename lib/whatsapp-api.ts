const BASE_URL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ''

export class WhatsAppWindowExpiredError extends Error {
  constructor() {
    super('La ventana de conversación venció. Usá un template aprobado por Meta.')
    this.name = 'WhatsAppWindowExpiredError'
  }
}

export async function sendTextMessage({
  toPhone,
  body,
}: {
  toPhone: string
  body: string
}): Promise<string> {
  if (!PHONE_ID || !TOKEN) {
    throw new Error('WhatsApp API no configurada')
  }

  const res = await fetch(`${BASE_URL}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { preview_url: false, body },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    if (res.status === 400 || data?.error?.code === 131047) {
      throw new WhatsAppWindowExpiredError()
    }
    throw new Error(data?.error?.message || `Error ${res.status}`)
  }

  return data?.messages?.[0]?.id as string
}

export type BulkContact = {
  id: string
  name: string
  phone: string
  plan?: string
}

export type BulkResult = {
  sent: number
  failed: number
  errors: string[]
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('595')) return digits
  if (digits.startsWith('0')) return '595' + digits.substring(1)
  return '595' + digits
}

export async function sendTemplateMessage({
  toPhone,
  templateName,
  languageCode = 'es_ES',
  namedParameters = {},
}: {
  toPhone: string
  templateName: string
  languageCode?: string
  namedParameters?: Record<string, string>
}): Promise<string> {
  const components = []

  if (Object.keys(namedParameters).length > 0) {
    components.push({
      type: 'body',
      parameters: Object.entries(namedParameters).map(([key, value]) => ({
        type: 'text',
        parameter_name: key,
        text: value,
      })),
    })
  }

  const res = await fetch(`${BASE_URL}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 && { components }),
      },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || `Error ${res.status}`)
  }

  return data?.messages?.[0]?.id as string
}

export async function sendBulkMessages({
  contacts,
  templateName = 'bienvenida_ebsa',
  languageCode = 'es_ES',
  delayMs = 1000,
  onProgress,
}: {
  contacts: BulkContact[]
  templateName?: string
  languageCode?: string
  delayMs?: number
  onProgress?: (sent: number, total: number, contact: BulkContact) => void
}): Promise<BulkResult> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i]

    try {
      await sendTemplateMessage({
        toPhone: formatPhone(contact.phone),
        templateName,
        languageCode,
        namedParameters: { customer_name: contact.name.split(' ')[0] },
      })
      sent++
      onProgress?.(sent, contacts.length, contact)
    } catch (e: any) {
      failed++
      errors.push(`${contact.name}: ${e.message}`)
    }

    if (i < contacts.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  return { sent, failed, errors }
}
