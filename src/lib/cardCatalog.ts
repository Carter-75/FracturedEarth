import type { MatchCard } from './matchEngine';
import rawCards from '../data/cards.json';

type RawCard = {
  id: string;
  name: string;
  type: string;
  pointsDelta: number;
  drawCount: number;
  tier?: number | null;
  effect?: string | null;
  gainHealth?: number | null;
  healthDelta?: number | null;
  disasterKind?: string | null;
  blocksDisaster?: string | null;
};

function toMatchCard(raw: RawCard): MatchCard {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type as MatchCard['type'],
    pointsDelta: raw.pointsDelta,
    drawCount: raw.drawCount,
    ...(raw.tier != null && { tier: raw.tier as 1 | 2 | 3 | 4 | 5 }),
    ...(raw.effect != null && raw.effect !== '' && { effect: raw.effect }),
    ...(raw.gainHealth != null && { gainHealth: raw.gainHealth }),
    ...(raw.healthDelta != null && { healthDelta: raw.healthDelta }),
    ...(raw.disasterKind != null && raw.disasterKind !== '' && {
      disasterKind: raw.disasterKind as MatchCard['disasterKind'],
    }),
    ...(raw.blocksDisaster != null && raw.blocksDisaster !== '' && {
      blocksDisaster: raw.blocksDisaster as MatchCard['blocksDisaster'],
    }),
  };
}

import { getAllCardsFromRedis } from './cardStorage';

const SURVIVAL_CARDS: MatchCard[] = (rawCards.SURVIVAL as RawCard[]).map(toMatchCard);
const DISASTER_CARDS: MatchCard[] = (rawCards.DISASTER as RawCard[]).map(toMatchCard);
const POWER_CARDS: MatchCard[] = (rawCards.POWER as RawCard[]).map(toMatchCard);
const ADAPT_CARDS: MatchCard[] = (rawCards.ADAPT as RawCard[]).map(toMatchCard);
const CHAOS_CARDS: MatchCard[] = (rawCards.CHAOS as RawCard[]).map(toMatchCard);
const ASCENDED_CARDS: MatchCard[] = (rawCards.ASCENDED as RawCard[]).map(toMatchCard);
const TWIST_CARDS: MatchCard[] = (rawCards.TWIST as RawCard[]).map(toMatchCard);
const CATACLYSM_CARDS: MatchCard[] = (rawCards.CATACLYSM as RawCard[]).map(toMatchCard);

const STATIC_BASE_CARDS = [
  ...SURVIVAL_CARDS,
  ...DISASTER_CARDS,
  ...POWER_CARDS,
  ...ADAPT_CARDS,
  ...CHAOS_CARDS,
  ...ASCENDED_CARDS,
  ...TWIST_CARDS,
  ...CATACLYSM_CARDS,
];

export async function generateNamedBaseCards(): Promise<MatchCard[]> {
  const fromDb = await getAllCardsFromRedis();
  if (fromDb && fromDb.length > 0) return fromDb.map(c => ({...c}));
  return STATIC_BASE_CARDS.map((card) => ({ ...card }));
}
