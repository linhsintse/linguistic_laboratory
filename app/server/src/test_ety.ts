import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    // Optional: Enable query logging to monitor the raw SQL execution times
    // log: ['query', 'info', 'warn', 'error'],
});

async function runDiagnostics() {
    console.log("Starting Etymology Database Diagnostics...\n");
    const startTime = Date.now();

    try {
        // Test 1: Data Volume Check
        console.log("--- Test 1: Total Volume ---");
        const totalRows = await prisma.etymology.count();
        console.log(`Total Etymology Rows: ${totalRows.toLocaleString()}`);
        if (totalRows === 0) {
            console.error("FAIL: The database is empty.");
            return;
        }

        // Test 2: Index Performance & Specific Query
        // We query a known complex word to ensure the @@index([term, lang]) is working.
        console.log("\n--- Test 2: Index Latency & Retrieval ---");
        const testWord = 'spectacle';
        const queryStart = Date.now();
        
        const wordData = await prisma.etymology.findMany({
            where: { 
                term: testWord,
                lang: 'en' 
            },
            orderBy: { position: 'asc' }
        });
        
        const queryTime = Date.now() - queryStart;
        console.log(`Query for "${testWord}" took ${queryTime}ms.`);
        console.log(`Found ${wordData.length} relation(s) for "${testWord}".`);
        
        if (queryTime > 500) {
            console.warn("WARNING: Query latency is high. Verify that the composite index on [term, lang] was applied correctly.");
        }
        
        if (wordData.length > 0) {
            console.log("Sample Data Output:");
            console.table(wordData.map(d => ({
                Type: d.reltype,
                Related_Term: d.related_term,
                Related_Lang: d.related_lang
            })));
        }

        // Test 3: Data Distribution (Top 5 Relation Types)
        // This ensures the 'reltype' column mapped correctly from the CSV.
        console.log("\n--- Test 3: Relation Type Distribution ---");
        const relDistribution = await prisma.etymology.groupBy({
            by: ['reltype'],
            _count: { reltype: true },
            orderBy: {
                _count: { reltype: 'desc' }
            },
            take: 5
        });

        console.table(relDistribution.map(r => ({
            Relation_Type: r.reltype || 'NULL',
            Count: r._count.reltype.toLocaleString()
        })));

        // Test 4: Schema Integrity (Null Checks)
        // term_id is required in the schema, but let's check for missing 'term' strings
        // which indicate malformed CSV parsing.
        console.log("\n--- Test 4: Schema Integrity ---");
        const nullTerms = await prisma.etymology.count({
            where: { term: null }
        });
        console.log(`Rows with NULL 'term': ${nullTerms.toLocaleString()}`);
        if (nullTerms > 1000) {
             console.warn("WARNING: High number of null terms detected. The CSV parser may have misaligned columns.");
        } else {
             console.log("Integrity Check: PASSED");
        }

    } catch (error) {
        console.error("Diagnostic script failed:", error);
    } finally {
        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`\nDiagnostics completed in ${totalTime.toFixed(2)} seconds.`);
        await prisma.$disconnect();
    }
}

runDiagnostics();