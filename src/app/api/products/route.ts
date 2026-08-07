import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { saveImage, deleteImageByUrl } from "@/lib/uploads";

export async function GET() {
  const products = await db.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await req.formData();
  const name = String(form.get("name") || "").trim();
  const category = String(form.get("category") || "Hair").trim();
  const color = String(form.get("color") || "").trim() || null;
  const lengthIn = form.get("lengthIn") ? Number(form.get("lengthIn")) : null;
  const weightG = form.get("weightG") ? Number(form.get("weightG")) : null;
  const price = Number(form.get("price"));
  const description = String(form.get("description") || "").trim() || null;
  const available = form.get("available") !== "false";
  const file = form.get("image");

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }
  if (lengthIn !== null && (!Number.isFinite(lengthIn) || lengthIn <= 0)) {
    return NextResponse.json({ error: "Length must be a positive number (inches)" }, { status: 400 });
  }
  if (weightG !== null && (!Number.isFinite(weightG) || weightG <= 0)) {
    return NextResponse.json({ error: "Weight must be a positive number (grams)" }, { status: 400 });
  }

  let imageUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 400 });
    imageUrl = saved.url;
  }

  const product = await db.product.create({
    data: {
      name,
      category,
      color,
      lengthIn,
      weightG,
      price,
      description,
      imageUrl,
      available,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
