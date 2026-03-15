import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const morphemesData = JSON.parse(fs.readFileSync('./morphemes.json', 'utf-8'));

  for (const morpheme of morphemesData) {
    await prisma.morpheme.upsert({
      where: {
        text_meaning: {
          text: morpheme.text,
          meaning: morpheme.meaning,
        },
      },
      update: {},
      create: morpheme,
    });
  }

  console.log('Database seeded with morphemes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
