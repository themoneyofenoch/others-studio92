"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Check, Clock, User, Phone, Mail, Scissors,
  Calendar as CalendarIcon, CreditCard, Shield, Loader2, CheckCircle2, Lock, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Money } from "@/components/shared/format";
import { cn } from "@/lib/utils";

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

const STYLISTS = ["Aaliyah", "Jasmine", "Porsha", "Tanisha"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function durationStr(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const STEPS = ["Service", "Schedule", "Details", "Payment", "Done"] as const;
type Step = typeof STEPS[number];

export function BookingFlow({
  open, onOpenChange, services, preselectedServiceId, preselectedStylist, onCompleted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  services: Service[];
  preselectedServiceId?: string;
  preselectedStylist?: string;
  onCompleted?: () => void;
}) {
  const [step, setStep] = useState<Step>("Service");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [stylist, setStylist] = useState("Aaliyah");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExp, setCardExp] = useState("12 / 28");
  const [cardCvc, setCardCvc] = useState("123");
  const [processing, setProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; service: Service; startsAt: string } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      // If both service and stylist preselected → jump straight to schedule
      // If only service → jump to schedule (stylist can still be changed)
      // Otherwise → start at Service picker
      const startStep = (preselectedServiceId || preselectedStylist) ? "Schedule" : "Service";
      setStep(startStep);
      setServiceId(preselectedServiceId || "");
      setStylist(preselectedStylist || "Aaliyah");
      setDate(undefined);
      setTime("09:00");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setCardNumber("4242 4242 4242 4242");
      setCardExp("12 / 28");
      setCardCvc("123");
      setConfirmedBooking(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, preselectedServiceId, preselectedStylist]);

  const selectedService = services.find(s => s.id === serviceId);
  const depositAmount = 40; // flat $40 deposit
  const stepIndex = STEPS.indexOf(step);

  const next = () => setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]);
  const prev = () => setStep(STEPS[Math.max(stepIndex - 1, 0)]);

  const canProceed = () => {
    if (step === "Service") return !!serviceId;
    if (step === "Schedule") return !!serviceId && !!date && !!time;
    if (step === "Details") return !!customerName && !!customerPhone;
    if (step === "Payment") return !!cardNumber && !!cardExp && !!cardCvc;
    return true;
  };

  const handlePay = async () => {
    if (!selectedService || !date) return;
    setProcessing(true);

    // Build start time
    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);

    // 1. Create the booking (status: pending_payment)
    const bookingRes = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId, customerName, customerPhone, customerEmail, stylist,
        startsAt: startsAt.toISOString(), notes,
      }),
    });
    if (!bookingRes.ok) {
      setProcessing(false);
      toast.error("Could not create booking.");
      return;
    }
    const booking = await bookingRes.json();

    // 2. Initiate payment
    const checkoutRes = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        amountCents: depositAmount * 100,
        customerName, customerEmail, serviceName: selectedService.name,
      }),
    });
    const checkout = await checkoutRes.json();

    if (checkout.mode === "stripe" && checkout.url) {
      // Real Stripe — redirect out
      window.location.href = checkout.url;
      return;
    }

    // Demo mode — simulate a small delay then move to confirmation
    await new Promise(r => setTimeout(r, 1400));
    setProcessing(false);
    setConfirmedBooking({
      id: booking.id,
      service: selectedService,
      startsAt: startsAt.toISOString(),
    });
    next();
    toast.success("Deposit paid · booking confirmed!");
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
        {/* Stepper header */}
        <div className="px-6 pt-6 pb-3 border-b border-border/30">
          <DialogTitle className="text-xl mb-1">Book your appointment</DialogTitle>
          <DialogDescription className="mb-4">
            {step === "Done" ? "Your appointment is confirmed." : "Takes less than 2 minutes. A $40 deposit secures your slot."}
          </DialogDescription>
          {step !== "Done" && (
            <div className="flex items-center gap-1.5">
              {STEPS.slice(0, 4).map((s, i) => (
                <div key={s} className="flex-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      i <= stepIndex ? "bg-foreground" : "bg-muted"
                    )}
                  />
                  <div className="text-[10px] uppercase tracking-wider mt-1.5 text-muted-foreground hidden sm:block">
                    {s}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto scroll-thin">
          <AnimatePresence mode="wait">
            {/* STEP 1: SERVICE */}
            {step === "Service" && (
              <motion.div
                key="service"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="p-6 space-y-3"
              >
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all",
                      serviceId === s.id
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.category}</span>
                          {s.featured && <Sparkles className="w-3 h-3 text-amber-500" />}
                        </div>
                        <div className="font-medium mt-0.5">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {durationStr(s.durationMin)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">from</div>
                        <Money value={s.priceFrom} className="font-semibold text-base" />
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* STEP 2: SCHEDULE */}
            {step === "Schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="p-6 space-y-5"
              >
                {selectedService && (
                  <div className="p-3 rounded-xl bg-muted/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{selectedService.name}</span>
                    </div>
                    <button onClick={() => setStep("Service")} className="text-xs text-muted-foreground hover:text-foreground underline">Change</button>
                  </div>
                )}
                {!selectedService && (
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Choose a service *</Label>
                    <Select value={serviceId} onValueChange={setServiceId}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Pick a service…" /></SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">· {durationStr(s.durationMin)} · from ${s.priceFrom}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pick a date</Label>
                  <div className="flex justify-center rounded-xl border border-border p-2">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date(new Date().setHours(0,0,0,0)) || d.getDay() === 1}
                      className="rounded-md"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Closed Mondays.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time</Label>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stylist</Label>
                    <Select value={stylist} onValueChange={setStylist}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DETAILS */}
            {step === "Details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="p-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="Jane Doe" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="(469) 618-4993" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="pl-10 rounded-xl h-11" placeholder="jane@email.com" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes (optional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl min-h-[80px]" placeholder="Hair length, color preferences, allergies, inspiration photo link…" />
                </div>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === "Payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="p-6 space-y-4"
              >
                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/40 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">When</span>
                    <span className="font-medium">
                      {date?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stylist</span>
                    <span className="font-medium">{stylist}</span>
                  </div>
                  <div className="border-t border-border/50 pt-2.5 mt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Service total</span>
                      <Money value={selectedService?.priceFrom} />
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Deposit due now ($40)</span>
                      <Money value={depositAmount} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Balance due at appointment</span>
                      <Money value={(selectedService?.priceFrom || 0) - depositAmount} />
                    </div>
                  </div>
                </div>

                {/* Payment form */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secured by Stripe · Test mode — use card 4242 4242 4242 4242</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Card number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="pl-10 rounded-xl h-11 font-mono" placeholder="4242 4242 4242 4242" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Expiry</Label>
                      <Input value={cardExp} onChange={e => setCardExp(e.target.value)} className="rounded-xl h-11 font-mono" placeholder="MM / YY" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">CVC</Label>
                      <Input value={cardCvc} onChange={e => setCardCvc(e.target.value)} className="rounded-xl h-11 font-mono" placeholder="123" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: DONE */}
            {step === "Done" && confirmedBooking && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                  className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2} />
                </motion.div>
                <h3 className="text-xl font-semibold mb-1">You're booked!</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  A confirmation has been sent to {customerEmail || customerPhone}.
                </p>
                <div className="p-4 rounded-xl bg-muted/40 text-left space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confirmation</span>
                    <span className="font-mono text-xs">{confirmedBooking.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{confirmedBooking.service.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">When</span>
                    <span className="font-medium">
                      {new Date(confirmedBooking.startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}
                      {new Date(confirmedBooking.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stylist</span>
                    <span className="font-medium">{stylist}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Deposit paid</span>
                    <Money value={depositAmount} className="font-semibold text-emerald-600" />
                  </div>
                </div>
                <Button className="w-full rounded-full h-11" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with navigation */}
        {step !== "Done" && (
          <div className="p-6 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
            <Button variant="ghost" className="rounded-full" onClick={prev} disabled={stepIndex === 0}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secure booking</span>
            </div>
            {step === "Payment" ? (
              <Button className="rounded-full" onClick={handlePay} disabled={!canProceed() || processing}>
                {processing ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Processing…</>
                ) : (
                  <>Pay <Money value={depositAmount} className="ml-1" /></>
                )}
              </Button>
            ) : (
              <Button className="rounded-full" onClick={next} disabled={!canProceed()}>
                Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
