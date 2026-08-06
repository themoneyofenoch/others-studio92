import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "staffer";
}

export async function GET() {
  const staffers = await db.staffer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(staffers);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { name, role, bio, specialties, imageUrl, yearsExp } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Derive a unique slug from the name
  let slug = slugify(name);
  const existing = await db.staffer.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const staffer = await db.staffer.create({
    data: {
      name: name.trim(),
      slug,
      role: role?.trim() || "Braider",
      bio: bio?.trim() || "",
      specialties: specialties?.trim() || "",
      imageUrl: imageUrl?.trim() || "/gallery/gallery-portrait2.jpg",
      yearsExp: Number(yearsExp) || 1,
    },
  });
  return NextResponse.json(staffer, { status: 201 });
}
