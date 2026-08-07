"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Pencil, Trash2, Package, Image as ImageIcon, DollarSign, Ruler, Scale, Loader2, AlertCircle, Tag,
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

type Product = {
  id: string;
  name: string;
  category: string;
  color: string | null;
  lengthIn: number | null;
  weightG: number | null;
  price: number;
  priceBra: number | null;
  priceMidback: number | null;
  priceWaist: number | null;
  addons: string | null;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
};

const EMPTY_FORM = {
  name: "", category: "Hair", color: "", lengthIn: "", weightG: "", price: "", priceBra: "", priceMidback: "", priceWaist: "", addons: "", description: "", available: true,
};

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/products")
      .then(r => r.json())
      .then(d => { setProducts(d || []); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      color: p.color || "",
      lengthIn: p.lengthIn ? String(p.lengthIn) : "",
      weightG: p.weightG ? String(p.weightG) : "",
      price: String(p.price),
      priceBra: p.priceBra ? String(p.priceBra) : "",
      priceMidback: p.priceMidback ? String(p.priceMidback) : "",
      priceWaist: p.priceWaist ? String(p.priceWaist) : "",
      addons: (() => {
        try {
          const parsed = p.addons ? JSON.parse(p.addons) : null;
          return Array.isArray(parsed) ? parsed.map((a: any) => `${a.label}|${a.price}`).join("\n") : "";
        } catch { return ""; }
      })(),
      description: p.description || "",
      available: p.available,
    });
    setPhoto(null);
    setPhotoPreview(p.imageUrl);
    setDialogOpen(true);
  };

  const onPickPhoto = (f: File | undefined) => {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
      toast.error("Photo must be a JPG, PNG, or WebP image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5MB or smaller.");
      return;
    }
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("name", form.name);
      fd.set("category", form.category);
      fd.set("color", form.color);
      fd.set("lengthIn", form.lengthIn);
      fd.set("weightG", form.weightG);
      fd.set("price", form.price);
      fd.set("priceBra", form.priceBra);
      fd.set("priceMidback", form.priceMidback);
      fd.set("priceWaist", form.priceWaist);
      fd.set("addons", form.addons.trim() === ""
        ? ""
        : JSON.stringify(form.addons.split("\n").map(l => {
            const [label, price] = l.split("|").map(x => (x || "").trim());
            return { label, price: Number(price) };
          }).filter(a => a.label)));
      fd.set("description", form.description);
      fd.set("available", String(form.available));
      if (photo) fd.set("image", photo);

      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(editing ? "Product updated." : "Product created.");
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Product deleted.");
      setConfirmingDelete(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product.");
      setConfirmingDelete(null);
    }
  };

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Products", value: products.length, icon: Package, tone: "text-foreground" },
          { label: "Categories", value: categories.length, icon: Tag, tone: "text-foreground/70" },
          { label: "With photos", value: products.filter(p => p.imageUrl).length, icon: ImageIcon, tone: "text-amber-600" },
        ].map((s, i) => (
          <div key={i} className="p-5 rounded-2xl borderless-card bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold mt-1">{s.value}</p>
              </div>
              <s.icon className={cn("w-5 h-5", s.tone)} />
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="w-4 h-4 mr-1.5" /> Add product
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading products…
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed rounded-2xl">
          No products yet. Add your first product — hair, oils, accessories.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <motion.div key={p.id} layout className="rounded-2xl borderless-card bg-card overflow-hidden">
              <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[p.color, p.lengthIn ? `${p.lengthIn}"` : null, p.weightG ? `${p.weightG}g` : null]
                        .filter(Boolean).join(" · ") || p.category}
                    </p>
                  </div>
                  <Badge variant={p.available ? "default" : "secondary"} className="rounded-full shrink-0">
                    {p.available ? "Available" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-semibold text-lg"><Money value={p.price} /></p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="rounded-full px-2.5 h-8" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline" size="sm" className="rounded-full px-2.5 h-8 text-destructive hover:text-destructive"
                      onClick={() => setConfirmingDelete(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the product details and photo." : "Add a new product to the shop. Photos are optional but recommended."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {/* Photo */}
            <div>
              <Label>Photo</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-muted/60 border border-dashed flex items-center justify-center overflow-hidden shrink-0">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onPickPhoto(e.target.files?.[0])}
                  />
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => fileRef.current?.click()}>
                    <ImageIcon className="w-4 h-4 mr-1.5" /> {photo ? "Change photo" : "Upload photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP · max 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Burmese Curly" required className="mt-1.5" />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Hair" className="mt-1.5" />
              </div>
              <div>
                <Label>Color</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="1B / 4 / 4/27" className="mt-1.5" />
              </div>
              <div>
                <Label>Length (inches)</Label>
                <Input type="number" step="0.5" min="1" value={form.lengthIn} onChange={(e) => setForm({ ...form, lengthIn: e.target.value })} placeholder="18" className="mt-1.5" />
              </div>
              <div>
                <Label>Weight (grams)</Label>
                <Input type="number" min="1" value={form.weightG} onChange={(e) => setForm({ ...form, weightG: e.target.value })} placeholder="150" className="mt-1.5" />
              </div>
              <div className="col-span-2">
                <Label>Price — Shoulder (USD) *</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="140" required className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5">Length options — leave blank to use defaults (+$25 / +$50 / +$90)</p>
              </div>
              <div>
                <Label>Bra-length price</Label>
                <Input type="number" step="0.01" min="0" value={form.priceBra} onChange={(e) => setForm({ ...form, priceBra: e.target.value })} placeholder="165" className="mt-1.5" />
              </div>
              <div>
                <Label>Mid-back price</Label>
                <Input type="number" step="0.01" min="0" value={form.priceMidback} onChange={(e) => setForm({ ...form, priceMidback: e.target.value })} placeholder="190" className="mt-1.5" />
              </div>
              <div className="col-span-2">
                <Label>Waist price</Label>
                <Input type="number" step="0.01" min="0" value={form.priceWaist} onChange={(e) => setForm({ ...form, priceWaist: e.target.value })} placeholder="230" className="mt-1.5" />
              </div>
              <div className="col-span-2">
                <Label>Add-ons (one per line: name | price)</Label>
                <Textarea
                  value={form.addons}
                  onChange={(e) => setForm({ ...form, addons: e.target.value })}
                  placeholder={"Extra fullness|30\nHuman hair upgrade (pending confirmation)|60\nWash & prep|25\nTakedown of old style|100\nBeads & charms|20"}
                  className="mt-1.5"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Leave empty to use the default add-on list.</p>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="150g bundle, 4/27 color…" className="mt-1.5" rows={2} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
                <span className="text-sm text-muted-foreground">Visible in shop</span>
              </div>
              <div className="flex items-center gap-2">
                {editing && (
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => { setDialogOpen(false); setConfirmingDelete(editing.id); }}>
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                )}
                <Button type="submit" className="rounded-full" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                  {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmingDelete} onOpenChange={(v) => !v && setConfirmingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              This removes the product and its photo from the shop. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {products.find(p => p.id === confirmingDelete)?.name}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setConfirmingDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-full" onClick={() => confirmingDelete && remove(confirmingDelete)}>
              Delete product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
