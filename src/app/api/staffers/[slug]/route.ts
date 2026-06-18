import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
