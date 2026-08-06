import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const services = await db.service.findMany({ orderBy: { category: "asc" } });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { name, category, description, durationMin, priceFrom, imageUrl, featured } = body;

  if (!name?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
  }
  const duration = Number(durationMin);
  const price = Number(priceFrom);
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Duration must be a positive number (minutes)" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 });
  }

  const service = await db.service.create({
    data: {
      name: name.trim(),
      category: category.trim(),
      description: description?.trim() || "",
      durationMin: duration,
      priceFrom: price,
      imageUrl: imageUrl?.trim() || null,
      featured: !!featured,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
