"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, X, Star, Award, Scissors, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Money } from "@/components/shared/format";
import { cn } from "@/lib/utils";

type Staffer = {
  id: string; name: string; slug: string; role: string; bio: string;
  specialties: string; imageUrl: string; yearsExp: number;
};

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

function durationStr(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function TeamSection({
  onBookStaffer,
}: {
  onBookStaffer: (stafferName: string, serviceId?: string) => void;
}) {
  const [staffers, setStaffers] = useState<Staffer[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [stafferServices, setStafferServices] = useState<{ staffer: Staffer; services: Service[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/staffers").then(r => r.json()).then(setStaffers);
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!selectedSlug) {
      setStafferServices(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/staffers/${selectedSlug}`)
      .then(r => r.json())
      .then(d => { setStafferServices(d); setLoadingDetail(false); });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedSlug]);

  return (
    <section id="team" className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meet the team</span>
        <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Your stylists</h2>
        <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed mx-auto">
          Each of our stylists has their own specialty. Tap a profile to see their services and book directly with them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffers.map((s, i) => {
          const specialties = s.specialties.split(",").filter(Boolean);
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setSelectedSlug(s.slug)}
              className="group text-left rounded-2xl borderless-card bg-card overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                <Image
                  src={s.imageUrl}
                  alt={`${s.name}, ${s.role} at Studio 92 Braids`}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] uppercase tracking-wider bg-background/90 backdrop-blur px-2.5 py-1 rounded-full font-medium">
                    {s.yearsExp}+ yrs
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-base">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.role}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {specialties.slice(0, 3).map(sp => (
                    <span key={sp} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {sp}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">View profile</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Staffer detail dialog */}
      <Dialog open={!!selectedSlug} onOpenChange={(v) => !v && setSelectedSlug(null)}>
        <DialogContent className="sm:max-w-[640px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden max-h-[90vh]">
          {loadingDetail && (
            <>
              <DialogTitle className="sr-only">Staffer profile</DialogTitle>
              <div className="p-12 text-center text-sm text-muted-foreground">Loading stylist profile…</div>
            </>
          )}
          {!loadingDetail && stafferServices && (
            <>
              {/* Header with photo + bio */}
              <div className="relative">
                <div className="grid sm:grid-cols-[200px_1fr] gap-0">
                  <div className="relative aspect-[4/5] sm:aspect-square bg-muted">
                    <Image
                      src={stafferServices.staffer.imageUrl}
                      alt={stafferServices.staffer.name}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <DialogTitle className="text-2xl font-semibold tracking-tight">
                      {stafferServices.staffer.name}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      {stafferServices.staffer.role}
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{stafferServices.staffer.yearsExp}+ years experience</span>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>4.9 rating</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mt-4 line-clamp-4">
                      {stafferServices.staffer.bio}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {stafferServices.staffer.specialties.split(",").filter(Boolean).map((sp: string) => (
                        <Badge key={sp} variant="secondary" className="rounded-full text-[10px]">{sp}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Services list */}
              <div className="border-t border-border/30">
                <div className="px-6 pt-5 pb-2 flex items-center justify-between sticky top-0 bg-card z-10">
                  <div>
                    <h3 className="font-semibold text-sm">Services with {stafferServices.staffer.name}</h3>
                    <p className="text-xs text-muted-foreground">{stafferServices.services.length} services offered</p>
                  </div>
                </div>
                <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto scroll-thin divide-y divide-border/20">
                  {stafferServices.services.map(svc => (
                    <div key={svc.id} className="px-3 py-3 flex items-center gap-3 hover:bg-muted/30 rounded-lg transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{svc.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {durationStr(svc.durationMin)}</span>
                          <span>·</span>
                          <span>{svc.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">from</div>
                        <Money value={svc.priceFrom} className="text-sm font-semibold" />
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full h-8 px-3 text-xs ml-1"
                        onClick={() => {
                          setSelectedSlug(null);
                          onBookStaffer(stafferServices.staffer.name, svc.id);
                        }}
                      >
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="border-t border-border/30 p-5 bg-muted/20">
                <Button
                  className="w-full rounded-full h-11"
                  onClick={() => {
                    setSelectedSlug(null);
                    onBookStaffer(stafferServices.staffer.name);
                  }}
                >
                  <Scissors className="w-4 h-4 mr-1.5" /> Book with {stafferServices.staffer.name}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
