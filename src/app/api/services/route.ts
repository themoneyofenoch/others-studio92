import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({ orderBy: { category: "asc" } });
  return NextResponse.json(services);
}
