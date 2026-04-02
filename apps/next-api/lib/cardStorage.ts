import dbConnect from './mongodb';
import Card from '../models/Card';
import { MatchCard } from './matchEngine';

/**
 * Fetch all cards from MongoDB
 */
export async function getAllCardsFromMongo(): Promise<MatchCard[]> {
  await dbConnect();
  try {
    const cards = await Card.find({}).lean();
    return cards as unknown as MatchCard[];
  } catch (e) {
    console.error('Error fetching cards from MongoDB', e);
    return [];
  }
}

/**
 * Save or Update a card in MongoDB
 */
export async function saveCardToMongo(cardData: Partial<MatchCard>): Promise<boolean> {
  await dbConnect();
  try {
    await Card.findOneAndUpdate(
      { id: cardData.id },
      cardData,
      { upsert: true, new: true }
    );
    return true;
  } catch (e) {
    console.error('Error saving card to MongoDB', e);
    return false;
  }
}

/**
 * Delete a card from MongoDB
 */
export async function deleteCardFromMongo(cardId: string): Promise<boolean> {
  await dbConnect();
  try {
    await Card.deleteOne({ id: cardId });
    return true;
  } catch (e) {
    console.error('Error deleting card from MongoDB', e);
    return false;
  }
}
