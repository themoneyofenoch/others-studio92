import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const completed = await db.booking.findMany({
    where: { status: "completed" },
    include: { service: true, customer: true }
  });
  const upcoming = await db.booking.findMany({
    where: { status: "confirmed", startsAt: { gte: now } },
    include: { service: true, customer: true },
    orderBy: { startsAt: "asc" },
    take: 20,
  });

  const totalRevenue = completed.reduce((s, b) => s + (b.priceQuoted || 0), 0);

  const revenueThisMonth = completed
    .filter(b => b.startsAt >= startOfMonth)
    .reduce((s, b) => s + (b.priceQuoted || 0), 0);
  const revenueLastMonth = completed
    .filter(b => b.startsAt >= startOfPrevMonth && b.startsAt <= endOfPrevMonth)
    .reduce((s, b) => s + (b.priceQuoted || 0), 0);
  const revenueDelta = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0;

  const bookingsThisMonth = completed.filter(b => b.startsAt >= startOfMonth).length;
  const avgTicket = completed.length > 0 ? totalRevenue / completed.length : 0;

  const thirtyAgo = new Date(); thirtyAgo.setDate(now.getDate() - 30);
  const last30 = completed.filter(b => b.startsAt >= thirtyAgo);
  const byDay = new Map<string, number>();
  for (const b of last30) {
    const k = b.startsAt.toISOString().slice(0, 10);
    byDay.set(k, (byDay.get(k) || 0) + (b.priceQuoted || 0));
  }
  const dailyRevenue = Array.from(byDay.entries())
    .sort(([a],[b]) => a < b ? -1 : 1)
    .map(([date, revenue]) => ({ date, revenue }));

  const svcMap = new Map<string, { name: string; revenue: number; bookings: number }>();
  for (const b of completed) {
    const k = b.service.name;
    const cur = svcMap.get(k) || { name: k, revenue: 0, bookings: 0 };
    cur.revenue += b.priceQuoted || 0;
    cur.bookings += 1;
    svcMap.set(k, cur);
  }
  const topServices = Array.from(svcMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const campaigns = await db.campaign.findMany();
  const channelMap = new Map<string, { channel: string; spent: number; revenue: number; bookings: number; reach: number; clicks: number }>();
  for (const c of campaigns) {
    const cur = channelMap.get(c.channel) || { channel: c.channel, spent: 0, revenue: 0, bookings: 0, reach: 0, clicks: 0 };
    cur.spent += c.spent;
    cur.revenue += c.revenue;
    cur.bookings += c.bookings;
    cur.reach += c.reach;
    cur.clicks += c.clicks;
    channelMap.set(c.channel, cur);
  }
  const channels = Array.from(channelMap.values()).map(c => ({
    ...c,
    roas: c.spent > 0 ? c.revenue / c.spent : 0,
    ctr: c.reach > 0 ? (c.clicks / c.reach) * 100 : 0,
    conversion: c.clicks > 0 ? (c.bookings / c.clicks) * 100 : 0,
  }));

  const allCustomers = await db.customer.findMany({ include: { bookings: { orderBy: { startsAt: "asc" } } } });
  const newCustomersThisMonth = allCustomers.filter(c => c.bookings[0] && c.bookings[0].startsAt >= startOfMonth).length;

  const returning = allCustomers.filter(c => c.bookings.length > 1).length;
  const returningRate = allCustomers.length > 0 ? (returning / allCustomers.length) * 100 : 0;

  const customers = allCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    totalBookings: c.bookings.length,
    totalSpent: c.bookings.filter(b => b.status === "completed").reduce((s, b) => s + (b.priceQuoted || 0), 0),
    lastVisit: c.bookings.filter(b => b.status === "completed").sort((a,b) => b.startsAt.getTime() - a.startsAt.getTime())[0]?.startsAt || null,
    nextVisit: c.bookings.find(b => b.status === "confirmed" && b.startsAt >= now)?.startsAt || null,
  })).sort((a, b) => b.totalSpent - a.totalSpent);

  return NextResponse.json({
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueDelta,
    bookingsThisMonth,
    avgTicket,
    totalBookings: completed.length,
    upcomingCount: upcoming.length,
    newCustomersThisMonth,
    returningRate,
    totalCustomers: allCustomers.length,
    dailyRevenue,
    topServices,
    channels,
    campaigns,
    upcoming,
    customers,
  });
}
