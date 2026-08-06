import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const REAL = [
  "Special Miracle Knotless","Miracle Knotless","Smedium Knotless Boho","Medium Bora Bora",
  "Smedium Bora Bora","Small Bora Bora","Medium Box Braids","Small Box Braids","Tribal Braids",
  "Flip Over Tribal / Fulani Braids","Lemonade Braids","French Curl Braids","Boho Twist",
  "Senegalese Twist","Crochet Braids","Individual Crochet Braids","Cornrows","Takedown & Maintenance",
];
async function main() {
  const all = await db.service.findMany();
  let removed = 0;
  for (const s of all) {
    if (!REAL.includes(s.name)) {
      await db.booking.deleteMany({ where: { serviceId: s.id } });
      await db.service.delete({ where: { id: s.id } });
      removed++;
      console.log("removed:", s.name);
    }
  }
  const final = await db.service.findMany({ orderBy: { name: "asc" } });
  console.log(`\nremoved ${removed} — final catalog: ${final.length} services`);
  for (const s of final) console.log(`  ${s.name} | $${s.priceFrom}+ | ${s.durationMin}min | ${s.category} | featured=${s.featured}`);
}
main().finally(() => db.$disconnect());
