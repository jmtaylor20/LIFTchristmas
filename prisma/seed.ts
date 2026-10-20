// Sample data for local development: `npm run db:seed`. Do not run against production.
import { PrismaClient } from "@prisma/client";
import { loadSampleData } from "../src/lib/sampleData";

const db = new PrismaClient();

loadSampleData(db)
  .then((r) => console.log(`Seeded season ${r.year} with ${r.angels} angels.`))
  .finally(() => db.$disconnect());
