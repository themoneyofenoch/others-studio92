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
    // Stripe Connect: route the deposit to the owner's connected account (Express),
    // take the platform commission, and let Stripe ACH the owner's share on the
    // payout schedule (daily / 2-day). Set STRIPE_CONNECTED_ACCOUNT to enable.
    ...(process.env.STRIPE_CONNECTED_ACCOUNT
      ? {
          payment_intent_data: {
            transfer_data: { destination: process.env.STRIPE_CONNECTED_ACCOUNT },
            ...((Number(process.env.PLATFORM_FEE_PERCENT) || 0) > 0
              ? { application_fee_amount: Math.round(amountCents * ((Number(process.env.PLATFORM_FEE_PERCENT) || 0) / 100)) }
              : {}),
          },
        }
      : {}),
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
