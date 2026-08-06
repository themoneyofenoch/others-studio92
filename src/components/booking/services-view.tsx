"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Scissors, Clock, DollarSign, Star, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Money } from "@/components/shared/format";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMin: number;
  priceFrom: number;
  imageUrl: string | null;
  featured: boolean;
};

const EMPTY_FORM = {
  name: "", category: "", description: "", durationMin: "", priceFrom: "", imageUrl: "", featured: false,
};

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/services")
      .then(r => r.json())
      .then(d => { setServices(d || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(services.map(s => s.category))).sort();

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setForm({
      name: svc.name,
      category: svc.category,
      description: svc.description || "",
      durationMin: String(svc.durationMin),
      priceFrom: String(svc.priceFrom),
      imageUrl: svc.imageUrl || "",
      featured: svc.featured,
    });
    setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/services/${editing.id}` : "/api/services";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(editing ? "Service updated." : "Service created.");
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save service.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Service deleted.");
      setConfirmingDelete(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete service.");
      setConfirmingDelete(null);
    }
  };

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total services", value: services.length, icon: Scissors, tone: "text-foreground" },
          { label: "Categories", value: categories.length, icon: Clock, tone: "text-foreground/70" },
          { label: "Featured", value: services.filter(s => s.featured).length, icon: Star, tone: "text-amber-600" },
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

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted-foreground">
          Services shown on the public site. Edit prices, durations, or add new ones.
        </p>
        <Button className="rounded-full" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Add service
        </Button>
      </div>

      {/* Services table */}
      <div className="rounded-2xl borderless-card bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-4">Service</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-1 text-right">From</div>
          <div className="col-span-1 text-center">Featured</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto scroll-thin">
          {loading && (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading services…</div>
          )}
          {!loading && services.length === 0 && (
            <div className="p-10 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No services yet. Add your first one.</p>
            </div>
          )}
          {!loading && services.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="md:col-span-4 min-w-0">
                <div className="font-medium text-sm truncate flex items-center gap-2">
                  {svc.name}
                  {svc.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                </div>
                {svc.description && (
                  <div className="text-xs text-muted-foreground truncate">{svc.description}</div>
                )}
              </div>
              <div className="md:col-span-2 flex items-center">
                <Badge variant="secondary" className="rounded-full text-[10px]">{svc.category}</Badge>
              </div>
              <div className="md:col-span-2 flex items-center text-sm text-muted-foreground">
                {Math.floor(svc.durationMin / 60)}h{svc.durationMin % 60 ? ` ${svc.durationMin % 60}m` : ""}
              </div>
              <div className="md:col-span-1 flex items-center md:justify-end text-sm font-medium">
                <Money value={svc.priceFrom} />
              </div>
              <div className="md:col-span-1 flex items-center justify-center">
                <Badge className={cn("rounded-full text-[10px]", svc.featured ? "bg-amber-50 text-amber-700" : "bg-muted text-muted-foreground")}>
                  {svc.featured ? "★" : "—"}
                </Badge>
              </div>
              <div className="md:col-span-2 flex items-center md:justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-full h-8" onClick={() => openEdit(svc)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {confirmingDelete === svc.id ? (
                  <Button
                    size="sm"
                    className="rounded-full h-8 bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => remove(svc.id)}
                  >
                    Confirm?
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 text-rose-600 hover:text-rose-700"
                    onClick={() => { setConfirmingDelete(svc.id); setTimeout(() => setConfirmingDelete(prev => prev === svc.id ? null : prev), 4000); }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
          <form onSubmit={save}>
            <DialogHeader className="p-6 pb-3">
              <DialogTitle className="text-xl">{editing ? "Edit service" : "Add service"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editing ? "Update the service details below." : "New services appear on the public site immediately."}
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Knotless Box Braids (Small)"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category *</Label>
                  <Input
                    required
                    list="service-categories"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    placeholder="Knotless Braids"
                    className="rounded-xl h-11"
                  />
                  <datalist id="service-categories">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Hair length, density, and size affect the final quote."
                  className="rounded-xl min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration (min) *</Label>
                  <Input
                    required
                    type="number"
                    min={15}
                    step={15}
                    value={form.durationMin}
                    onChange={e => setForm({ ...form, durationMin: e.target.value })}
                    placeholder="240"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Price from ($) *</Label>
                  <Input
                    required
                    type="number"
                    min={0}
                    step={5}
                    value={form.priceFrom}
                    onChange={e => setForm({ ...form, priceFrom: e.target.value })}
                    placeholder="150"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Image URL (optional)</Label>
                <Input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/gallery/gallery-knotless.jpg"
                  className="rounded-xl h-11"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div>
                  <div className="text-sm font-medium">Featured</div>
                  <div className="text-xs text-muted-foreground">Show in the "Most booked" row on the homepage</div>
                </div>
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              </div>
            </div>

            <DialogFooter className="p-6 pt-3 gap-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : (editing ? "Save changes" : "Create service")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
