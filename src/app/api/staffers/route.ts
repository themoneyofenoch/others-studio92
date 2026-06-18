import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const staffers = await db.staffer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(staffers);
}
