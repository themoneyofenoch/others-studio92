"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, LayoutDashboard, Megaphone, Calendar, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteLanding } from "@/components/site/landing";
import { BookingDashboard } from "@/components/booking/dashboard";
import { MarketingDashboard } from "@/components/marketing/dashboard";
import { AdminLogin } from "@/components/marketing/admin-login";

type View = "home" | "booking" | "marketing";

export default function Home() {
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated";
  const [view, setView] = useState<View>("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Smooth scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [view]);

  const nav: { key: View; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "home", label: "Studio", icon: Scissors },
    { key: "booking", label: "Bookings", icon: Calendar },
    // Marketing is owner-only — hidden from public visitors
    ...(isAdmin ? [{ key: "marketing" as View, label: "Marketing", icon: Megaphone }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setView("home")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-semibold tracking-tight">92</div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight">Studio 92</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Braids · Dallas</span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-muted/60">
            {nav.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={cn(
                  "relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                  view === key ? "text-background" : "text-foreground/70 hover:text-foreground"
                )}
              >
                {view === key && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden sm:inline-flex rounded-full px-5 bg-[#D341A2] hover:bg-[#b82f88] text-white"
              onClick={() => setView("home")}
            >
              Book now
            </Button>
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-muted"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/50 bg-background"
            >
              <div className="px-5 py-3 flex flex-col gap-1">
                {nav.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setView(key); setMobileNavOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                      view === key ? "bg-foreground text-background" : "hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
                <Button size="sm" className="mt-2 rounded-full" onClick={() => { setView("home"); setMobileNavOpen(false); }}>
                  Book now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {view === "home" && <SiteLanding onMarketing={() => setView("marketing")} />}
            {view === "booking" && (isAdmin ? <BookingDashboard /> : <AdminLogin onCancel={() => setView("home")} />)}
            {view === "marketing" && (isAdmin ? <MarketingDashboard /> : <AdminLogin onCancel={() => setView("home")} />)}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-semibold">92</div>
              <span className="font-semibold">Studio 92 Braids</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Dallas-based braids & locs studio. Tension-free installs, scalp-friendly products, on-time appointments.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Visit</h4>
            <p className="text-foreground/80 leading-relaxed">
              9560 Skillman St, Suite #114<br/>Dallas, TX 75243
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Hours</h4>
            <p className="text-foreground/80 leading-relaxed">
              Sun–Thu · 9am – 6pm<br/>Fri–Sat · 7am – 6pm
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Connect</h4>
            <p className="text-foreground/80 leading-relaxed">
              (469) 618-4993<br/>hello@studio92braids.com
            </p>
            <div className="flex gap-3 mt-3">
              <a href="https://www.instagram.com/studio92braids_/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-[#D341A2] text-xs">Instagram</a>
              <a href="https://www.facebook.com/studio92braids/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-[#D341A2] text-xs">Facebook</a>
              <a href="https://www.pinterest.com/studio92braids/" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-[#D341A2] text-xs">Pinterest</a>
            </div>
          </div>
        </div>
        <div className="border-t border-border/30">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} Studio 92 Braids. All rights reserved.</span>
            <span>Dallas · Texas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
