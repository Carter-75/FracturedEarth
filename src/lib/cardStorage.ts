import { getRedis } from './redis';
import { type MatchCard } from './matchEngine';
import rawCards from '../data/cards.json';

const CARDS_ALL_KEY = 'cards:all';
const CARD_PREFIX = 'card:';

export async function syncCardsToRedis(): Promise<{ count: number }> {
  const redis = await getRedis();
  const allCards: MatchCard[] = [];

  // Flatten all categories
  Object.values(rawCards).forEach((category: any) => {
    allCards.push(...category);
  });

  // Save full list for quick catalog retrieval
  await redis.set(CARDS_ALL_KEY, JSON.stringify(allCards));

  // Save individual cards for fast lookup by ID
  const pipeline = redis.multi();
  for (const card of allCards) {
    // @ts-ignore
    pipeline.set(`${CARD_PREFIX}${card.id}`, JSON.stringify(card));
  }
  await pipeline.exec();

  return { count: allCards.length };
}

export async function getAllCardsFromRedis(): Promise<MatchCard[] | null> {
  const redis = await getRedis();
  const data = await redis.get(CARDS_ALL_KEY);
  if (!data) return null;
  return JSON.parse(data);
}

export async function getCardByIdFromRedis(id: string): Promise<MatchCard | null> {
  const redis = await getRedis();
  const data = await redis.get(`${CARD_PREFIX}${id}`);
  if (!data) return null;
  return JSON.parse(data);
}
