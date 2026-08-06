import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const SPECIALTIES: Record<string, string> = {
  "Aaliyah": "Braids,Twists,Maintenance",
  "Jasmine": "Crochet,Scalp,Maintenance",
  "Porsha": "Twists,Scalp",
  "Tanisha": "Braids,Crochet",
};
for (const [name, specs] of Object.entries(SPECIALTIES)) {
  await db.staffer.updateMany({ where: { name }, data: { specialties: specs } });
  console.log("✓", name, "→", specs);
}
db.$disconnect();
