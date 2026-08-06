"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const STYLISTS = ["Aaliyah", "Jasmine", "Porsha", "Tanisha"];

type Service = {
  id: string; name: string; category: string; description: string;
  durationMin: number; priceFrom: number; featured: boolean;
};

type Booking = {
  id: string; status: string; stylist: string; startsAt: string; durationMin: number;
  priceQuoted: number | null; notes: string | null;
  depositPaid: boolean;
  depositAmount: number;
  service: Service;
  customer: { id: string; name: string; email: string | null; phone: string | null };
};

function toLocalDate(d: string | Date) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function toLocalTime(d: string | Date) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function AppointmentEditDialog({
  open, onOpenChange, booking, services, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: Booking | null;
  services: Service[];
  onSaved: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [serviceId, setServiceId] = useState("");
  const [stylist, setStylist] = useState(STYLISTS[0]);
  const [notes, setNotes] = useState("");
  const [priceQuoted, setPriceQuoted] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync form when a booking is opened
  useEffect(() => {
    if (booking) {
      setDate(toLocalDate(booking.startsAt));
      setTime(toLocalTime(booking.startsAt));
      setServiceId(booking.service.id);
      setStylist(booking.stylist);
      setNotes(booking.notes || "");
      setPriceQuoted(booking.priceQuoted != null ? String(booking.priceQuoted) : "");
    }
  }, [booking]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSaving(true);
    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          startsAt,
          serviceId,
          stylist,
          notes,
          priceQuoted: priceQuoted ? Number(priceQuoted) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success("Appointment updated.");
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update appointment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl border-0 shadow-xl p-0 overflow-hidden">
        <form onSubmit={save}>
          <DialogHeader className="p-6 pb-3">
            <DialogTitle className="text-xl">Edit appointment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {booking ? `${booking.customer.name} · ${booking.service.name}` : "Update the appointment details."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date *</Label>
                <Input
                  required
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Service *</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stylist</Label>
                <Select value={stylist} onValueChange={setStylist}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLISTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Hair length, color preferences, allergies…"
                className="rounded-xl min-h-[70px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Price quoted ($)</Label>
              <Input
                type="number"
                min={0}
                step={5}
                value={priceQuoted}
                onChange={e => setPriceQuoted(e.target.value)}
                placeholder="150"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-3 gap-2">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-full" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
