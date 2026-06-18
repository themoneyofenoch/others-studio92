// Seed Studio 92 Braids services + demo data
import { db } from "@/lib/db";

const SERVICES = [
  // Knotless Braids
  { name: "Knotless Box Braids (Small)", category: "Knotless Braids", description: "Tension-free, scalp-friendly knotless box braids in small size. Lightweight and protective for natural hair.", durationMin: 360, priceFrom: 220, featured: true },
  { name: "Knotless Box Braids (Medium)", category: "Knotless Braids", description: "Classic knotless box braids in medium size. Versatile, comfortable, and long-lasting.", durationMin: 300, priceFrom: 180, featured: true },
  { name: "Knotless Box Braids (Large)", category: "Knotless Braids", description: "Statement-making large knotless box braids. Quick install, bold look.", durationMin: 240, priceFrom: 150 },
  { name: "Knotless Box Braids (Jumbo)", category: "Knotless Braids", description: "Extra-thick jumbo knotless braids for a fashion-forward style.", durationMin: 210, priceFrom: 130 },
  { name: "Knotless Bohemian Braids", category: "Knotless Braids", description: "Boho-inspired knotless braids with curly ends for a soft, romantic look.", durationMin: 360, priceFrom: 250, featured: true },
  { name: "Knotless Distressed Locs", category: "Knotless Braids", description: "Distressed-style knotless braids with a relaxed, lived-in finish.", durationMin: 330, priceFrom: 230 },

  // Box Braids (Classic)
  { name: "Classic Box Braids (Small)", category: "Box Braids", description: "Traditional box braids in small size. Timeless protective style.", durationMin: 330, priceFrom: 180 },
  { name: "Classic Box Braids (Medium)", category: "Box Braids", description: "Standard medium classic box braids. The everyday go-to protective style.", durationMin: 270, priceFrom: 150, featured: true },
  { name: "Classic Box Braids (Large)", category: "Box Braids", description: "Bold large classic box braids for an effortless look.", durationMin: 210, priceFrom: 120 },
  { name: "Goddess Box Braids", category: "Box Braids", description: "Box braids with curly human-hair extensions for a goddess finish.", durationMin: 360, priceFrom: 240, featured: true },
  { name: "Bohemian Box Braids", category: "Box Braids", description: "Boho box braids with loose curly pieces throughout.", durationMin: 360, priceFrom: 250 },

  // Cornrows & Feed-in
  { name: "Straight Back Cornrows", category: "Cornrows", description: "Clean straight-back cornrows. Foundation style that lays flat and lasts.", durationMin: 120, priceFrom: 70 },
  { name: "Design Cornrows", category: "Cornrows", description: "Custom-pattern cornrows with creative partings and shapes.", durationMin: 150, priceFrom: 90 },
  { name: "Feed-In Braids (Lemonade)", category: "Cornrows", description: "Lemonade-style feed-in braids to the side. Sleek and lightweight.", durationMin: 150, priceFrom: 95, featured: true },
  { name: "Two Layer Feed-In", category: "Cornrows", description: "Dimensional two-layer feed-in braids with a bold parting.", durationMin: 180, priceFrom: 110 },

  // Locs
  { name: "Loc Retwist (Starter)", category: "Locs", description: "Starter loc retwist for short or new locs. Includes wash and style.", durationMin: 150, priceFrom: 85 },
  { name: "Loc Retwist (Medium Length)", category: "Locs", description: "Loc retwist for medium-length locs with palm-roll technique.", durationMin: 180, priceFrom: 110 },
  { name: "Loc Retwist (Long Length)", category: "Locs", description: "Loc retwist for long, mature locs. Includes wash and styling.", durationMin: 210, priceFrom: 135 },
  { name: "Loc Extensions", category: "Locs", description: "Instant loc extensions for length and density. Custom-matched color.", durationMin: 480, priceFrom: 350, featured: true },
  { name: "Starter Locs", category: "Locs", description: "Begin your loc journey with coils, two-strand twists, or comb coils.", durationMin: 180, priceFrom: 100 },

  // Kids Braids
  { name: "Kids Box Braids", category: "Kids", description: "Gentle box braids for children. Quick and protective.", durationMin: 180, priceFrom: 90 },
  { name: " Kids Cornrows", category: "Kids", description: "Simple cornrow styles for kids with beads and accessories.", durationMin: 90, priceFrom: 55 },
  { name: "Kids Lemonade Braids", category: "Kids", description: "Side-swept lemonade braids for kids. Trendy and easy to maintain.", durationMin: 150, priceFrom: 80 },

  // Extras
  { name: "Braids Take Down", category: "Extras", description: "Professional removal of box braids, twists, or locs. Includes deep cleanse.", durationMin: 180, priceFrom: 80 },
  { name: "Wash & Deep Condition", category: "Extras", description: "Clarifying wash, deep conditioning treatment, and scalp massage.", durationMin: 60, priceFrom: 45 },
  { name: "Edge Styling", category: "Extras", description: "Sleek edge styling for finishing touches on any look.", durationMin: 20, priceFrom: 15 },
  { name: "Hair Color Add-On", category: "Extras", description: "Color add-on for braided styles. Custom color match available.", durationMin: 60, priceFrom: 50 },
];

const STYLISTS = ["Aaliyah", "Jasmine", "Porsha", "Tanisha"];

const FIRST_NAMES = ["Aisha", "Bianca", "Camille", "Deja", "Ebony", "Fatima", "Giselle", "Imani", "Jada", "Kaya", "Laila", "Maya", "Nia", "Olivia", "Priya", "Quinn", "Renee", "Sanaa", "Tiana", "Uriah", "Vienna", "Wendy", "Xiomara", "Yara", "Zora"];
const LAST_NAMES = ["Bennett", "Carter", "Davis", "Edwards", "Foster", "Greene", "Harris", "Irving", "Jackson", "King", "Lewis", "Mitchell", "Nash", "Owens", "Parker", "Reyes", "Sanders", "Thompson", "Underwood", "Vargas", "Washington", "Young", "Zimmerman"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

async function main() {
  console.log("Resetting DB...");
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.campaign.deleteMany();
  await db.service.deleteMany();
  await db.customer.deleteMany();

  console.log("Seeding services...");
  const services = [];
  for (const s of SERVICES) {
    const svc = await db.service.create({ data: s });
    services.push(svc);
  }

  console.log("Seeding customers...");
  const customers = [];
  for (let i = 0; i < 60; i++) {
    const name = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i*3+1)}`;
    const c = await db.customer.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@email.com`,
        phone: `+1 ${200+Math.floor(Math.random()*700)} ${100+Math.floor(Math.random()*899)} ${1000+Math.floor(Math.random()*8999)}`,
      }
    });
    customers.push(c);
  }

  console.log("Seeding bookings (past + upcoming)...");
  const STATUSES = ["completed", "completed", "completed", "completed", "confirmed", "confirmed", "confirmed", "cancelled", "no_show", "pending_payment"];
  const now = new Date();
  let totalRevenue = 0;
  for (let i = 0; i < 220; i++) {
    const svc = pick(services, i*7+3);
    const cust = pick(customers, i*5+2);
    const stylist = pick(STYLISTS, i);
    const daysAgo = Math.floor(Math.random() * 90) - 14; // 14 days in future to 90 days ago
    const hour = 9 + Math.floor(Math.random() * 9);
    const startsAt = new Date(now);
    startsAt.setDate(now.getDate() - daysAgo);
    startsAt.setHours(hour, Math.random() < 0.5 ? 0 : 30, 0, 0);
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const price = svc.priceFrom + Math.floor(Math.random() * 60);
    const depositPaid = status === "completed" || status === "confirmed";
    const booking = await db.booking.create({
      data: {
        serviceId: svc.id,
        customerId: cust.id,
        stylist,
        startsAt,
        durationMin: svc.durationMin,
        status,
        priceQuoted: price,
        depositPaid,
        depositAmount: depositPaid ? Math.round(svc.priceFrom * 0.25) : 0,
        paymentIntentId: depositPaid ? `demo_pi_seed_${i}` : null,
        notes: Math.random() < 0.2 ? "First-time client — confirmed via Instagram DM." : null,
      }
    });
    if (status === "completed") totalRevenue += price;
  }
  console.log("Total seeded revenue (completed):", totalRevenue);

  console.log("Seeding campaigns...");
  const CAMPAIGNS = [
    { name: "Dallas Summer Braid Drop", channel: "instagram", status: "active", budget: 1500, spent: 920, reach: 38400, clicks: 1240, bookings: 34, revenue: 7800, startsAtOffset: -25 },
    { name: "TikTok Boho Braids Trend", channel: "tiktok", status: "active", budget: 800, spent: 540, reach: 62000, clicks: 2100, bookings: 52, revenue: 11200, startsAtOffset: -18 },
    { name: "Friend Referral Boost", channel: "referral", status: "active", budget: 400, spent: 180, reach: 1200, clicks: 410, bookings: 28, revenue: 5400, startsAtOffset: -45 },
    { name: "Back-to-School Kids Braids", channel: "email", status: "ended", budget: 300, spent: 300, reach: 2400, clicks: 380, bookings: 22, revenue: 1980, startsAtOffset: -75, endsAtOffset: -30 },
    { name: "Loyalty SMS Win-back", channel: "sms", status: "active", budget: 250, spent: 95, reach: 850, clicks: 220, bookings: 14, revenue: 3100, startsAtOffset: -12 },
    { name: "Walk-in Welcome Promo", channel: "walk-in", status: "ended", budget: 0, spent: 0, reach: 600, clicks: 600, bookings: 18, revenue: 4200, startsAtOffset: -60, endsAtOffset: -20 },
  ];
  for (const c of CAMPAIGNS) {
    const start = new Date(now); start.setDate(now.getDate() + (c.startsAtOffset || 0));
    const end = c.endsAtOffset ? new Date(now.setDate(now.getDate() + 0) + 0) : null;
    // rebuild now (above mutates) -> use Date.now() fresh
    const start2 = new Date(); start2.setDate(start2.getDate() + (c.startsAtOffset || 0));
    const end2 = c.endsAtOffset ? new Date(new Date().setDate(new Date().getDate() + c.endsAtOffset)) : null;
    await db.campaign.create({
      data: {
        name: c.name,
        channel: c.channel,
        status: c.status,
        budget: c.budget,
        spent: c.spent,
        reach: c.reach,
        clicks: c.clicks,
        bookings: c.bookings,
        revenue: c.revenue,
        startsAt: start2,
        endsAt: end2,
      }
    });
  }

  console.log("Seeding reviews...");
  const REVIEWS = [
    { author: "Tiana W.", rating: 5, text: "Aaliyah did my knotless boho braids and they lasted 8 weeks with zero slippage. Best studio in Dallas, hands down." },
    { author: "Jada M.", rating: 5, text: "Booked online at 11pm, got in the next morning. Clean space, no waiting, fair price. Studio 92 is my new regular spot." },
    { author: "Sanaa P.", rating: 5, text: "Got lemonade feed-in braids for my birthday — sleek, lightweight, exactly like the inspo photo. Jasmine is an artist." },
    { author: "Ebony R.", rating: 4, text: "Good experience overall. Studio is bright and clean. Booking was easy through their site. Would recommend." },
    { author: "Camille D.", rating: 5, text: "My daughter's first box braids — they were so patient with her. She didn't want to take them out. We'll be back!" },
    { author: "Maya F.", rating: 5, text: "Loc retwist lasted longer than any I've had before. They really know mature locs. Friendly staff and on time." },
    { author: "Bianca T.", rating: 5, text: "Drive 45 minutes to come here and it's 100% worth it. Tension-free braids, no headaches, scalp feels great." },
    { author: "Olivia H.", rating: 4, text: "Booked the goddess box braids — gorgeous result. Took a bit longer than quoted but the quality made up for it." },
  ];
  for (const r of REVIEWS) {
    await db.review.create({ data: r });
  }

  console.log("Done seeding.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
