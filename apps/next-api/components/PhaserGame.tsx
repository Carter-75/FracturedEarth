'use client';
 
import React, { useEffect, useRef, useState } from 'react';
import { Game } from 'phaser';
import { loadLocalSettings } from '@/lib/localProfile';
 
interface PhaserGameProps {
  roomCode: string;
  gameState: any;
  onAction: (action: any) => void;
  onCardDetail?: (card: any) => void;
}
 
export default function PhaserGame({ roomCode, gameState, onAction, onCardDetail }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [mounted, setMounted] = useState(false);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;
 
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || gameRef.current) return;
 
    // Direct dynamic import to ensure it only runs in the browser
    import('@/phaser/config').then(({ createGame }) => {
      if (gameRef.current) return;
      
      const userId = loadLocalSettings().userId;
      const initialData = { 
        roomCode, 
        gameState, 
        userId,
        onAction: (a: any) => onActionRef.current(a)
      };
 
      gameRef.current = createGame(containerRef.current!, initialData);
 
      // Listen for events from Phaser
      gameRef.current.events.on('OPEN_CARD_DETAIL', (card: any) => {
        if (onCardDetail) onCardDetail(card);
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
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
