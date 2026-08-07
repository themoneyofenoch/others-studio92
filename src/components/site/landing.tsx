"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star, MapPin, Clock, Sparkles, ShieldCheck, Heart, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/shared/format";
import { Badge } from "@/components/ui/badge";
import { BookingFlow } from "@/components/booking/booking-flow";
import { TeamSection } from "./team-section";
import { ProductsSection } from "./products-section";

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

type Review = {
  id: string; author: string; rating: number; text: string; createdAt: string;
};

const CATEGORIES = ["All", "Braids", "Twists", "Crochet", "Scalp", "Maintenance"];

const GALLERY = [
  { src: "/gallery/gallery-knotless.jpg", label: "Knotless Box Braids" },
  { src: "/gallery/gallery-lemonade.jpg", label: "Lemonade Feed-In" },
  { src: "/gallery/gallery-goddess.jpg", label: "Goddess Box Braids" },
  { src: "/gallery/gallery-locs.jpg", label: "Loc Retwist" },
  { src: "/gallery/gallery-jumbo.jpg", label: "Jumbo Knotless" },
  { src: "/gallery/gallery-boho.jpg", label: "Boho Braids" },
  { src: "/gallery/gallery-kids.jpg", label: "Kids Braids" },
  { src: "/gallery/gallery-detail.jpg", label: "Detail Work" },
  { src: "/gallery/gallery-portrait2.jpg", label: "Long Length" },
];

export function SiteLanding({ onMarketing }: { onBook: () => void; onMarketing: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [flowOpen, setFlowOpen] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined);
  const [preselectedStylist, setPreselectedStylist] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(setServices);
    fetch("/api/reviews").then(r => r.json()).then(setReviews);
  }, []);

  const featured = services.filter(s => s.featured).slice(0, 3);
  // Keep the curated category order, then append any new categories added by the owner
  const allCategories = [
    "All",
    ...CATEGORIES.slice(1),
    ...Array.from(new Set(services.map(s => s.category))).filter(c => !CATEGORIES.includes(c)),
  ];
  const MAX_FRONT_SERVICES = 10;
  const [showAllServices, setShowAllServices] = useState(false);
  // Front page shows 10 services: featured first, then the rest. Filtering by category shows the full category.
  const sortedServices = [...services].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  const filteredServices = activeCategory === "All"
    ? sortedServices
    : services.filter(s => s.category === activeCategory);
  const visibleServices = activeCategory === "All" && !showAllServices
    ? filteredServices.slice(0, MAX_FRONT_SERVICES)
    : filteredServices;

  const openBooking = (serviceId?: string) => {
    setPreselectedService(serviceId);
    setPreselectedStylist(undefined);
    setFlowOpen(true);
  };

  const openBookingWithStaffer = (stafferName: string, serviceId?: string) => {
    setPreselectedStylist(stafferName);
    setPreselectedService(serviceId);
    setFlowOpen(true);
  };

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-rose-100/30 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1.5 text-xs font-medium">
                <MapPin className="w-3 h-3 mr-1.5" /> Lake Highlands · Accepting new clients
              </Badge>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                Your braider<br/>
                <span className="italic font-light text-foreground/70">for life.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                Master braiders in Lake Highlands, Dallas. Hair included for many styles — knotless, bora bora, box braids, twists and more, hand-installed with care.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" className="rounded-full px-6 h-12 text-sm bg-[#D341A2] hover:bg-[#b82f88] text-white" onClick={() => openBooking()}>
                  Book appointment <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="ghost" className="rounded-full px-6 h-12 text-sm" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>
                  Browse services
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <span className="text-muted-foreground">4.9 · 200+ reviews</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">12k+</span> braids installed
                </div>
              </div>
            </motion.div>

            {/* Hero visual — real photo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden bg-muted"
            >
              <Image
                src="/gallery/hero-new.jpg"
                alt="Knotless box braids installed at Studio 92 in Dallas"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-end p-6 sm:p-8">
                <div className="bg-background/90 backdrop-blur-md rounded-2xl p-5 borderless-card w-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Most booked</span>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  {featured[0] && (
                    <>
                      <h3 className="text-lg font-semibold">{featured[0].name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{featured[0].description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.floor(featured[0].durationMin/60)}h {featured[0].durationMin%60}m</span>
                          <span>from <Money value={featured[0].priceFrom} className="font-semibold text-foreground" /></span>
                        </div>
                        <Button size="sm" className="rounded-full" onClick={() => openBooking(featured[0].id)}>Book</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="border-y border-border/40 bg-foreground text-background py-4 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-6 text-sm font-medium tracking-wide">
                <span>Miracle Knotless</span><span>·</span>
                <span>Bora Bora</span><span>·</span>
                <span>Box Braids</span><span>·</span>
                <span>Tribal Braids</span><span>·</span>
                <span>Lemonade Braids</span><span>·</span>
                <span>French Curl</span><span>·</span>
                <span>Boho Twist</span><span>·</span>
                <span>Senegalese Twist</span><span>·</span>
                <span>Crochet</span><span>·</span>
                <span>Cornrows</span><span>·</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: "Tension-free installs", desc: "Scalp-friendly technique, no headaches." },
            { icon: Clock, title: "On-time appointments", desc: "We respect your schedule." },
            { icon: Heart, title: "Edge-safe products", desc: "No harsh chemicals, ever." },
            { icon: Sparkles, title: "8+ week longevity", desc: "Braids that actually last." },
          ].map((f, i) => (
            <div key={i} className="flex flex-col gap-2">
              <f.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
              <h4 className="font-semibold text-sm">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Our menu</span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Services & pricing</h2>
            <p className="mt-3 text-muted-foreground max-w-lg leading-relaxed">
              Transparent pricing. A $40 deposit secures your slot — balance due at appointment. Final quote depends on hair length, density, and size.
            </p>
          </div>
          <Button variant="ghost" className="rounded-full self-start text-[#D341A2]" onClick={() => openBooking()}>
            Book a service <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/70 hover:bg-muted/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleServices.map((svc, i) => (
            <motion.div
              key={svc.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
              className="group p-6 rounded-2xl borderless-card bg-card hover:shadow-lg transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{svc.category}</span>
                  <h3 className="font-semibold mt-0.5 leading-tight">{svc.name}</h3>
                </div>
                {svc.featured && <Badge variant="secondary" className="rounded-full text-[10px]">★ Top</Badge>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4 flex-1">{svc.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(svc.durationMin/60)}h {svc.durationMin%60 ? `${svc.durationMin%60}m` : ""}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground block leading-none">from</span>
                  <Money value={svc.priceFrom} className="font-semibold text-base" />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full mt-4 w-full group-hover:bg-foreground group-hover:text-background transition-colors"
                onClick={() => openBooking(svc.id)}
              >
                Book this service
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Show all / fewer toggle — front page lists the first 10 */}
        {activeCategory === "All" && filteredServices.length > MAX_FRONT_SERVICES && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setShowAllServices(v => !v)}
            >
              {showAllServices ? "Show fewer" : `Show all ${filteredServices.length} services`}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}
      </section>

      {/* SHOP SECTION */}
      <ProductsSection />

      {/* TEAM SECTION */}
      <TeamSection onBookStaffer={openBookingWithStaffer} />

      {/* GALLERY */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Our work</span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Recent installs</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            {GALLERY.map((g, i) => (
              <div
                key={i}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer"
              >
                <Image
                  src={g.src}
                  alt={g.label}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="text-xs sm:text-sm text-white font-medium">{g.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About the studio</span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              A Dallas braid studio<br/>built on craft.
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Studio 92 started in a one-chair suite with a simple promise: tension-free braids that respect your edges and last for weeks. Today we're a master braider team in Lake Highlands, Dallas, serving clients across the DFW metroplex.
              </p>
              <p>
                Every install begins with a scalp check and a real conversation about your hair goals, lifestyle, and budget. We don't rush, we don't double-book, and we won't ghost you on appointment day.
              </p>
              <p>
                Whether it's your first set of knotless braids or your ten-year loc retwist, you'll leave with a style you can be proud of — and a scalp that still feels good.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md">
              {[
                { k: "8+ yrs", v: "braiding" },
                { k: "12k+", v: "installs" },
                { k: "5 stylists", v: "on team" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-semibold">{s.k}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-muted">
            <Image
              src="/gallery/hero-studio.jpg"
              alt="Inside the Studio 92 braiding studio in Dallas"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur rounded-2xl p-4 borderless-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-semibold text-sm">A</div>
                <div>
                  <div className="font-medium text-sm">Aaliyah · Founder</div>
                  <div className="text-xs text-muted-foreground">Lead braider, 8 yrs experience</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client love</span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">What Dallas says</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.slice(0, 6).map((r, i) => (
              <div key={r.id} className="p-6 rounded-2xl bg-card borderless-card">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/80 mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {r.author.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">{r.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="relative rounded-3xl bg-foreground text-background p-10 sm:p-16 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/gallery/hero-portrait.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-top"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/40" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-lg">
                Ready for braids that<br/>actually last?
              </h2>
              <p className="mt-4 text-background/70 max-w-md leading-relaxed">
                Book your appointment in under 2 minutes. A $40 deposit secures your slot — pay online, rest easy.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Button size="lg" className="rounded-full px-8 h-12 text-sm bg-[#D341A2] hover:bg-[#b82f88] text-white" onClick={() => openBooking()}>
                <Calendar className="w-4 h-4 mr-1.5" /> Book appointment
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full px-8 h-12 text-sm text-background hover:text-background hover:bg-background/10" onClick={onMarketing}>
                <Lock className="w-4 h-4 mr-1.5" /> Admin login
              </Button>
            </div>
          </div>
        </div>
      </section>

      <BookingFlow
        open={flowOpen}
        onOpenChange={setFlowOpen}
        services={services}
        preselectedServiceId={preselectedService}
        preselectedStylist={preselectedStylist}
      />
    </div>
  );
}
