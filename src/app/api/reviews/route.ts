import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const reviews = await db.review.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(reviews);
}
