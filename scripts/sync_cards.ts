import { syncCardsToRedis } from '../src/lib/cardStorage';

async function run() {
  console.log('--- CARD SYNC PROTOCOL INITIATED ---');
  try {
    const { count } = await syncCardsToRedis();
    console.log(`Successfully synchronized ${count} tactical cards to Redis database.`);
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL SYNC FAILURE:', err);
    process.exit(1);
  }
}

run();
