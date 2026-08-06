"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Users, UserPlus, Clock, AlertCircle, Loader2, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Staffer = {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  specialties: string;
  imageUrl: string;
  yearsExp: number;
};

const EMPTY_FORM = {
  name: "", role: "", bio: "", specialties: "", yearsExp: "", imageUrl: "",
};

function initials(name: string) {
  return name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase();
}

export function StaffersView() {
  const [staffers, setStaffers] = useState<Staffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Staffer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/staffers")
      .then(r => r.json())
      .then(d => { setStaffers(d || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: Staffer) => {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role,
      bio: s.bio || "",
      specialties: s.specialties || "",
      yearsExp: String(s.yearsExp),
      imageUrl: s.imageUrl,
    });
    setDialogOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/staffers/${editing.slug}` : "/api/staffers";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(editing ? "Stylist updated." : "Stylist added.");
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save stylist.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    try {
      const res = await fetch(`/api/staffers/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Stylist removed.");
      setConfirmingDelete(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete stylist.");
      setConfirmingDelete(null);
    }
  };

  const yearsTotal = staffers.reduce((s, x) => s + x.yearsExp, 0);

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Stylists on team", value: staffers.length, icon: Users, tone: "text-foreground" },
          { label: "Combined experience", value: `${yearsTotal}+ yrs`, icon: Award, tone: "text-foreground/70" },
          { label: "Specialties", value: new Set(staffers.flatMap(s => s.specialties.split(",").map(x => x.trim()).filter(Boolean))).size, icon: Clock, tone: "text-foreground/70" },
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
          Stylists shown in the "Your stylists" section on the public site.
        </p>
        <Button className="rounded-full" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" /> Add stylist
        </Button>
      </div>

      {/* Stylists table */}
      <div className="rounded-2xl borderless-card bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
          <div className="col-span-4">Stylist</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Specialties</div>
          <div className="col-span-1 text-right">Exp</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-border/30 max-h-[600px] overflow-y-auto scroll-thin">
          {loading && (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading stylists…</div>
          )}
          {!loading && staffers.length === 0 && (
            <div className="p-10 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">No stylists yet. Add your first one.</p>
            </div>
          )}
          {!loading && staffers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden">
                  {s.imageUrl && s.imageUrl !== "/gallery/gallery-portrait2.jpg" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    initials(s.name)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{s.name}</div>
                  {s.bio && <div className="text-xs text-muted-foreground truncate">{s.bio}</div>}
                </div>
              </div>
              <div className="md:col-span-2 flex items-center text-sm">{s.role}</div>
              <div className="md:col-span-3 flex items-center flex-wrap gap-1">
                {s.specialties.split(",").map(x => x.trim()).filter(Boolean).map(spec => (
                  <Badge key={spec} variant="secondary" className="rounded-full text-[10px]">{spec}</Badge>
                ))}
              </div>
              <div className="md:col-span-1 flex items-center md:justify-end text-sm text-muted-foreground">
                {s.yearsExp}+ yrs
              </div>
              <div className="md:col-span-2 flex items-center md:justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-full h-8" onClick={() => openEdit(s)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {confirmingDelete === s.id ? (
                  <Button
                    size="sm"
                    className="rounded-full h-8 bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => remove(s.slug)}
                  >
                    Confirm?
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 text-rose-600 hover:text-rose-700"
                    onClick={() => { setConfirmingDelete(s.id); setTimeout(() => setConfirmingDelete(prev => prev === s.id ? null : prev), 4000); }}
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
              <DialogTitle className="text-xl">{editing ? "Edit stylist" : "Add stylist"}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editing ? "Update the stylist details below." : "New stylists appear in the team section on the public site."}
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
                    placeholder="Aaliyah"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
                  <Input
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    placeholder="Braider · Cornrow Specialist"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                <Textarea
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Short bio shown on the team section…"
                  className="rounded-xl min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Specialties (comma-separated)</Label>
                  <Input
                    value={form.specialties}
                    onChange={e => setForm({ ...form, specialties: e.target.value })}
                    placeholder="Knotless Braids, Box Braids, Kids"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Years experience</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={form.yearsExp}
                    onChange={e => setForm({ ...form, yearsExp: e.target.value })}
                    placeholder="5"
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Photo URL (optional)</Label>
                <Input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/gallery/gallery-portrait2.jpg"
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-3 gap-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full" disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : (editing ? "Save changes" : "Add stylist")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
