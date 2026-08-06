import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const campaigns = await db.campaign.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const campaign = await db.campaign.create({
    data: {
      name: body.name,
      channel: body.channel,
      status: body.status || "active",
      budget: Number(body.budget) || 0,
      spent: Number(body.spent) || 0,
      reach: Number(body.reach) || 0,
      clicks: Number(body.clicks) || 0,
      bookings: Number(body.bookings) || 0,
      revenue: Number(body.revenue) || 0,
    }
  });
  return NextResponse.json(campaign);
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { id, status } = body;
  const c = await db.campaign.update({ where: { id }, data: { status } });
  return NextResponse.json(c);
}
