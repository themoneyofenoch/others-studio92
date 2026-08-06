import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  await db.booking.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
