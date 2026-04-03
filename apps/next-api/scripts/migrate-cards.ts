import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import dbConnect from '../lib/mongodb.js';
import Card from '../models/Card.js';
import rawCards from '../data/cards.json';

// Fallback to process.env.MONGODB_URI if .env.local doesn't exist
const mongodbUri = process.env.MONGODB_URI;

async function migrate() {
  console.log('Connecting to MongoDB...');
  await dbConnect();

  const allCards: any[] = [
    ...(rawCards.SURVIVAL || []),
    ...(rawCards.DISASTER || []),
    ...(rawCards.POWER || []),
    ...(rawCards.ADAPT || []),
    ...(rawCards.CHAOS || []),
    ...(rawCards.ASCENDED || []),
    ...(rawCards.TWIST || []),
    ...(rawCards.CATACLYSM || []),
  ];

  console.log(`Found ${allCards.length} cards in JSON. Starting migration...`);

  for (const cardData of allCards) {
    try {
      await Card.findOneAndUpdate(
        { id: cardData.id },
        { ...cardData, effect: cardData.description }, // Sync effect/description
        { upsert: true, new: true }
      );
      console.log(`Synced card: ${cardData.name} (${cardData.id})`);
    } catch (err) {
      console.error(`Error syncing card ${cardData.id}:`, err);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
