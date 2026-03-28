import { canPlayCard, initializeMatch, applyMatchAction } from './src/lib/matchEngine';
import type { MatchCard, MatchPayload } from './src/lib/matchEngine';
import * as fs from 'fs';
import * as path from 'path';

// Mock room players
const players = [
  { userId: 'u1', displayName: 'Player 1', emoji: '👤', isBot: false },
  { userId: 'u2', displayName: 'Player 2', emoji: '🤖', isBot: true },
];

console.log('--- Testing initializeMatch ---');
const state = initializeMatch({
  roomPlayers: players,
  roomCode: 'TEST',
  botCount: 0
});

console.log('Top Card:', state.topCard?.name, `(${state.topCard?.type})`);
console.log('Turn Direction:', state.turnDirection);

console.log('\n--- Testing canPlayCard ---');
const hand = state.players[0].hand;
const validCards = hand.filter(c => canPlayCard(state, c));
console.log(`Hand size: ${hand.length}, Playable cards: ${validCards.length}`);

if (validCards.length > 0) {
  const cardToPlay = validCards[0];
  console.log(`Attempting to play: ${cardToPlay.name} (${cardToPlay.type})`);
  
  const nextState = applyMatchAction({
    current: state,
    action: { type: 'PLAY_CARD', cardId: cardToPlay.id },
    actorUserId: 'u1',
    roomPlayers: players,
    roomCode: 'TEST'
  });
  
  console.log('New Top Card:', nextState.topCard?.name);
  console.log('Cards Played This Turn:', nextState.cardsPlayedThisTurn);
} else {
  console.log('No playable cards in hand. Testing DRAW_CARD...');
  const afterDraw = applyMatchAction({
    current: state,
    action: { type: 'DRAW_CARD' },
    actorUserId: 'u1',
    roomPlayers: players,
    roomCode: 'TEST'
  });
  console.log('Hand size after draw:', afterDraw.players[0].hand.length);
  console.log('Has drawn this turn:', afterDraw.hasDrawnThisTurn);
}

console.log('\n--- Verification Script Completed ---');
