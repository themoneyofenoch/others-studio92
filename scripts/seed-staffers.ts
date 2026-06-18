// Seed Studio 92 Braids staffers
import { db } from "@/lib/db";

const STAFFERS = [
  {
    name: "Aaliyah",
    slug: "aaliyah",
    role: "Founder · Master Braider",
    bio: "Aaliyah opened Studio 92 in 2018 after eight years braiding in suites across DFW. She specializes in tension-free knotless installs and goddess braids — every set starts with a scalp check and a real conversation about your hair goals. If you've seen a Studio 92 braid that lasted 10+ weeks, it was probably hers.",
    specialties: "Knotless Braids,Box Braids,Cornrows,Extras",
    imageUrl: "/gallery/staffer-aaliyah.jpg",
    yearsExp: 8,
    booksyStafferId: "1702138",
  },
  {
    name: "Jasmine",
    slug: "jasmine",
    role: "Braider · Cornrow Specialist",
    bio: "Jasmine is the queen of clean parts and lemonade feed-ins. She came up doing fashion-week cornrow work in Atlanta before joining Studio 92. Book her for design cornrows, two-layer feed-ins, and intricate kids styles — she's patient, fast, and detail-obsessed.",
    specialties: "Cornrows,Kids,Extras",
    imageUrl: "/gallery/staffer-jasmine.jpg",
    yearsExp: 6,
    booksyStafferId: null,
  },
  {
    name: "Porsha",
    slug: "porsha",
    role: "Locs Specialist",
    bio: "Porsha has been caring for mature locs for over a decade. She offers palm-roll retwists, starter locs, and instant loc extensions for clients who want length without the wait. She's gentle on the scalp and obsessively clean — your parts will be picture-perfect.",
    specialties: "Locs,Extras",
    imageUrl: "/gallery/staffer-porsha.jpg",
    yearsExp: 10,
    booksyStafferId: null,
  },
  {
    name: "Tanisha",
    slug: "tanisha",
    role: "Braider · Boho & Jumbo Specialist",
    bio: "Tanisha is our go-to for boho-inspired and jumbo knotless braids. She trained under Aaliyah and has a knack for blending curly human-hair extensions into seamless goddess finishes. Quick hands, soft touch, and a great playlist on rotation in her chair.",
    specialties: "Knotless Braids,Box Braids,Kids",
    imageUrl: "/gallery/staffer-tanisha.jpg",
    yearsExp: 4,
    booksyStafferId: null,
  },
];

async function main() {
  console.log("Resetting staffers...");
  await db.staffer.deleteMany();

  console.log("Seeding staffers...");
  for (const s of STAFFERS) {
    await db.staffer.create({ data: s });
  }
  console.log(`Seeded ${STAFFERS.length} staffers.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
