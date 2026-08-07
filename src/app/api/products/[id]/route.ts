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

  // Length-option prices — empty string clears back to the default ladder
  const opt = (v: FormDataEntryValue | null): number | null | undefined => {
    if (v === null) return undefined;
    return String(v).trim() === "" ? null : Number(v);
  };
  for (const [field, label] of [["priceBra", "Bra-length price"], ["priceMidback", "Mid-back price"], ["priceWaist", "Waist price"]] as const) {
    const v = opt(form.get(field));
    if (v !== undefined) {
      if (v !== null && (!Number.isFinite(v) || v < 0)) {
        return NextResponse.json({ error: `${label} must be a non-negative number` }, { status: 400 });
      }
      data[field] = v;
    }
  }

  // Add-ons: JSON array of {label, price} — empty string clears to the default list
  const rawAddons = form.get("addons");
  if (rawAddons !== null) {
    const v = String(rawAddons).trim();
    if (v === "") {
      data.addons = null;
    } else {
      try {
        const parsed = JSON.parse(v);
        if (!Array.isArray(parsed) || parsed.some(a => !a?.label || !Number.isFinite(Number(a.price)) || Number(a.price) < 0)) {
          return NextResponse.json({ error: "Add-ons must be a JSON array of {label, price}" }, { status: 400 });
        }
        data.addons = JSON.stringify(parsed.map((a: any) => ({ label: String(a.label), price: Number(a.price) })));
      } catch {
        return NextResponse.json({ error: "Add-ons must be valid JSON" }, { status: 400 });
      }
    }
  }

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
