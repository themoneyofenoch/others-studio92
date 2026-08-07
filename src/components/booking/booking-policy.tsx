"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Deposit & payment",
    items: [
      "Deposits are non-refundable but go toward your final balance.",
      "Remaining balance must be paid in cash.",
      "Payment is due within 1 hour of service start.",
    ],
  },
  {
    title: "Before your appointment",
    items: [
      "Hair must be at least 4–5 inches long. Short hair may incur a $30–$50 fee — please send a photo before booking.",
      "Arrive with hair washed and blow-dried, or book these services in advance.",
      "Do not book if you have any scalp conditions.",
    ],
  },
  {
    title: "During your service",
    items: [
      "We style clients in front of a mirror — speak up about size or parting preferences during the process.",
      "We do not offer re-dos or refunds after completion.",
    ],
  },
  {
    title: "Children & scheduling",
    items: [
      "Children under 5 are not permitted unless receiving a service.",
      "Please do not schedule other appointments on braid day — timing varies and we prioritize quality over speed.",
    ],
  },
  {
    title: "Braiding hair (bring your own)",
    items: [
      "Use pre-stretched Expression or Freetress brand hair. Choose length based on your desired style.",
      "For human hair boho styles: Freetress bulk, Empire bulk, or Organique Breezy Wave Shake-N-Go bulk.",
    ],
  },
  {
    title: "Repairs & issues",
    items: [
      "Contact us within 48 hours if braids unravel or loosen — we're happy to repair.",
      "We offer repairs only, no refunds.",
    ],
  },
  {
    title: "Contact & response time",
    items: [
      "Text is best. We respond within 24 hours, except on Sundays & Mondays (our days off).",
    ],
  },
];

export function BookingPolicy({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-2xl border border-border/40", className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <FileText className="w-4 h-4 text-muted-foreground" />
          Booking policy
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {SECTIONS.map(s => (
                <div key={s.title}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80">{s.title}</p>
                  <ul className="mt-1.5 space-y-1">
                    {s.items.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
                        <span className="text-foreground/40">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-xs text-muted-foreground italic">We appreciate your business and look forward to serving you!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
