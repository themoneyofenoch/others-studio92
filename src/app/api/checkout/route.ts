import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

/**
 * POST /api/checkout
 * Body: { bookingId, amountCents, customerName, customerEmail, serviceName }
 *
 * If STRIPE_SECRET_KEY is set: creates a real Stripe Checkout Session
 *   and returns { mode: "stripe", url }
 * If not set: returns { mode: "demo", paymentIntentId } to simulate payment
 *   in the browser. The booking is automatically confirmed after "payment".
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookingId, amountCents, customerName, customerEmail, serviceName } = body;

  if (!bookingId || !amountCents) {
    return NextResponse.json({ error: "Missing bookingId or amountCents" }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  // ─── DEMO MODE ───────────────────────────────────────────────────────────
  if (!stripeKey) {
    // Simulate processing delay & mark booking paid
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
        depositPaid: true,
        paymentIntentId: `demo_pi_${Date.now()}`,
        notes: "Deposit paid (demo mode)",
      },
    });
    return NextResponse.json({
      mode: "demo" as const,
      paymentIntentId: `demo_pi_${Date.now()}`,
      amountCents,
      serviceName,
      customerName,
      customerEmail,
    });
  }

  // ─── STRIPE MODE ─────────────────────────────────────────────────────────
  const stripe = new Stripe(stripeKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Deposit · ${serviceName}`,
            description: `Booking deposit for ${customerName} · Studio 92 Braids`,
          },
        },
      },
    ],
    metadata: {
      bookingId,
      customerName,
      serviceName,
    },
    success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}?payment=success&booking=${bookingId}`,
    cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}?payment=cancelled&booking=${bookingId}`,
  });

  return NextResponse.json({
    mode: "stripe" as const,
    url: session.url,
    sessionId: session.id,
  });
}
