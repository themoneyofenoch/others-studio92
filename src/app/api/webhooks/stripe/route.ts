import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

/**
 * POST /api/webhooks/stripe
 * Receives Stripe events (checkout.session.completed) and confirms the
 * booking when the deposit is actually paid — covers users who never
 * return to the success URL.
 *
 * Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   URL:    https://www.studio92braids.com/api/webhooks/stripe
 *   Events: checkout.session.completed
 * Then put the signing secret (whsec_...) in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!secret || !sig) {
    return NextResponse.json({ error: "Missing webhook signature or secret" }, { status: 400 });
  }
  if (!stripeKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not set" }, { status: 500 });
  }

  const body = await req.text();
  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${e?.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await db.booking.update({
        where: { id: bookingId },
        data: {
          status: "confirmed",
          depositPaid: true,
          paymentIntentId,
          notes: "Deposit paid (Stripe)",
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
