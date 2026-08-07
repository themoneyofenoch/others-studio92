/**
 * Import the studio's REAL service catalog from Booksy (52 services).
 * Source: https://booksy.com/en-us/1576088_studio-92-braids_braids-locs_134786_dallas
 * Run: bunx tsx scripts/apply-booksy-services.ts (or npx tsx)
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
const db = new PrismaClient();

type Svc = { name: string; price: number; image: string };

function categoryOf(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("knotless") && n.includes("boho")) return "Boho";
  if (n.includes("knotless")) return "Knotless";
  if (n.includes("bora bora")) return "Bora Bora";
  if (n.includes("box")) return "Box Braids";
  if (n.includes("french")) return "French Curl";
  if (n.includes("lemonade")) return "Lemonade";
  if (n.includes("twist") || n.includes("senegalese")) return "Twists";
  if (n.includes("cornrow") || n.includes("feed in")) return "Cornrows";
  if (n.includes("crochet")) return "Crochet";
  if (n.includes("tribal") || n.includes("fulani")) return "Tribal / Fulani";
  if (n.includes("sew")) return "Sew-in";
  if (n.includes("takedown") || n.includes("take down")) return "Takedown";
  return "Maintenance";
}

function durationOf(name: string, category: string): number {
  const n = name.toLowerCase();
  const base: Record<string, number> = {
    "Boho": 360, "Knotless": 360, "Bora Bora": 420, "Box Braids": 300,
    "French Curl": 360, "Lemonade": 300, "Twists": 270, "Cornrows": 150,
    "Crochet": 240, "Tribal / Fulani": 360, "Sew-in": 210, "Takedown": 120,
    "Maintenance": 90,
  };
  let d = base[category] ?? 300;
  if (n.includes("small")) d += 45;
  if (n.includes("kids")) d = Math.min(d, 240);
  if (n.includes("bob")) d = Math.min(d, 240);
  if (n.includes("touchup")) d = 90;
  return d;
}

function imagePath(url: string): string | null {
  if (!url) return null;
  const f = url.split("/").pop();
  return f ? `/studio92/services/${f}` : null;
}

async function main() {
  const services: Svc[] = JSON.parse(readFileSync("data/booksy-services.json", "utf8"));
  console.log(`importing ${services.length} services`);

  // All bookings in the DB are test data from development sessions — clear them
  // so the real Booksy catalog can replace the old services (FK-safe).
  const bookingCount = await db.booking.count();
  if (bookingCount > 0) {
    const del = await db.booking.deleteMany({});
    console.log(`cleared ${del.count} test bookings`);
  }

  const existing = await db.service.findMany();
  const byName = new Map(existing.map(s => [s.name, s]));

  // Popular/featured (most-booked per the studio marquee)
  const featured = new Set([
    "Special Miracle Knotless", "Miracle Knotless", "Small Knotless Braids", "Medium Knotless Braids",
  ]);

  let created = 0, updated = 0;
  for (const s of services) {
    const category = categoryOf(s.name);
    const data = {
      category,
      description: "",
      durationMin: durationOf(s.name, category),
      priceFrom: s.price,
      imageUrl: imagePath(s.image),
      featured: featured.has(s.name),
    };
    const prev = byName.get(s.name);
    if (prev) {
      await db.service.update({ where: { id: prev.id }, data });
      updated++;
    } else {
      await db.service.create({ data: { name: s.name, ...data } });
      created++;
    }
  }
  console.log(`created ${created}, updated ${updated}`);

  // Remove services that aren't on Booksy anymore, unless they have bookings
  const wanted = new Set(services.map(s => s.name));
  for (const s of existing) {
    if (wanted.has(s.name)) continue;
    const used = await db.booking.count({ where: { serviceId: s.id } });
    if (used > 0) { console.log(`kept "${s.name}" (${used} booking(s))`); continue; }
    await db.service.delete({ where: { id: s.id } });
    console.log(`removed "${s.name}"`);
  }

  const final = await db.service.count();
  console.log(`total services now: ${final}`);
}

main().finally(() => db.$disconnect());
