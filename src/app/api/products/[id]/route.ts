import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { saveImage, deleteImageByUrl } from "@/lib/uploads";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const form = await req.formData();
  const data: any = {};

  const name = form.get("name");
  if (name !== null) {
    const v = String(name).trim();
    if (!v) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    data.name = v;
  }
  const category = form.get("category");
  if (category !== null) {
    const v = String(category).trim();
    if (!v) return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
    data.category = v;
  }
  const color = form.get("color");
  if (color !== null) data.color = String(color).trim() || null;

  const lengthIn = form.get("lengthIn");
  if (lengthIn !== null) {
    const v = lengthIn === "" ? null : Number(lengthIn);
    if (v !== null && (!Number.isFinite(v) || v <= 0)) {
      return NextResponse.json({ error: "Length must be a positive number (inches)" }, { status: 400 });
    }
    data.lengthIn = v;
  }
  const weightG = form.get("weightG");
  if (weightG !== null) {
    const v = weightG === "" ? null : Number(weightG);
    if (v !== null && (!Number.isFinite(v) || v <= 0)) {
      return NextResponse.json({ error: "Weight must be a positive number (grams)" }, { status: 400 });
    }
    data.weightG = v;
  }
  const price = form.get("price");
  if (price !== null) {
    const v = Number(price);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
    }
    data.price = v;
  }
  const description = form.get("description");
  if (description !== null) data.description = String(description).trim() || null;
  const available = form.get("available");
  if (available !== null) data.available = available !== "false";

  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    await deleteImageByUrl(existing.imageUrl);
    data.imageUrl = saved.url;
  }

  const product = await db.product.update({ where: { id }, data });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await db.product.delete({ where: { id } });
  await deleteImageByUrl(existing.imageUrl);
  return NextResponse.json({ ok: true });
}
