import nodemailer from "nodemailer";

/**
 * Booking confirmation emails via the studio92braids.com mailbox (Titan SMTP).
 * Sends are best-effort — failures are logged, never crash the booking flow.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

function fromAddress() {
  return process.env.EMAIL_FROM || `"Studio 92 Braids" <noreply@studio92braids.com>`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/**
 * Confirmation to the customer after a deposit is paid / booking confirmed.
 */
export async function sendBookingConfirmation(opts: {
  to: string;
  customerName: string;
  serviceName: string;
  stylist: string;
  startsAt: string;
  depositAmount: number;
  bookingId: string;
}) {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: `✅ Booking confirmed — ${opts.serviceName} at Studio 92 Braids`,
      text: [
        `Hi ${opts.customerName},`,
        ``,
        `Your appointment is confirmed:`,
        `  • Service: ${opts.serviceName}`,
        `  • Stylist: ${opts.stylist}`,
        `  • When:    ${fmtDateTime(opts.startsAt)}`,
        `  • Deposit: $${opts.depositAmount.toFixed(2)} (paid)`,
        ``,
        `Need to reschedule or cancel? Call us at (469) 555-0192.`,
        ``,
        `— Studio 92 Braids · 9220 Markville Dr, Dallas, TX`,
      ].join("\n"),
    });
  } catch (e: any) {
    console.error("[email] confirmation failed:", e?.message);
  }
}

/**
 * Notification to the studio when a new booking is created.
 */
export async function sendOwnerNotification(opts: {
  to: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  stylist: string;
  startsAt: string;
  bookingId: string;
}) {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: `🔔 New booking — ${opts.serviceName}`,
      text: [
        `New appointment booked:`,
        `  • Client:    ${opts.customerName}${opts.customerPhone ? ` (${opts.customerPhone})` : ""}`,
        `  • Service:   ${opts.serviceName}`,
        `  • Stylist:   ${opts.stylist}`,
        `  • When:      ${fmtDateTime(opts.startsAt)}`,
        `  • Booking:   ${opts.bookingId}`,
        ``,
        `Manage it in the Studio 92 admin dashboard.`,
      ].join("\n"),
    });
  } catch (e: any) {
    console.error("[email] owner notification failed:", e?.message);
  }
}
