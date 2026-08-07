"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Image as ImageIcon, Ruler, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/format";

type Product = {
  id: string;
  name: string;
  category: string;
  color: string | null;
  lengthIn: number | null;
  weightG: number | null;
  price: number;
  description: string | null;
  imageUrl: string | null;
  available: boolean;
};

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d.filter(p => p.available) : []))
      .catch(() => setProducts([]));
  }, []);

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
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-2xl borderless-card bg-background overflow-hidden group"
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
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {p.color && <span>{p.color}</span>}
                  {p.lengthIn && (
                    <span className="inline-flex items-center gap-0.5"><Ruler className="w-3 h-3" />{p.lengthIn}&quot;</span>
                  )}
                  {p.weightG && (
                    <span className="inline-flex items-center gap-0.5"><Scale className="w-3 h-3" />{p.weightG}g</span>
                  )}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-semibold text-lg"><Money amount={p.price} /></p>
                  <a href="tel:+14696184993" className="text-[#D341A2] text-sm font-medium inline-flex items-center">
                    Order <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
