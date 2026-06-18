"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon, Clock, Plus, Search, Filter, Check, X,
  AlertCircle, User, Phone, Mail, Scissors, ChevronLeft, ChevronRight,
  CheckCircle2, CalendarCheck2, UserX, CalendarClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Money } from "@/components/shared/format";
import { cn } from "@/lib/utils";

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

type Booking = {
  id: string; status: string; stylist: string; startsAt: string; durationMin: number;
  priceQuoted: number | null; notes: string | null;
  service: Service;
  customer: { id: string; name: string; email: string | null; phone: string | null };
};

const STYLISTS = ["Aaliyah", "Jasmine", "Porsha", "Tanisha"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

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
  confirmed: { label: "Confirmed", cls: "bg-emerald-50 text-emerald-700", icon: CalendarCheck2 },
  completed: { label: "Completed", cls: "bg-foreground/5 text-foreground/60", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-600", icon: X },
  no_show:   { label: "No-show",   cls: "bg-amber-50 text-amber-700", icon: UserX },
};

export function BookingDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
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
    const upcoming = bookings.filter(b => new Date(b.startsAt) >= now && b.status === "confirmed");
    const todayCount = bookings.filter(b => new Date(b.startsAt).toDateString() === today && b.status === "confirmed").length;
    const completedThisWeek = bookings.filter(b => {
      const d = new Date(b.startsAt);
      return b.status === "completed" && d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
    }).length;
    return {
      upcoming: upcoming.length,
      today: todayCount,
      completedWeek: completedThisWeek,
      total: bookings.length,
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

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Booking dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage appointments, services, and stylists in one place.</p>
        </div>
        <Button className="rounded-full self-start" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New booking
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Today's appointments", value: stats.today, icon: CalendarClock, tone: "text-foreground" },
          { label: "Upcoming this period", value: stats.upcoming, icon: CalendarCheck2, tone: "text-emerald-600" },
          { label: "Completed this week", value: stats.completedWeek, icon: CheckCircle2, tone: "text-foreground/70" },
          { label: "Total in view", value: stats.total, icon: CalendarIcon, tone: "text-foreground/70" },
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
                        isToday ? "bg-background/15" : "bg-card"
                      )}
                      title={`${fmtTime(b.startsAt)} · ${b.customer.name} · ${b.service.name}`}
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
          <SelectTrigger className="rounded-full bg-muted/50 border-0 h-11 w-[180px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
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
                <div className="md:col-span-1 flex items-center text-sm font-medium">
                  <Money value={b.priceQuoted} />
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
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <NewBookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        services={services}
        onCreated={() => { load(); setDialogOpen(false); toast.success("Booking created — client notified."); }}
      />
    </div>
  );
}

function NewBookingDialog({
  open, onOpenChange, services, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  services: Service[];
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [stylist, setStylist] = useState("Aaliyah");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedService = services.find(s => s.id === serviceId);

  const submit = async () => {
    if (!serviceId || !customerName || !date) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    const startsAt = new Date(`${date}T${time}:00`);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId, customerName, customerPhone, customerEmail, stylist,
        startsAt: startsAt.toISOString(), notes,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      onCreated();
      // Reset
      setServiceId(""); setCustomerName(""); setCustomerPhone("");
      setCustomerEmail(""); setDate(""); setNotes("");
    } else {
      toast.error("Failed to create booking.");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl">New booking</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create an appointment. The client will receive a confirmation automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[60vh] overflow-y-auto scroll-thin space-y-4">
          {/* Service */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Service *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Choose a service…" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      · {durationStr(s.durationMin)} · from ${s.priceFrom}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Client name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="Jane Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="(469) 555-0192" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 --translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="jane@email.com" />
              </div>
            </div>
          </div>

          {/* Date / Time / Stylist */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date *</Label>
              <Input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stylist</Label>
              <Select value={stylist} onValueChange={setStylist}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl min-h-[70px]" placeholder="Hair length, color preferences, allergies…" />
          </div>

          {/* Summary */}
          {selectedService && (
            <div className="p-4 rounded-xl bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scissors className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{selectedService.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {durationStr(selectedService.durationMin)} · {stylist}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">from</div>
                <Money value={selectedService.priceFrom} className="font-semibold" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-3 gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
