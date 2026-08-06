import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const exists = await db.service.findFirst({ where: { name: "Small Bora Bora" } });
if (!exists) {
  await db.service.create({
    data: { name: "Small Bora Bora", category: "Braids", description: "The finest, fullest Bora Bora we offer.", durationMin: 510, priceFrom: 340, featured: false, imageUrl: "/gallery/gallery-knotless.jpg" },
  });
  console.log("✓ Small Bora Bora added");
} else console.log("already exists");
console.log("final catalog:", await db.service.count());
db.$disconnect();
