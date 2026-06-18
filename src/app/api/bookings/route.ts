import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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
    take: 200,
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

  const booking = await db.booking.create({
    data: {
      serviceId,
      customerId: customer.id,
      stylist: stylist || "Aaliyah",
      startsAt: new Date(startsAt),
      durationMin: svc.durationMin,
      status: "confirmed",
      priceQuoted: svc.priceFrom,
      notes,
    },
    include: { service: true, customer: true }
  });
  return NextResponse.json(booking);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  const booking = await db.booking.update({
    where: { id },
    data: { status },
    include: { service: true, customer: true }
  });
  return NextResponse.json(booking);
}
