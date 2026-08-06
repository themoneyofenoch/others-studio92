import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.customer.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) {
    if (!body.name?.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;

  const customer = await db.customer.update({ where: { id }, data });
  return NextResponse.json(customer);
}
