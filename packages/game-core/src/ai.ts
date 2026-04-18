import { MatchPayload, MatchCard, MatchPlayer } from './types.js';
import { playCard } from './engine.js';

export interface BotDecision {
  type: 'PLAY' | 'DISCARD' | 'END_TURN';
  cardId?: string;
  targetPlayerId?: string;
  score: number;
}

/**
 * Utility-Based AI Agent for Fractured Earth.
 * Performs move-by-move simulation to maximize board utility.
 */
export class AIBrain {
  private state: MatchPayload;
  private bot: MatchPlayer;

  constructor(state: MatchPayload, botId: string) {
    this.state = state;
    const found = state.players.find(p => p.id === botId);
    if (!found) throw new Error('Bot not found in match state');
    this.bot = found;
  }

  /**
   * Simulates all possible actions and picks the one resulting in the highest state utility.
   */
  public chooseBestAction(): BotDecision | null {
    const playable = this.bot.hand.filter(c => this.canPlay(c));
    if (playable.length === 0) return null;

    const decisions: BotDecision[] = [];

    for (const card of playable) {
        const potentialTargets = this.getPotentialTargets(card);
        
        for (const targetId of potentialTargets) {
            try {
                // Simulate the state after playing this card
                // Use state-based seed for simulation to ensure dynamic but deterministic moves
                const simSeed = (this.state.revision || 0) + (this.state.round * 100) + targetId?.length!;
                const simulatedState = playCard(this.state, card.id, targetId, () => (simSeed % 100) / 100, 0);
                const utility = this.scoreStateUtility(simulatedState, this.bot.id);
                
                decisions.push({
                    type: 'PLAY',
                    cardId: card.id,
                    targetPlayerId: targetId,
                    score: utility
                });
            } catch (e) {
                // Ignore invalid simulations
            }
        }
    }

    if (decisions.length === 0) return null;

    // Sort by utility score
    const best = decisions.sort((a, b) => b.score - a.score)[0];
    
    // Baseline: only play if it improves or maintains utility
    const currentUtility = this.scoreStateUtility(this.state, this.bot.id);
    if (best.score < currentUtility - 5) return null; // Logic threshold to hold cards

    return best;
  }

  /**
   * Selects the discard that maximizes the utility of the remaining hand.
   */
  public chooseBestDiscard(): BotDecision {
    const decisions: BotDecision[] = [];

    for (const card of this.bot.hand) {
        // Simulate discarding this card
        const nextHand = this.bot.hand.filter(c => c.id !== card.id);
        const simState: MatchPayload = {
            ...this.state,
            players: this.state.players.map(p => 
                p.id === this.bot.id ? { ...p, hand: nextHand } : p
            )
        };
        const utility = this.scoreStateUtility(simState, this.bot.id);
        decisions.push({ type: 'DISCARD', cardId: card.id, score: utility });
    }

    // Pick the one that leaves us with the highest remaining utility
    return decisions.sort((a, b) => b.score - a.score)[0];
  }

  private canPlay(card: MatchCard): boolean {
     if (card.discardCost && (this.bot.hand.length - 1) < card.discardCost) return false;
     return true;
  }

  private getPotentialTargets(card: MatchCard): (string | undefined)[] {
    const others = this.state.players.filter(p => p.id !== this.bot.id && p.health > 0);
    if (others.length === 0) return [undefined];
    
    // Aggressive cards need a target
    if (card.type === 'CHAOS' || card.type === 'DISASTER') {
        return others.map(o => o.id);
    }
    
    return [undefined];
  }

  /**
   * Core Utility Function: Maps a game state to a numeric desirability value.
   */
  private scoreStateUtility(state: MatchPayload, botId: string): number {
    const me = state.players.find(p => p.id === botId);
    if (!me || me.health <= 0) return -9999;

    const opponents = state.players.filter(p => p.id !== botId);
    const leader = opponents.sort((a, b) => b.survivalPoints - a.survivalPoints)[0];

    let score = 0;

    // 1. My Survival Points (Weighted heavily)
    score += me.survivalPoints * 25;
    if (me.survivalPoints >= 30) score += 5000; // Winning state!

    // 2. My Health (Survival is mandatory)
    score += me.health * 100; // Much higher weight on health to prevent suicide moves
    if (me.health < 5) score -= 500; // Danger zone penalty

    // 3. Opponent Suppression (Preventing others from winning)
    if (leader) {
        score -= (leader.survivalPoints - me.survivalPoints) * 30; // Scale penalty relative to me
        if (leader.survivalPoints >= 25) score -= 1000; // Critical threat
    }

    // 4. Board Presence (Pinned powers/traits)
    // Value power cards that block disasters that are likely/active
    score += me.powers.length * 30; 
    
    // 5. Hand Potential (More cards = more options)
    // Avoid playing too many cards if hand is small (resource management)
    score += me.hand.length * 10;
    if (me.hand.length < 3) score -= 50; 

    return score;
  }
}
