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
  return process.env.EMAIL_FROM || `"Studio 92 Braids" <booking@studio92braids.com>`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

/** Shared branded shell for Studio 92 emails. */
function shell(title: string, bodyHtml: string) {
  return `
  <div style="background:#f5f0eb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ece3d8;">
      <div style="background:#1c1917;padding:24px 28px;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:#ffffff;color:#1c1917;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">92</div>
        <div>
          <div style="color:#ffffff;font-size:17px;font-weight:bold;">Studio 92 Braids</div>
          <div style="color:#a8a29e;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Braids · Locs · Dallas</div>
        </div>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 6px;font-size:20px;color:#1c1917;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="background:#faf7f4;padding:18px 28px;border-top:1px solid #ece3d8;color:#78716c;font-size:12px;line-height:1.6;">
        Studio 92 Braids · 9220 Markville Dr, Dallas, TX 75243<br/>
        (469) 555-0192 · hello@studio92braids.com · @studio92braids
      </div>
    </div>
  </div>`;
}

function detailRow(label: string, value: string) {
  return `
  <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1ece4;">
    <span style="color:#78716c;font-size:13px;">${label}</span>
    <span style="color:#1c1917;font-size:13px;font-weight:bold;text-align:right;">${value}</span>
  </div>`;
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
  const when = fmtDateTime(opts.startsAt);
  const html = shell("Your appointment is confirmed 🎉", `
    <p style="color:#57534e;font-size:14px;line-height:1.6;margin:0 0 18px;">
      Hi ${opts.customerName}, your slot at Studio 92 is locked in. Here's everything you need:
    </p>
    ${detailRow("Service", opts.serviceName)}
    ${detailRow("Stylist", opts.stylist)}
    ${detailRow("When", when)}
    ${detailRow("Deposit paid", `$${opts.depositAmount.toFixed(2)}`)}
    ${detailRow("Booking ref", opts.bookingId.slice(-8).toUpperCase())}
    <p style="color:#57534e;font-size:13px;line-height:1.6;margin:18px 0 0;">
      Running late or need to reschedule? Call us at <b>(469) 555-0192</b> — we're happy to help.
    </p>
  `);
  try {
    await t.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: `✅ Booking confirmed — ${opts.serviceName}`,
      text: [
        `Hi ${opts.customerName},`,
        ``,
        `Your appointment is confirmed:`,
        `  • Service: ${opts.serviceName}`,
        `  • Stylist: ${opts.stylist}`,
        `  • When:    ${when}`,
        `  • Deposit: $${opts.depositAmount.toFixed(2)} (paid)`,
        ``,
        `— Studio 92 Braids · 9220 Markville Dr, Dallas, TX`,
      ].join("\n"),
      html,
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
  const when = fmtDateTime(opts.startsAt);
  const html = shell("New booking 🔔", `
    <p style="color:#57534e;font-size:14px;line-height:1.6;margin:0 0 18px;">
      A new appointment just came in:
    </p>
    ${detailRow("Client", opts.customerName)}
    ${detailRow("Phone", opts.customerPhone || "—")}
    ${detailRow("Service", opts.serviceName)}
    ${detailRow("Stylist", opts.stylist)}
    ${detailRow("When", when)}
    ${detailRow("Booking ref", opts.bookingId.slice(-8).toUpperCase())}
  `);
  try {
    await t.sendMail({
      from: fromAddress(),
      to: opts.to,
      subject: `🔔 New booking — ${opts.serviceName}`,
      text: [
        `New appointment booked:`,
        `  • Client:  ${opts.customerName}${opts.customerPhone ? ` (${opts.customerPhone})` : ""}`,
        `  • Service: ${opts.serviceName}`,
        `  • Stylist: ${opts.stylist}`,
        `  • When:    ${when}`,
        `  • Booking: ${opts.bookingId}`,
      ].join("\n"),
      html,
    });
  } catch (e: any) {
    console.error("[email] owner notification failed:", e?.message);
  }
}
