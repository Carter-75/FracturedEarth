'use client';
 
import React, { useEffect, useRef, useState } from 'react';
import { Game } from 'phaser';
import { loadLocalSettings } from '@/lib/localProfile';
 
interface PhaserGameProps {
  roomCode: string;
  gameState: any;
  userId: string;
  onAction: (action: any) => void;
  onCardDetail?: (card: any) => void;
}
 
export default function PhaserGame({ roomCode, gameState, userId, onAction, onCardDetail }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [mounted, setMounted] = useState(false);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
  const onCardDetailRef = useRef(onCardDetail);
  onCardDetailRef.current = onCardDetail;
  const initialGameStateRef = useRef(gameState);
  const initialUserIdRef = useRef(userId);
 
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || gameRef.current) return;
 
    // Direct dynamic import to ensure it only runs in the browser
    import('@/phaser/config').then(({ createGame }) => {
      if (gameRef.current) return;
      
      const initialData = { 
        roomCode, 
        gameState: initialGameStateRef.current, 
        userId: initialUserIdRef.current, // Use the prop passed from React
        onAction: (a: any) => onActionRef.current(a)
      };
 
      gameRef.current = createGame(containerRef.current!, initialData);
 
      // Listen for events from Phaser
      gameRef.current.events.on('OPEN_CARD_DETAIL', (card: any) => {
        if (onCardDetailRef.current) onCardDetailRef.current(card);
      });
    });
 
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [mounted, roomCode]);
 
  // Sync state updates to Phaser
  useEffect(() => {
    if (gameRef.current && gameState) {
      gameRef.current.events.emit('UPDATE_STATE', gameState);
    }
  }, [gameState]);
 
  useEffect(() => {
    if (gameRef.current && userId) {
      gameRef.current.events.emit('SYNC_USER_ID', userId);
    }
  }, [userId]);
 
  useEffect(() => {
    const tutorialStep = (gameState as any)?.tutorialStep;
    if (gameRef.current && tutorialStep) {
      gameRef.current.events.emit('UPDATE_TUTORIAL_STEP', tutorialStep);
    }
  }, [gameState]);
 
  if (!mounted) return <div className="absolute inset-0 bg-black" />;

  return (
    <div 
      id="phaser-container" 
      ref={containerRef} 
      className="absolute inset-0 z-20 pointer-events-auto"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
