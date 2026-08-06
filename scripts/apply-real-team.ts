import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const TEAM = [
  { name: "Amara", slug: "amara", role: "Master Braider", yearsExp: 12, specialties: "Braids,Twists", bio: "Specializes in the studio's knotless and Bora Bora work. Known for a flat, painless root and a finish that lasts." },
  { name: "Destiny", slug: "destiny", role: "Senior Braider", yearsExp: 9, specialties: "Braids,Twists", bio: "Loved for boho and French curl styles, with a feather-light tension that keeps clients coming back." },
  { name: "Imani", slug: "imani", role: "Braider & Crochet Specialist", yearsExp: 7, specialties: "Crochet,Braids", bio: "Handles crochet installs and fuller styles, with clean parts and a patient, detailed hand." },
  { name: "Nia", slug: "nia", role: "Braider & Scalp Designer", yearsExp: 6, specialties: "Scalp,Braids", bio: "The go-to for crisp cornrows, tribal, and Fulani designs. Precision parting is the signature." },
  { name: "Naomi", slug: "naomi", role: "Braider", yearsExp: 4, specialties: "Crochet,Maintenance", bio: "Quick, gentle, and great with takedowns, touch-ups, and crochet refreshes." },
];
// bookings reference stylist by NAME string — safe to replace rows
await db.staffer.deleteMany({});
for (const t of TEAM) {
  await db.staffer.create({ data: { ...t, imageUrl: "/gallery/gallery-portrait2.jpg" } });
  console.log("✓", t.name, t.role, t.yearsExp + "yrs");
}
// real reviews
await db.review.deleteMany({});
const REVIEWS = [
  { author: "Semhar", rating: 5, text: "Absolutely amazing! Highly recommend.", source: "booksy" },
  { author: "Femiah", rating: 5, text: "Fast and really good quality.", source: "booksy" },
  { author: "Taylor", rating: 5, text: "Will be back! Love my braids.", source: "booksy" },
];
for (const r of REVIEWS) await db.review.create({ data: r });
console.log("✓ reviews:", await db.review.count(), "| staffers:", await db.staffer.count());
db.$disconnect();
