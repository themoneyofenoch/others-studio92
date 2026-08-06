import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.category !== undefined) {
    if (!body.category?.trim()) return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
    data.category = body.category.trim();
  }
  if (body.description !== undefined) data.description = body.description?.trim() || "";
  if (body.durationMin !== undefined) {
    const duration = Number(body.durationMin);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: "Duration must be a positive number (minutes)" }, { status: 400 });
    }
    data.durationMin = duration;
  }
  if (body.priceFrom !== undefined) {
    const price = Number(body.priceFrom);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }
    data.priceFrom = price;
  }
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null;
  if (body.featured !== undefined) data.featured = !!body.featured;

  const service = await db.service.update({ where: { id }, data });
  return NextResponse.json(service);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.service.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const bookingCount = await db.booking.count({ where: { serviceId: id } });
  if (bookingCount > 0) {
    return NextResponse.json(
      { error: `This service has ${bookingCount} booking${bookingCount > 1 ? "s" : ""} — edit it instead of deleting.` },
      { status: 409 }
    );
  }

  await db.service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
