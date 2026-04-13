import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string || 'sk_test_123', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(req: Request) {
  try {
    const { items, orderId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Koszyk jest pusty' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Przekształcamy elementy koszyka na typy Stripe (Line Items)
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'pln',
        product_data: {
          name: item.product.name,
          images: item.product.image_url ? [item.product.image_url] : [],
        },
        unit_amount: Math.round(item.product.price * 100), // Stripe używa groszy
      },
      quantity: item.quantity,
    }));

    // Tworzenie sesji Checkout w Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'], // Wsparcie dla karty i np blika
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?canceled=true`,
      metadata: {
        orderId: orderId, // Pamiętamy ID zamówienia Supabase
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd przy inicjalizacji płatności Stripe.' },
      { status: 500 }
    );
  }
}
