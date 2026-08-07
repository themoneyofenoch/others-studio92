"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Image as ImageIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
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

type LengthKey = "shoulder" | "bra" | "midback" | "waist";

const LENGTHS: { key: LengthKey; label: string; note: string }[] = [
  { key: "shoulder", label: "Shoulder", note: "Included" },
  { key: "bra", label: "Bra-length", note: "+$25" },
  { key: "midback", label: "Mid-back", note: "+$50" },
  { key: "waist", label: "Waist", note: "+$90" },
];

type Addon = { label: string; price: number };

const DEFAULT_ADDONS: Addon[] = [
  { label: "Extra fullness", price: 30 },
  { label: "Human hair upgrade (pending confirmation)", price: 60 },
  { label: "Wash & prep", price: 25 },
  { label: "Takedown of old style", price: 100 },
  { label: "Beads & charms", price: 20 },
];

function productAddons(p: Product): Addon[] {
  if (!p.addons) return DEFAULT_ADDONS;
  try {
    const parsed = JSON.parse(p.addons);
    return Array.isArray(parsed) ? parsed : DEFAULT_ADDONS;
  } catch {
    return DEFAULT_ADDONS;
  }
}

function lengthExtra(p: Product, key: LengthKey): number {
  if (key === "bra") return p.priceBra ?? 25;
  if (key === "midback") return p.priceMidback ?? 50;
  if (key === "waist") return p.priceWaist ?? 90;
  return 0;
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [lengthKey, setLengthKey] = useState<LengthKey>("shoulder");
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d.filter(p => p.available) : []))
      .catch(() => setProducts([]));
  }, []);

  const openProduct = (p: Product) => {
    setSelected(p);
    setLengthKey("shoulder");
    setSelectedAddons(new Set());
  };

  const toggleAddon = (i: number) => {
    setSelectedAddons(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const addonTotal = selected
    ? [...selectedAddons].reduce((sum, i) => sum + (productAddons(selected)[i]?.price ?? 0), 0)
    : 0;

  if (products.length === 0) return null;

  return (
    <section id="shop" className="bg-muted/30 py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Shop</span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Hair for your install</h2>
            <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed">
              Premium bundles ready at the studio — or call ahead and we&apos;ll have your color and length waiting.
            </p>
          </div>
          <a href="tel:+14696184993" className="shrink-0">
            <Button variant="ghost" className="rounded-full self-start text-[#D341A2]">
              <Phone className="w-4 h-4 mr-1.5" /> Call to order
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              onClick={() => openProduct(p)}
              className="text-left rounded-2xl borderless-card bg-background overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold leading-snug">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.color || p.category}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-semibold text-lg">
                    <span className="text-[10px] text-muted-foreground font-normal block leading-none">from</span>
                    <Money value={p.price} />
                  </p>
                  <span className="text-[#D341A2] text-sm font-medium">View options →</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Product dialog with length options */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-[720px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden max-h-[90vh]">
          {selected && (
            <div className="grid sm:grid-cols-2">
              <div className="relative aspect-square sm:aspect-auto sm:min-h-[420px] bg-muted/50">
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.imageUrl} alt={selected.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8 flex flex-col">
                <DialogTitle className="text-2xl font-semibold tracking-tight">{selected.name}</DialogTitle>
                <DialogDescription className="mt-1">
                  {[selected.color, selected.weightG ? `${selected.weightG}g` : null].filter(Boolean).join(" · ") || selected.category}
                </DialogDescription>
                {selected.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{selected.description}</p>
                )}

                {/* Length options */}
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 mb-2">Length</p>
                  <div className="space-y-2">
                    {LENGTHS.map(l => {
                      const extra = lengthExtra(selected, l.key);
                      const active = lengthKey === l.key;
                      return (
                        <button
                          key={l.key}
                          type="button"
                          onClick={() => setLengthKey(l.key)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors",
                            active
                              ? "border-[#D341A2] bg-[#D341A2]/5"
                              : "border-border/60 hover:border-[#D341A2]/40"
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <span className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center",
                              active ? "border-[#D341A2] bg-[#D341A2]" : "border-muted-foreground/40"
                            )}>
                              {active && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                            {l.label}
                          </span>
                          <span className={cn("font-medium", extra > 0 ? "text-muted-foreground" : "text-emerald-600")}>
                            {extra > 0 ? `+$${extra}` : "Included"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add-ons */}
                {productAddons(selected).length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 mb-2">Add-ons</p>
                    <div className="space-y-2">
                      {productAddons(selected).map((a, i) => {
                        const active = selectedAddons.has(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleAddon(i)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors",
                              active
                                ? "border-[#D341A2] bg-[#D341A2]/5"
                                : "border-border/60 hover:border-[#D341A2]/40"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center",
                                active ? "border-[#D341A2] bg-[#D341A2]" : "border-muted-foreground/40"
                              )}>
                                {active && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              {a.label}
                            </span>
                            <span className="font-medium text-muted-foreground">+${a.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Price · {LENGTHS.find(l => l.key === lengthKey)?.label}
                        {selectedAddons.size > 0 && ` + ${selectedAddons.size} add-on${selectedAddons.size > 1 ? "s" : ""}`}
                      </p>
                      <p className="text-3xl font-semibold mt-0.5">
                        <Money value={selected.price + lengthExtra(selected, lengthKey) + addonTotal} />
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">Sold at studio</Badge>
                  </div>
                  <a href="tel:+14696184993" className="block">
                    <Button className="rounded-full w-full bg-[#D341A2] hover:bg-[#b82f88] text-white h-12">
                      <Phone className="w-4 h-4 mr-2" /> Call to order · (469) 618-4993
                    </Button>
                  </a>
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    Reserve your bundle by phone — we&apos;ll have it ready for your install.
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
