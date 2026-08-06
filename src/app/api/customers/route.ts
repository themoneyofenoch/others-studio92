import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * GET /api/customers
 * Returns all customers with their booking stats.
 * Optional query params:
 *   ?search=name  — filter by name/email/phone substring
 *   ?sort=recent|name|spent|visits  — sort order (default: recent)
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const search = req.nextUrl.searchParams.get("search")?.toLowerCase().trim();
  const sort = req.nextUrl.searchParams.get("sort") || "recent";

  const allCustomers = await db.customer.findMany({
    include: { bookings: { orderBy: { startsAt: "asc" } } },
  });

  const now = new Date();

  let rows = allCustomers.map(c => {
    const completed = c.bookings.filter(b => b.status === "completed");
    const upcoming = c.bookings.find(b => b.status === "confirmed" && b.startsAt >= now);
    const lastVisit = completed
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
    const firstVisit = c.bookings[0];
    const totalSpent = completed.reduce((s, b) => s + (b.priceQuoted || 0), 0);
    const lastService = lastVisit?.service;
    // Need to fetch service info separately if not included
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      totalBookings: c.bookings.length,
      completedVisits: completed.length,
      totalSpent,
      lastVisit: lastVisit?.startsAt?.toISOString() || null,
      lastServiceName: null as string | null, // filled below
      nextVisit: upcoming?.startsAt?.toISOString() || null,
      firstVisit: firstVisit?.startsAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    };
  });

  // Fetch service names for last visits in one go
  const lastVisitBookingIds = allCustomers.flatMap(c => {
    const completed = c.bookings.filter(b => b.status === "completed")
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
    return completed[0] ? [completed[0].serviceId] : [];
  });
  const uniqueServiceIds = Array.from(new Set(lastVisitBookingIds));
  const services = await db.service.findMany({ where: { id: { in: uniqueServiceIds } } });
  const serviceMap = new Map(services.map(s => [s.id, s.name]));

  // Map back
  rows = rows.map(r => {
    const cust = allCustomers.find(c => c.id === r.id);
    const lastCompleted = cust?.bookings
      .filter(b => b.status === "completed")
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())[0];
    return {
      ...r,
      lastServiceName: lastCompleted ? serviceMap.get(lastCompleted.serviceId) || null : null,
    };
  });

  // Search filter
  if (search) {
    rows = rows.filter(r =>
      r.name.toLowerCase().includes(search) ||
      (r.email || "").toLowerCase().includes(search) ||
      (r.phone || "").toLowerCase().includes(search)
    );
  }

  // Sort
  if (sort === "name") {
    rows.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "spent") {
    rows.sort((a, b) => b.totalSpent - a.totalSpent);
  } else if (sort === "visits") {
    rows.sort((a, b) => b.completedVisits - a.completedVisits);
  } else {
    // "recent" — most recent activity (last visit or created at)
    rows.sort((a, b) => {
      const aT = a.lastVisit ? new Date(a.lastVisit).getTime() : new Date(a.createdAt).getTime();
      const bT = b.lastVisit ? new Date(b.lastVisit).getTime() : new Date(b.createdAt).getTime();
      return bT - aT;
    });
  }

  return NextResponse.json({
    total: rows.length,
    customers: rows,
  });
}
