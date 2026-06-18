"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  TrendingUp, Users, Target, DollarSign, MousePointerClick,
  Megaphone, Plus, Eye, Percent, ArrowUpRight, ArrowDownRight,
  Instagram, MessageCircle, Mail, UserPlus, Store, Activity, Pause, Play, LogOut
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Money, CompactMoney, CompactNumber, Delta } from "@/components/shared/format";
import { cn } from "@/lib/utils";
import { AdminLogin } from "./admin-login";

type Stats = {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueDelta: number;
  bookingsThisMonth: number;
  avgTicket: number;
  totalBookings: number;
  upcomingCount: number;
  newCustomersThisMonth: number;
  returningRate: number;
  totalCustomers: number;
  dailyRevenue: { date: string; revenue: number }[];
  topServices: { name: string; revenue: number; bookings: number }[];
  channels: {
    channel: string; spent: number; revenue: number; bookings: number;
    reach: number; clicks: number; roas: number; ctr: number; conversion: number;
  }[];
  campaigns: any[];
  upcoming: any[];
  customers: {
    id: string; name: string; email: string | null; phone: string | null;
    totalBookings: number; totalSpent: number;
    lastVisit: string | null; nextVisit: string | null;
  }[];
};

const CHANNEL_META: Record<string, { label: string; icon: any; color: string }> = {
  instagram: { label: "Instagram", icon: Instagram, color: "#9333ea" },
  tiktok:    { label: "TikTok",    icon: Activity, color: "#0ea5e9" },
  referral:  { label: "Referral",  icon: Users,    color: "#10b981" },
  email:     { label: "Email",     icon: Mail,     color: "#f59e0b" },
  sms:       { label: "SMS",       icon: MessageCircle, color: "#ec4899" },
  "walk-in": { label: "Walk-in",   icon: Store,    color: "#64748b" },
};

const CHART_COLORS = ["#1c1917", "#b45309", "#d97706", "#65a30d", "#7c3aed", "#be185d"];

export function MarketingDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/stats").then(r => r.json()).then(s => { setStats(s); setLoading(false); });
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (status === "authenticated") {
      load();
    } else {
      setLoading(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [status]);

  const updateCampaignStatus = async (id: string, status: string) => {
    await fetch("/api/campaigns", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    toast.success(`Campaign ${status === "active" ? "resumed" : "paused"}`);
    load();
  };

  // Loading state during session check
  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // Not authenticated → show admin login
  if (status !== "authenticated") {
    return <AdminLogin />;
  }

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-muted rounded-2xl animate-pulse mb-6" />
        <div className="h-72 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Marketing dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track revenue, channel performance, and customer retention across campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Signed in as</span>
            <span className="font-medium">{session?.user?.name || "Admin"}</span>
          </div>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
          <Button className="rounded-full" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> New campaign
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label="Total revenue"
          value={<Money value={stats.totalRevenue} />}
          sub={<Delta value={stats.revenueDelta} />}
          icon={DollarSign}
        />
        <KpiCard
          label="This month"
          value={<Money value={stats.revenueThisMonth} />}
          sub={<span className="text-xs text-muted-foreground">vs <Money value={stats.revenueLastMonth} /> last</span>}
          icon={TrendingUp}
        />
        <KpiCard
          label="Avg. ticket"
          value={<Money value={stats.avgTicket} />}
          sub={<span className="text-xs text-muted-foreground">{stats.totalBookings} bookings</span>}
          icon={Target}
        />
        <KpiCard
          label="New customers"
          value={stats.newCustomersThisMonth}
          sub={<span className="text-xs text-muted-foreground">{stats.returningRate.toFixed(0)}% returning</span>}
          icon={UserPlus}
        />
      </div>

      {/* Revenue chart */}
      <div className="p-6 rounded-2xl borderless-card bg-card mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Revenue · last 30 days</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily completed-booking revenue</p>
          </div>
          <Badge variant="secondary" className="rounded-full">
            <span className="text-emerald-600 font-medium">▲</span>
            <span className="ml-1.5">{stats.revenueDelta >= 0 ? "+" : ""}{stats.revenueDelta.toFixed(1)}% MoM</span>
          </Badge>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c1917" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1c1917" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#737373" }}
                tickFormatter={d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                interval={4}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#737373" }}
                tickFormatter={v => `$${v/1000}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]}
                labelFormatter={l => new Date(l).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1c1917" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel performance */}
      <div className="grid lg:grid-cols-3 gap-3 mb-6">
        <div className="lg:col-span-2 p-6 rounded-2xl borderless-card bg-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold">Channel performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Spend vs revenue by acquisition channel</p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.channels.map(c => ({ ...c, name: CHANNEL_META[c.channel]?.label || c.channel }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#737373" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#737373" }} tickFormatter={v => `$${v/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
                  formatter={(v: any, n: string) => [`$${v.toLocaleString()}`, n === "revenue" ? "Revenue" : "Spend"]}
                />
                <Bar dataKey="spent" name="spent" fill="#d4d4d4" radius={[4,4,0,0]} />
                <Bar dataKey="revenue" name="revenue" fill="#1c1917" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="p-6 rounded-2xl borderless-card bg-card">
          <h3 className="font-semibold mb-1">Channel mix</h3>
          <p className="text-xs text-muted-foreground mb-4">Share of total spend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.channels}
                  dataKey="spent"
                  nameKey="channel"
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70}
                  paddingAngle={2}
                >
                  {stats.channels.map((c, i) => (
                    <Cell key={i} fill={CHANNEL_META[c.channel]?.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontSize: 12 }}
                  formatter={(v: any, _n: string, p: any) => [`$${Number(v).toLocaleString()}`, CHANNEL_META[p.payload.channel]?.label || p.payload.channel]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {stats.channels.map(c => (
              <div key={c.channel} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHANNEL_META[c.channel]?.color }} />
                  <span>{CHANNEL_META[c.channel]?.label || c.channel}</span>
                </div>
                <span className="text-muted-foreground"><Money value={c.spent} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="p-6 rounded-2xl borderless-card bg-card mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold">Active campaigns</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{stats.campaigns.length} total · {stats.campaigns.filter(c => c.status === "active").length} running</p>
          </div>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-12 gap-3 pb-3 mb-2 border-b border-border/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">Campaign</div>
              <div className="col-span-1">Channel</div>
              <div className="col-span-2 text-right">Spend / Budget</div>
              <div className="col-span-1 text-right">Reach</div>
              <div className="col-span-1 text-right">Bookings</div>
              <div className="col-span-1 text-right">ROAS</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="divide-y divide-border/30">
              {stats.campaigns.map((c: any, i: number) => {
                const meta = CHANNEL_META[c.channel] || { label: c.channel, icon: Megaphone, color: "#737373" };
                const Icon = meta.icon;
                const roas = c.spent > 0 ? c.revenue / c.spent : 0;
                const budgetPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="grid grid-cols-12 gap-3 py-4 items-center"
                  >
                    <div className="col-span-4">
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden max-w-[200px]">
                        <div className="h-full bg-foreground/70" style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1"><CompactMoney value={c.spent} /> / <Money value={c.budget} /></div>
                    </div>
                    <div className="col-span-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      </div>
                    </div>
                    <div className="col-span-2 text-right text-sm">
                      <CompactNumber value={c.reach} />
                    </div>
                    <div className="col-span-1 text-right text-sm font-medium">{c.bookings}</div>
                    <div className="col-span-1 text-right">
                      <span className={cn("text-sm font-semibold", roas >= 3 ? "text-emerald-600" : roas >= 1 ? "text-foreground" : "text-amber-600")}>
                        {roas.toFixed(1)}x
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full font-medium",
                        c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}>
                        {c.status === "active" ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => updateCampaignStatus(c.id, c.status === "active" ? "paused" : "active")}
                        className="p-1.5 rounded-full hover:bg-muted"
                        title={c.status === "active" ? "Pause" : "Resume"}
                      >
                        {c.status === "active"
                          ? <Pause className="w-3.5 h-3.5" />
                          : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: top services + top customers */}
      <div className="grid lg:grid-cols-2 gap-3">
        {/* Top services */}
        <div className="p-6 rounded-2xl borderless-card bg-card">
          <h3 className="font-semibold mb-1">Top services by revenue</h3>
          <p className="text-xs text-muted-foreground mb-4">All-time completed bookings</p>
          <div className="space-y-3">
            {stats.topServices.map((s, i) => {
              const max = stats.topServices[0]?.revenue || 1;
              const pct = (s.revenue / max) * 100;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <Money value={s.revenue} className="text-sm font-semibold" />
                      <span className="text-xs text-muted-foreground ml-2">· {s.bookings} bk</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="h-full bg-foreground rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top customers */}
        <div className="p-6 rounded-2xl borderless-card bg-card">
          <h3 className="font-semibold mb-1">Top customers</h3>
          <p className="text-xs text-muted-foreground mb-4">By lifetime spend</p>
          <div className="space-y-1 max-h-[340px] overflow-y-auto scroll-thin">
            {stats.customers.slice(0, 12).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.totalBookings} visits · {c.nextVisit ? `next: ${new Date(c.nextVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "no upcoming"}
                  </div>
                </div>
                <div className="text-right">
                  <Money value={c.totalSpent} className="text-sm font-semibold" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={() => { load(); setDialogOpen(false); toast.success("Campaign created."); }} />
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: React.ReactNode; sub: React.ReactNode; icon: any }) {
  return (
    <div className="p-5 rounded-2xl borderless-card bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">{sub}</div>
    </div>
  );
}

function NewCampaignDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [budget, setBudget] = useState("500");
  const [spent, setSpent] = useState("0");
  const [reach, setReach] = useState("0");
  const [clicks, setClicks] = useState("0");
  const [bookings, setBookings] = useState("0");
  const [revenue, setRevenue] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name) { toast.error("Campaign name required."); return; }
    setSubmitting(true);
    await fetch("/api/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, channel, budget, spent, reach, clicks, bookings, revenue }),
    });
    setSubmitting(false);
    setName(""); setBudget("500"); setSpent("0"); setReach("0"); setClicks("0"); setBookings("0"); setRevenue("0");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl">New campaign</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Log a marketing campaign to track spend, reach, and revenue attribution.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2 space-y-4 max-h-[60vh] overflow-y-auto scroll-thin">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Campaign name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11" placeholder="Dallas Summer Braid Drop" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Budget ($)</Label>
              <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="rounded-xl h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Spent ($)</Label>
              <Input type="number" value={spent} onChange={e => setSpent(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reach</Label>
              <Input type="number" value={reach} onChange={e => setReach(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Clicks</Label>
              <Input type="number" value={clicks} onChange={e => setClicks(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bookings</Label>
              <Input type="number" value={bookings} onChange={e => setBookings(e.target.value)} className="rounded-xl h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Attributed revenue ($)</Label>
            <Input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} className="rounded-xl h-11" />
          </div>
        </div>
        <DialogFooter className="p-6 pt-3 gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
