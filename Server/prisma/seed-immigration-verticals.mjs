/**
 * Seeds the 18 real Immigration Division verticals (office locations) for
 * Bay Area Immigration Services into the Immigration Business.
 *
 * Idempotent: safe to run repeatedly. Uses the [businessId, code] unique key.
 * The existing placeholder vertical ("Immigration Operations") is migrated into
 * "Bay Area" so its existing employees and teams are preserved (no orphans).
 *
 * Run:  npx tsx prisma/seed-immigration-verticals.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real office-location verticals under the Immigration Head.
const VERTICAL_NAMES = [
  'Bay Area',
  'New York Area',
  'US Area',
  'Artesia',
  'Atlanta',
  'Boston',
  'Charlotte Area',
  'Chicago Area',
  'Dallas Area',
  'Houston Area',
  'Los Angeles Area',
  'New Jersey',
  'Phoenix Area',
  'Raleigh',
  'Sacramento',
  'San Diego',
  'Seattle Area',
  'Tracy Immigration Services',
];

const toCode = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  // 1. Locate the Immigration Business
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Immig', mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!business) {
    throw new Error('Immigration Business not found — cannot seed verticals.');
  }
  console.log(`Target business: ${business.name} (${business.id})`);

  // 2. Migrate the placeholder vertical into "Bay Area" to preserve its
  //    employees + teams, but only if "bay-area" does not already exist.
  const bayCode = toCode('Bay Area');
  const existingBay = await prisma.vertical.findFirst({
    where: { businessId: business.id, code: bayCode },
    select: { id: true },
  });
  if (!existingBay) {
    const placeholder = await prisma.vertical.findFirst({
      where: { businessId: business.id, name: 'Immigration Operations' },
      select: { id: true },
    });
    if (placeholder) {
      await prisma.vertical.update({
        where: { id: placeholder.id },
        data: { name: 'Bay Area', code: bayCode, isActive: true },
      });
      console.log('Migrated "Immigration Operations" -> "Bay Area" (employees/teams preserved).');
    }
  }

  // 3. Upsert all 18 verticals (idempotent on [businessId, code])
  let created = 0;
  let updated = 0;
  for (const name of VERTICAL_NAMES) {
    const code = toCode(name);
    const before = await prisma.vertical.findFirst({
      where: { businessId: business.id, code },
      select: { id: true },
    });
    await prisma.vertical.upsert({
      where: { businessId_code: { businessId: business.id, code } },
      update: { name, isActive: true },
      create: { businessId: business.id, name, code, isActive: true },
    });
    before ? updated++ : created++;
  }

  // 4. Report final state
  const verticals = await prisma.vertical.findMany({
    where: { businessId: business.id },
    select: { name: true, code: true, isActive: true, _count: { select: { employees: true } } },
    orderBy: { name: 'asc' },
  });
  console.log(`\nCreated: ${created}, Updated: ${updated}`);
  console.log(`Immigration Business now has ${verticals.length} verticals:`);
  verticals.forEach((v) =>
    console.log(`  - ${v.name} (${v.code})  employees=${v._count.employees}  active=${v.isActive}`),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
