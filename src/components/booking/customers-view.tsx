"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Users, UserPlus, UserCheck, DollarSign, Phone, Mail,
  Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp, AlertCircle, ArrowUpRight,
  Pencil, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Money } from "@/components/shared/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  totalBookings: number;
  completedVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  lastServiceName: string | null;
  nextVisit: string | null;
  firstVisit: string | null;
  createdAt: string;
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtRelative(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
function initials(name: string) {
  return name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase();
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (sort) q.set("sort", sort);
    fetch(`/api/customers?${q.toString()}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.customers || []); setLoading(false); });
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, sort]);

  // Initial load
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = customers.length;
    const newThisMonth = customers.filter(c => {
      if (!c.firstVisit) return false;
      const d = new Date(c.firstVisit);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const returning = customers.filter(c => c.completedVisits >= 2).length;
    const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
    return { total, newThisMonth, returning, totalRevenue };
  }, [customers]);

  const selectedCustomer = customers.find(c => c.id === selectedId);

  const openEdit = (c: Customer) => {
    setEditing(c);
    setEditForm({ name: c.name, phone: c.phone || "", email: c.email || "", notes: c.notes || "" });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success("Client updated.");
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update client.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total clients", value: stats.total, icon: Users, tone: "text-foreground" },
          { label: "New this month", value: stats.newThisMonth, icon: UserPlus, tone: "text-emerald-600" },
          { label: "Returning", value: stats.returning, icon: UserCheck, tone: "text-foreground/70" },
          { label: "Lifetime revenue", value: <Money value={stats.totalRevenue} />, icon: DollarSign, tone: "text-foreground/70" },
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

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 border-0 h-11"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="rounded-full bg-muted/50 border-0 h-11 w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="spent">Total spent</SelectItem>
            <SelectItem value="visits">Visits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer list */}
      <div className="rounded-2xl borderless-card bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-4">Client</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Last visit</div>
          <div className="col-span-1 text-right">Visits</div>
          <div className="col-span-2 text-right">Total spent</div>
          <div className="col-span-1 text-right">Next</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto scroll-thin">
          {loading && (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading clients…</div>
          )}
          {!loading && customers.length === 0 && (
            <div className="p-10 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No clients match your search.</p>
            </div>
          )}
          {!loading && customers.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
              onClick={() => setSelectedId(c.id)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="md:col-span-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials(c.name)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  {c.lastServiceName && (
                    <div className="text-xs text-muted-foreground truncate">Last: {c.lastServiceName}</div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center text-xs text-muted-foreground">
                <span className="truncate">{c.phone || c.email || "—"}</span>
              </div>
              <div className="md:col-span-2 flex items-center text-sm">
                <div>
                  <div>{c.lastVisit ? fmtRelative(c.lastVisit) : "—"}</div>
                  {c.lastVisit && (
                    <div className="text-xs text-muted-foreground">{fmtDate(c.lastVisit)}</div>
                  )}
                </div>
              </div>
              <div className="md:col-span-1 flex items-center md:justify-end text-sm">
                <span className="font-medium">{c.completedVisits}</span>
                <span className="text-xs text-muted-foreground ml-1">/ {c.totalBookings}</span>
              </div>
              <div className="md:col-span-2 flex items-center md:justify-end text-sm font-medium">
                <Money value={c.totalSpent} />
              </div>
              <div className="md:col-span-1 flex items-center md:justify-end">
                {c.nextVisit ? (
                  <Badge variant="secondary" className="rounded-full text-[10px] bg-emerald-50 text-emerald-700">
                    {fmtRelative(c.nextVisit)}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Customer detail drawer */}
      <Dialog open={!!selectedId} onOpenChange={(v) => !v && setSelectedId(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          {selectedCustomer && (
            <>
              <DialogHeader className="p-6 pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center font-semibold">
                    {initials(selectedCustomer.name)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedCustomer.name}</DialogTitle>
                    <DialogDescription className="text-xs">
                      Client since {fmtDate(selectedCustomer.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="px-6 pb-2 space-y-4">
                {/* Contact */}
                <div className="space-y-2">
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`tel:${selectedCustomer.phone}`} className="hover:underline">{selectedCustomer.phone}</a>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`mailto:${selectedCustomer.email}`} className="hover:underline truncate">{selectedCustomer.email}</a>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed visits</div>
                    <div className="text-lg font-semibold mt-1">{selectedCustomer.completedVisits}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total spent</div>
                    <div className="text-lg font-semibold mt-1"><Money value={selectedCustomer.totalSpent} /></div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last visit</div>
                    <div className="text-sm font-medium mt-1">{selectedCustomer.lastVisit ? fmtDate(selectedCustomer.lastVisit) : "—"}</div>
                    {selectedCustomer.lastServiceName && (
                      <div className="text-xs text-muted-foreground">{selectedCustomer.lastServiceName}</div>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-muted/40">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next visit</div>
                    <div className="text-sm font-medium mt-1">
                      {selectedCustomer.nextVisit ? fmtDate(selectedCustomer.nextVisit) : "Not scheduled"}
                    </div>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <div className="text-[10px] uppercase tracking-wider text-amber-700 mb-1">Notes</div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>

              <div className="p-6 pt-3 border-t border-border/30 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Avg. ticket: <Money value={selectedCustomer.completedVisits > 0 ? selectedCustomer.totalSpent / selectedCustomer.completedVisits : 0} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">
                    First visit: {fmtDate(selectedCustomer.firstVisit)}
                  </div>
                  <Button size="sm" className="rounded-full h-8" onClick={() => openEdit(selectedCustomer)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit customer dialog */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
          <form onSubmit={saveEdit}>
            <DialogHeader className="p-6 pb-3">
              <DialogTitle className="text-xl">Edit client</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update contact details and notes.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label>
                <Input
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="(469) 555-0100"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="client@email.com"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Preferences, allergies, hair history…"
                  className="rounded-xl min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-3 gap-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
