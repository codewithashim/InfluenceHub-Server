/* eslint-disable */
require('dotenv').config();
const { PrismaClient, Role, Platform } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Realistic influencer names
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Blake', 'Cameron', 'Dakota',
  'Eden', 'Finley', 'Gabe', 'Harper', 'Indigo', 'Jaden', 'Kai', 'Logan', 'Madison', 'Nolan',
  'Owen', 'Parker', 'Quinn', 'Reagan', 'Sage', 'Tanner', 'Umber', 'Violet', 'Wyatt', 'Xander',
  'Yara', 'Zane', 'Aria', 'Brooks', 'Chase', 'Drew', 'Ellis', 'Felix', 'Grace', 'Hunter',
  'Iris', 'Jasper', 'Kylie', 'Liam', 'Maya', 'Noah', 'Oliver', 'Piper', 'Quinn', 'Ryan'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const generateName = () => {
  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  return `${firstName} ${lastName}`;
};

const generateUsername = (name, platform) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  const randomNum = Math.floor(Math.random() * 9999) + 1;
  let platformSuffix;
  switch (platform) {
    case 'instagram':
      platformSuffix = 'ig';
      break;
    case 'tiktok':
      platformSuffix = 'tt';
      break;
    case 'youtube':
      platformSuffix = 'yt';
      break;
    case 'x':
      platformSuffix = 'tw';
      break;
    default:
      platformSuffix = platform.slice(0, 2);
  }
  return `${cleanName}${randomNum}${platformSuffix}`;
};

async function main() {
  console.log('Seeding users...');
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const viewerPass = await bcrypt.hash('Viewer123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    create: {
      email: 'admin@gmail.com',
      passwordHash: adminPass,
      role: Role.admin
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'viewer@gmail.com' },
    create: {
      email: 'viewer@gmail.com',
      passwordHash: viewerPass,
      role: Role.viewer
    },
    update: {},
  });

  console.log('Seeding influencers...');
  const countries = [
    'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE',
    'NO', 'DK', 'FI', 'BR', 'MX', 'AR', 'IN', 'JP', 'KR', 'CN',
    'BD', 'PK', 'ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'AE', 'SA'
  ];

  const categories = [
    'beauty', 'fitness', 'fashion', 'food', 'travel', 'tech', 'gaming',
    'lifestyle', 'music', 'art', 'sports', 'business', 'education',
    'comedy', 'dance', 'photography', 'diy', 'pets', 'parenting', 'health'
  ];

  const platforms = ['instagram', 'tiktok', 'youtube', 'x'];

  const batch = [];
  const N = Number(process.env.SEED_COUNT || 2000);

  // Track used usernames to avoid duplicates
  const usedUsernames = new Set();

  for (let i = 0; i < N; i++) {
    const platform = pick(platforms);
    const name = generateName();
    let username = generateUsername(name, platform);

    // Ensure unique username
    while (usedUsernames.has(`${platform}_${username}`)) {
      username = generateUsername(name, platform);
    }
    usedUsernames.add(`${platform}_${username}`);

    // Generate more realistic follower counts based on platform
    let followers;
    switch (platform) {
      case 'instagram':
        followers = Math.floor(Math.random() * 10000000) + 1000; // 1K to 10M
        break;
      case 'tiktok':
        followers = Math.floor(Math.random() * 50000000) + 500; // 500 to 50M
        break;
      case 'youtube':
        followers = Math.floor(Math.random() * 20000000) + 1000; // 1K to 20M
        break;
      case 'x':
        followers = Math.floor(Math.random() * 5000000) + 500; // 500 to 5M
        break;
      default:
        followers = Math.floor(Math.random() * 1000000) + 1000;
    }

    // Generate realistic engagement rates
    const engagementRate = Number((Math.random() * 15 + 0.5).toFixed(2)); // 0.5% to 15.5%

    // Generate 1-3 categories per influencer
    const numCategories = Math.floor(Math.random() * 3) + 1;
    const influencerCategories = [];
    const categoryPool = [...categories];
    for (let j = 0; j < numCategories; j++) {
      const randomIndex = Math.floor(Math.random() * categoryPool.length);
      influencerCategories.push(categoryPool.splice(randomIndex, 1)[0]);
    }

    batch.push({
      name,
      platform,
      username,
      followers,
      engagementRate,
      country: pick(countries),
      categories: influencerCategories,
      email: Math.random() < 0.7 ? `${username}@example.com` : null, // 70% have email
    });
  }

  const chunk = 500;
  for (let i = 0; i < batch.length; i += chunk) {
    await prisma.influencer.createMany({
      data: batch.slice(i, i + chunk),
      skipDuplicates: true
    });
    console.log(`Inserted ${Math.min(i + chunk, batch.length)}/${batch.length} influencers`);
  }

  console.log('Seeding completed successfully!');
  console.log(`Created ${N} influencers with realistic names and data`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
