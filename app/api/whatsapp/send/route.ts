import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, formatPhone, WhatsAppWindowExpiredError } from '@/lib/whatsapp-api'

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { phone, body } = await req.json()
  if (!phone || !body) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  try {
    const waMessageId = await sendTextMessage({ toPhone: formatPhone(phone), body })
    return NextResponse.json({ waMessageId })
  } catch (e: any) {
    if (e instanceof WhatsAppWindowExpiredError) {
      return NextResponse.json({ error: 'window_expired', message: e.message })
    }
    if (e.message === 'WhatsApp API no configurada') {
      return NextResponse.json({ error: 'not_configured', message: e.message })
    }
    return NextResponse.json({ error: 'send_failed', message: e.message })
  }
}
