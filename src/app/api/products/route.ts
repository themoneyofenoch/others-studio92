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

  // Length-option prices (Shoulder is the base price). Blank = UI falls back to +$25/+$50/+$90.
  const opt = (v: FormDataEntryValue | null): number | null =>
    v === null || String(v).trim() === "" ? null : Number(v);
  const priceBra = opt(form.get("priceBra"));
  const priceMidback = opt(form.get("priceMidback"));
  const priceWaist = opt(form.get("priceWaist"));
  for (const [label, v] of [["Bra-length price", priceBra], ["Mid-back price", priceMidback], ["Waist price", priceWaist]] as const) {
    if (v !== null && (!Number.isFinite(v) || v < 0)) {
      return NextResponse.json({ error: `${label} must be a non-negative number` }, { status: 400 });
    }
  }

  // Add-ons: JSON array of {label, price} — empty/null means the default list in the UI
  let addons: string | null = null;
  const rawAddons = form.get("addons");
  if (rawAddons !== null && String(rawAddons).trim() !== "") {
    try {
      const parsed = JSON.parse(String(rawAddons));
      if (!Array.isArray(parsed) || parsed.some(a => !a?.label || !Number.isFinite(Number(a.price)) || Number(a.price) < 0)) {
        return NextResponse.json({ error: "Add-ons must be a JSON array of {label, price}" }, { status: 400 });
      }
      addons = JSON.stringify(parsed.map((a: any) => ({ label: String(a.label), price: Number(a.price) })));
    } catch {
      return NextResponse.json({ error: "Add-ons must be valid JSON" }, { status: 400 });
    }
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
      priceBra,
      priceMidback,
      priceWaist,
      addons,
      description,
      imageUrl,
      available,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
