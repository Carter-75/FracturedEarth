import { describe, it, expect } from 'vitest';
import { initializeMatch, applyMatchAction } from '../lib/matchEngine';
import { MatchPlayer, MatchAction } from '../types/game';

describe('Fractured Earth - Match Engine', () => {
  const mockPlayers: MatchPlayer[] = [
    { id: 'p1', displayName: 'Player 1', emoji: '🌍', health: 5, survivalPoints: 0, hand: [], traits: [], isBot: false },
    { id: 'p2', displayName: 'Player 2', emoji: '🤖', health: 5, survivalPoints: 0, hand: [], traits: [], isBot: true }
  ];

  it('should initialize match with correct state', () => {
    const state = initializeMatch(mockPlayers, 'seed-123');
    
    expect(state.players).toHaveLength(2);
    expect(state.players[0].hand).toHaveLength(3); // Starting hand size
    expect(state.drawPile.length).toBeGreaterThan(50);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.round).toBe(1);
  });

  it('should handle DRAW_CARD action', () => {
    let state = initializeMatch(mockPlayers, 'seed-123');
    const initialHandSize = state.players[0].hand.length;
    const initialDrawPileSize = state.drawPile.length;

    const action: MatchAction = { type: 'DRAW_CARD' };
    state = applyMatchAction(state, 'p1', action);

    expect(state.players[0].hand).toHaveLength(initialHandSize + 1);
    expect(state.drawPile).toHaveLength(initialDrawPileSize - 1);
    expect(state.hasDrawnThisTurn).toBe(true);
  });

  it('should prevent double drawing', () => {
    let state = initializeMatch(mockPlayers, 'seed-123');
    state = applyMatchAction(state, 'p1', { type: 'DRAW_CARD' });
    const handSizeAfterFirstDraw = state.players[0].hand.length;

    // Second draw should be ignored or fail
    state = applyMatchAction(state, 'p1', { type: 'DRAW_CARD' });
    expect(state.players[0].hand).toHaveLength(handSizeAfterFirstDraw);
  });

  it('should transition rounds after all players take turns', () => {
    let state = initializeMatch(mockPlayers, 'seed-123');
    
    // Player 1 turn
    state = applyMatchAction(state, 'p1', { type: 'DRAW_CARD' });
    state = applyMatchAction(state, 'p1', { type: 'END_TURN' });
    
    expect(state.activePlayerIndex).toBe(1); // Now Player 2 (Bot)
    
    // Bot 1 turn (Simplified for test)
    state = applyMatchAction(state, 'p2', { type: 'DRAW_CARD' });
    state = applyMatchAction(state, 'p2', { type: 'END_TURN' });

    expect(state.round).toBe(2);
    expect(state.activePlayerIndex).toBe(0);
  });

  it('should trigger Global Disaster Phase on Round 3', () => {
    let state = initializeMatch(mockPlayers, 'seed-123');
    state.round = 3;
    
    // Trigger any action to refresh phase logic
    state = applyMatchAction(state, 'p1', { type: 'DRAW_CARD' });
    expect(state.isGlobalDisasterPhase).toBe(true);
  });

  it('should handle PLAY_CARD for BUFF effects', () => {
    let state = initializeMatch(mockPlayers, 'seed-123');
    // Find a card that is a Buff in hand (or force one)
    const buffCard = state.players[0].hand[0];
    const initialPoints = state.players[0].survivalPoints;

    state = applyMatchAction(state, 'p1', { 
      type: 'PLAY_CARD', 
      cardId: buffCard.id 
    });

    // Buffs usually increase survival points or add traits
    expect(state.players[0].survivalPoints).toBeGreaterThanOrEqual(initialPoints);
    expect(state.discardPile[0].id).toBe(buffCard.id);
  });
});
