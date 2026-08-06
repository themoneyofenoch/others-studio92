// Apply the REAL Studio 92 service catalog (from studio92braids.vercel.app)
// Updates existing service rows in place (preserves bookings' FK), deletes
// leftover unbooked services, adds the real Booksy review, sets "Most loved".
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const REAL = [
  // name, category, description, durationMin, priceFrom, featured
  ["Special Miracle Knotless", "Braids", "The signature Studio 92 knotless, lightweight and flawless.", 360, 280, true],
  ["Miracle Knotless", "Braids", "Our most-booked knotless. Clean, comfortable, long-lasting.", 330, 200, true],
  ["Smedium Knotless Boho", "Braids", "Knotless base with soft curly accents woven through.", 360, 250, true],
  ["Medium Bora Bora", "Braids", "Bohemian Bora Bora braids with a goddess finish.", 420, 320, false],
  ["Smedium Bora Bora", "Braids", "A fuller, finer Bora Bora for extra detail.", 450, 300, false],
  ["Small Bora Bora", "Braids", "The finest, fullest Bora Bora we offer.", 510, 340, false],
  ["Medium Box Braids", "Braids", "The timeless classic, crisp parts, clean finish.", 300, 160, false],
  ["Small Box Braids", "Braids", "Finer box braids for fullness and longer wear.", 420, 200, false],
  ["Tribal Braids", "Braids", "Feed-in tribal braids with a clean, sculpted look.", 240, 180, false],
  ["Flip Over Tribal / Fulani Braids", "Braids", "Fulani-inspired braids with a flip-over finish.", 240, 180, false],
  ["Lemonade Braids", "Braids", "Side-swept feed-in braids, clean and bold.", 210, 160, false],
  ["French Curl Braids", "Braids", "Braids finished with soft, bouncy French curls.", 300, 220, false],
  ["Boho Twist", "Twists", "Twists blended with curly accents for a soft finish.", 300, 220, false],
  ["Senegalese Twist", "Twists", "Smooth, rope-like twists with a polished sheen.", 300, 250, false],
  ["Crochet Braids", "Crochet", "Full, fast, and feather-soft.", 150, 120, false],
  ["Individual Crochet Braids", "Crochet", "Crochet with an individual, hand-placed finish.", 210, 160, false],
  ["Cornrows", "Scalp", "Clean lines and custom designs to scalp.", 90, 50, false],
  ["Takedown & Maintenance", "Maintenance", "Removal, refresh, and edge touch-ups.", 90, 100, false],
];

// Reuse the existing gallery images by category
const IMG = {
  "Braids": "/gallery/gallery-knotless.jpg",
  "Twists": "/gallery/gallery-portrait2.jpg",
  "Crochet": "/gallery/gallery-boho.jpg",
  "Scalp": "/gallery/gallery-detail.jpg",
  "Maintenance": "/gallery/gallery-locs.jpg",
};

async function main() {
  const existing = await db.service.findMany({ orderBy: { category: "asc" } });
  console.log(`existing services: ${existing.length}, real: ${REAL.length}`);

  // 1. Update in place for as many rows as we have
  for (let i = 0; i < REAL.length; i++) {
    const [name, category, description, durationMin, priceFrom, featured] = REAL[i];
    if (i < existing.length) {
      await db.service.update({
        where: { id: existing[i].id },
        data: { name, category, description, durationMin, priceFrom, featured, imageUrl: IMG[category] },
      });
    } else {
      await db.service.create({
        data: { name, category, description, durationMin, priceFrom, featured, imageUrl: IMG[category] },
      });
    }
  }

  // 2. Delete leftover services that have NO bookings (FK-safe)
  const all = await db.service.findMany();
  const extra = all.slice(REAL.length);
  let deleted = 0;
  for (const s of extra) {
    const count = await db.booking.count({ where: { serviceId: s.id } });
    if (count === 0) { await db.service.delete({ where: { id: s.id } }); deleted++; }
  }
  console.log(`deleted ${deleted} leftover unbooked services`);

  // 3. Real Booksy review
  const booksyExists = await db.review.findFirst({ where: { source: "booksy" } });
  if (!booksyExists) {
    await db.review.create({
      data: {
        author: "Verified Booksy client",
        rating: 5,
        text: "Absolutely amazing! Highly recommend.",
        source: "booksy",
      },
    });
    console.log("added Booksy 5-star review");
  }

  const final = await db.service.findMany({ orderBy: { category: "asc" } });
  console.log(`final services: ${final.length}`);
  for (const s of final) console.log(`  ${s.category} | ${s.name} | $${s.priceFrom}+ | ${s.durationMin}min | featured=${s.featured}`);
}

main().finally(() => db.$disconnect());
