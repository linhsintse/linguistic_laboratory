import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

// Constrained to 500 to prevent SQLite "too many variables" errors
const BATCH_SIZE = 500; 

async function main() {
  // Ensure the unzipped etymology.csv is placed in your prisma folder
  const csvFilePath = path.join(__dirname, '../prisma/etymology.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error("Critical Error: CSV file not found at", csvFilePath);
    process.exit(1);
  }

  let batch: any[] = [];
  let totalProcessed = 0;

  console.log("Starting streaming ingestion. This will take a considerable amount of time...");

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(csvFilePath).pipe(csv());

    stream.on('data', async (data) => {
      // Normalize empty strings to null to map cleanly to the Prisma schema
      const cleanData = {
        term_id: data.term_id,
        lang: data.lang || null,
        term: data.term || null,
        reltype: data.reltype || null,
        related_term_id: data.related_term_id || null,
        related_lang: data.related_lang || null,
        related_term: data.related_term || null,
        position: data.position ? parseInt(data.position, 10) : null,
        group_tag: data.group_tag || null,
        parent_tag: data.parent_tag || null,
        parent_position: data.parent_position ? parseInt(data.parent_position, 10) : null,
      };

      batch.push(cleanData);

      if (batch.length >= BATCH_SIZE) {
        // Halt disk reading while awaiting the database transaction
        stream.pause(); 
        
        try {
            await prisma.etymology.createMany({ data: batch });
            totalProcessed += batch.length;
            
            // Log every 10,000 rows to monitor throughput
            if (totalProcessed % 10000 === 0) {
                console.log(`Ingested ${totalProcessed} rows...`);
            }
            
            batch = [];
            stream.resume();
        } catch (error) {
            console.error("Failed to insert batch at row:", totalProcessed);
            reject(error);
        }
      }
    });

    stream.on('end', async () => {
      // Flush remaining data in the final incomplete batch
      if (batch.length > 0) {
        await prisma.etymology.createMany({ data: batch });
        totalProcessed += batch.length;
      }
      console.log(`Ingestion complete! Total rows successfully written: ${totalProcessed}`);
      resolve(true);
    });

    stream.on('error', (error) => {
        console.error("Stream encountered a read error.");
        reject(error);
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });