import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const staffer = await db.staffer.findUnique({ where: { slug } });
  if (!staffer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get all services, filter by staffer's specialties (CSV)
  const allServices = await db.service.findMany({ orderBy: { category: "asc" } });
  const specialties = staffer.specialties.split(",").map(s => s.trim());
  const services = allServices.filter(s => specialties.includes(s.category));

  return NextResponse.json({ staffer, services });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await params;
  const existing = await db.staffer.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Stylist not found" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.role !== undefined) data.role = body.role?.trim() || "Braider";
  if (body.bio !== undefined) data.bio = body.bio?.trim() || "";
  if (body.specialties !== undefined) data.specialties = body.specialties?.trim() || "";
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || "/gallery/gallery-portrait2.jpg";
  if (body.yearsExp !== undefined) {
    const years = Number(body.yearsExp);
    data.yearsExp = Number.isFinite(years) && years >= 0 ? years : existing.yearsExp;
  }

  const staffer = await db.staffer.update({ where: { slug }, data });
  return NextResponse.json(staffer);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await params;
  const existing = await db.staffer.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Stylist not found" }, { status: 404 });

  // Bookings reference the stylist by name (string), so deletion is safe — keep history intact.
  await db.staffer.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
