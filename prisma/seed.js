/* eslint-disable */
require('dotenv').config();
const { PrismaClient, Role, Platform } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('Seeding users...');
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const viewerPass = await bcrypt.hash('Viewer123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    create: { email: 'admin@example.com', passwordHash: adminPass, role: Role.admin },
    update: {},
  });
  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    create: { email: 'viewer@example.com', passwordHash: viewerPass, role: Role.viewer },
    update: {},
  });

  console.log('Seeding influencers...');
  const countries = ['BD','IN','US','GB','AE','SA','PK','CA','AU','MY','SG','LK','NP'];
  const categories = ['beauty','fitness','tech','gaming','travel','food','fashion','education','finance','lifestyle'];

  const batch = [];
  const N = Number(process.env.SEED_COUNT || 2000);
  for (let i = 0; i < N; i++) {
    const platform = pick([Platform.instagram, Platform.tiktok, Platform.youtube, Platform.x]);
    batch.push({
      name: `Creator ${i + 1}`,
      platform,
      username: `creator_${i + 1}_${platform}`,
      followers: Math.floor(Math.random() * 5_000_000),
      engagementRate: Number((Math.random() * 15).toFixed(2)),
      country: pick(countries),
      categories: Array.from(new Set([pick(categories), pick(categories)])),
      email: Math.random() < 0.5 ? `contact${i + 1}@mail.test` : null,
    });
  }

  const chunk = 500;
  for (let i = 0; i < batch.length; i += chunk) {
    await prisma.influencer.createMany({ data: batch.slice(i, i + chunk), skipDuplicates: true });
    console.log(`Inserted ${Math.min(i + chunk, batch.length)}/${batch.length}`);
  }

  console.log('Seeding completed.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
