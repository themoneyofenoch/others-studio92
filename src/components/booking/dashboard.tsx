"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon, Clock, Plus, Search, Filter, Check, X,
  AlertCircle, User, Phone, Mail, Scissors, ChevronLeft, ChevronRight,
  CheckCircle2, CalendarCheck2, UserX, CalendarClock, CreditCard, Hourglass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Money } from "@/components/shared/format";
import { cn } from "@/lib/utils";
import { BookingFlow } from "./booking-flow";

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

type Booking = {
  id: string; status: string; stylist: string; startsAt: string; durationMin: number;
  priceQuoted: number | null; notes: string | null;
  depositPaid: boolean;
  depositAmount: number;
  service: Service;
  customer: { id: string; name: string; email: string | null; phone: string | null };
};

const STYLISTS = ["Aaliyah", "Jasmine", "Porsha", "Tanisha"];

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function durationStr(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  confirmed:        { label: "Confirmed",  cls: "bg-emerald-50 text-emerald-700", icon: CalendarCheck2 },
  pending_payment:  { label: "Awaiting payment", cls: "bg-amber-50 text-amber-700", icon: Hourglass },
  completed:        { label: "Completed",  cls: "bg-foreground/5 text-foreground/60", icon: CheckCircle2 },
  cancelled:        { label: "Cancelled",  cls: "bg-rose-50 text-rose-600", icon: X },
  no_show:          { label: "No-show",    cls: "bg-amber-50 text-amber-700", icon: UserX },
};

export function BookingDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [flowOpen, setFlowOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined);
  const [weekOffset, setWeekOffset] = useState(0);

  const load = () => {
    setLoading(true);
    fetch(`/api/bookings?status=${statusFilter}`)
      .then(r => r.json())
      .then(b => { setBookings(b); setLoading(false); });
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { fetch("/api/services").then(r => r.json()).then(setServices); }, []);

  // Week view
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    d.setHours(0,0,0,0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [weekOffset]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(b =>
      b.customer.name.toLowerCase().includes(q) ||
      b.service.name.toLowerCase().includes(q) ||
      b.stylist.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const upcoming = bookings.filter(b => new Date(b.startsAt) >= now && (b.status === "confirmed" || b.status === "pending_payment"));
    const todayCount = bookings.filter(b => new Date(b.startsAt).toDateString() === today && (b.status === "confirmed" || b.status === "pending_payment")).length;
    const completedThisWeek = bookings.filter(b => {
      const d = new Date(b.startsAt);
      return b.status === "completed" && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
    }).length;
    const pendingPayment = bookings.filter(b => b.status === "pending_payment").length;
    return {
      upcoming: upcoming.length,
      today: todayCount,
      completedWeek: completedThisWeek,
      total: bookings.length,
      pendingPayment,
    };
  }, [bookings, weekStart]);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch("/api/bookings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`Marked as ${STATUS_META[status]?.label || status}`);
      load();
    }
  };

  const openNewBooking = (serviceId?: string) => {
    setPreselectedService(serviceId);
    setFlowOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Booking dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage appointments, services, and stylists in one place.</p>
        </div>
        <Button className="rounded-full self-start" onClick={() => openNewBooking()}>
          <Plus className="w-4 h-4 mr-1.5" /> New booking
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Today's appointments", value: stats.today, icon: CalendarClock, tone: "text-foreground" },
          { label: "Upcoming this period", value: stats.upcoming, icon: CalendarCheck2, tone: "text-emerald-600" },
          { label: "Awaiting payment", value: stats.pendingPayment, icon: Hourglass, tone: "text-amber-600" },
          { label: "Completed this week", value: stats.completedWeek, icon: CheckCircle2, tone: "text-foreground/70" },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl borderless-card bg-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={cn("w-4 h-4", s.tone)} strokeWidth={1.5} />
            </div>
            <div className="text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Week calendar */}
      <div className="mb-8 p-5 rounded-2xl borderless-card bg-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">This week</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDay(weekDays[0])} — {fmtDay(weekDays[6])}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setWeekOffset(weekOffset - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setWeekOffset(0)}>Today</Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setWeekOffset(weekOffset + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dayBookings = bookings.filter(b => {
              const bd = new Date(b.startsAt);
              return bd.toDateString() === day.toDateString();
            });
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={cn(
                "min-h-[120px] p-2.5 rounded-xl flex flex-col gap-1.5",
                isToday ? "bg-foreground text-background" : "bg-muted/40"
              )}>
                <div className="text-[10px] uppercase tracking-wider opacity-70">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-lg font-semibold">{day.getDate()}</div>
                <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                  {dayBookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      className={cn(
                        "text-[10px] px-1.5 py-1 rounded-md truncate",
                        isToday ? "bg-background/15" : "bg-card",
                        b.status === "pending_payment" && !isToday && "ring-1 ring-amber-300"
                      )}
                      title={`${fmtTime(b.startsAt)} · ${b.customer.name} · ${b.service.name}${b.status === "pending_payment" ? " (awaiting payment)" : ""}`}
                    >
                      {fmtTime(b.startsAt)} {b.customer.name.split(" ")[0]}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] opacity-60 mt-0.5">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters + list */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, service, or stylist…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 border-0 h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-full bg-muted/50 border-0 h-11 w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending_payment">Awaiting payment</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No-show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings list */}
      <div className="rounded-2xl borderless-card bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-3">Client</div>
          <div className="col-span-3">Service</div>
          <div className="col-span-2">When</div>
          <div className="col-span-1">Stylist</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-2 text-right">Status / Actions</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto scroll-thin">
          {loading && (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading appointments…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="p-10 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No appointments match your filters.</p>
            </div>
          )}
          {!loading && filtered.map((b, i) => {
            const meta = STATUS_META[b.status] || STATUS_META.confirmed;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.015, 0.3) }}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="md:col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {b.customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{b.customer.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{b.customer.phone || b.customer.email || "—"}</div>
                  </div>
                </div>
                <div className="md:col-span-3 flex items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{b.service.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {durationStr(b.durationMin)}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center text-sm">
                  <div>
                    <div>{fmtDate(b.startsAt)}</div>
                    <div className="text-xs text-muted-foreground">{fmtTime(b.startsAt)}</div>
                  </div>
                </div>
                <div className="md:col-span-1 flex items-center text-sm">{b.stylist}</div>
                <div className="md:col-span-1 flex items-center">
                  <div>
                    <Money value={b.priceQuoted} className="text-sm font-medium" />
                    {b.depositPaid && (
                      <div className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <CreditCard className="w-2.5 h-2.5" /> <Money value={b.depositAmount} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center md:justify-end gap-2">
                  <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-medium", meta.cls)}>
                    {meta.label}
                  </span>
                  {b.status === "confirmed" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(b.id, "completed")}
                        className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-600"
                        title="Mark completed"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "no_show")}
                        className="p-1.5 rounded-full hover:bg-amber-50 text-amber-600"
                        title="Mark no-show"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {b.status === "pending_payment" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          // Mark as paid (admin override)
                          await fetch("/api/checkout", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              bookingId: b.id,
                              amountCents: b.depositAmount * 100,
                              customerName: b.customer.name,
                              customerEmail: b.customer.email,
                              serviceName: b.service.name,
                            }),
                          });
                          toast.success("Marked as paid");
                          load();
                        }}
                        className="p-1.5 rounded-full hover:bg-emerald-50 text-emerald-600"
                        title="Mark deposit paid"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <BookingFlow
        open={flowOpen}
        onOpenChange={setFlowOpen}
        services={services}
        preselectedServiceId={preselectedService}
        onCreated={load}
      />
    </div>
  );
}
