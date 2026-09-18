import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

type OrderForPayment = {
  id: string
  order_items: { product_name: string; quantity: number; price: number }[]
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Płatności online są obecnie niedostępne.' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Zaloguj się, aby opłacić zamówienie.' }, { status: 401 })
  }

  let orderId: unknown
  try {
    ;({ orderId } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe żądanie.' }, { status: 400 })
  }
  if (typeof orderId !== 'string' || orderId.length === 0) {
    return NextResponse.json({ error: 'Brak identyfikatora zamówienia.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_items(product_name, quantity, price)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .maybeSingle()

  const order = data as OrderForPayment | null
  if (error || !order || order.order_items.length === 0) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin

  try {
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'],
      line_items: order.order_items.map((item) => ({
        price_data: {
          currency: 'pln',
          product_data: { name: item.product_name },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      customer_email: user.email,
      success_url: `${appUrl}/dashboard?success=true&order_id=${order.id}`,
      cancel_url: `${appUrl}/dashboard?order_id=${order.id}`,
      metadata: { orderId: order.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return NextResponse.json(
      { error: 'Wystąpił błąd przy inicjalizacji płatności Stripe.' },
      { status: 500 }
    )
  }
}
