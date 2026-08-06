import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { sendOwnerNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const status = req.nextUrl.searchParams.get("status");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = new Date(from);
    if (to) where.startsAt.lte = new Date(to);
  }

  const bookings = await db.booking.findMany({
    where,
    include: { service: true, customer: true },
    orderBy: { startsAt: "asc" },
    take: 2000,
  });
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { serviceId, customerName, customerPhone, customerEmail, stylist, startsAt, notes } = body;

  let customer = null;
  if (customerPhone) {
    customer = await db.customer.findFirst({ where: { phone: customerPhone } });
  }
  if (!customer && customerEmail) {
    customer = await db.customer.findFirst({ where: { email: customerEmail } });
  }
  if (!customer) {
    customer = await db.customer.create({
      data: { name: customerName || "Guest", email: customerEmail, phone: customerPhone }
    });
  }

  const svc = await db.service.findUnique({ where: { id: serviceId } });
  if (!svc) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // New bookings start as pending_payment until deposit is paid
  const booking = await db.booking.create({
    data: {
      serviceId,
      customerId: customer.id,
      stylist: stylist || "Aaliyah",
      startsAt: new Date(startsAt),
      durationMin: svc.durationMin,
      status: "pending_payment",
      priceQuoted: svc.priceFrom,
      depositAmount: Math.round(svc.priceFrom * 0.25), // 25% deposit
      notes,
    },
    include: { service: true, customer: true }
  });

  // Notify the studio about the new booking (best-effort, never blocks the flow)
  const notifyTo = process.env.ADMIN_EMAIL;
  if (notifyTo) {
    sendOwnerNotification({
      to: notifyTo,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      serviceName: booking.service.name,
      stylist: booking.stylist,
      startsAt: booking.startsAt.toISOString(),
      bookingId: booking.id,
    }).catch(() => {});
  }

  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { id, status, startsAt, serviceId, stylist, notes, priceQuoted } = body;

  const existing = await db.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const data: any = {};
  if (status !== undefined) data.status = status;

  // Reschedule / change time
  if (startsAt !== undefined) {
    const d = new Date(startsAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }
    data.startsAt = d;
  }

  // Change service — recompute duration from the new service
  if (serviceId !== undefined) {
    const svc = await db.service.findUnique({ where: { id: serviceId } });
    if (!svc) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    data.serviceId = svc.id;
    data.durationMin = svc.durationMin;
  }

  if (stylist !== undefined) data.stylist = stylist;
  if (notes !== undefined) data.notes = notes;

  if (priceQuoted !== undefined) {
    const price = Number(priceQuoted);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }
    data.priceQuoted = price;
  }

  const booking = await db.booking.update({
    where: { id },
    data,
    include: { service: true, customer: true }
  });
  return NextResponse.json(booking);
}
