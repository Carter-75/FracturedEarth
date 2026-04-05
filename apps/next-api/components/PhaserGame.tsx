'use client';

import React, { useEffect, useRef } from 'react';
import { BootScene } from '../phaser/scenes/BootScene';
import { PreloadScene } from '../phaser/scenes/PreloadScene';
import { GameScene } from '../phaser/scenes/GameScene';
import { loadLocalSettings, saveLocalSettings } from '@/lib/localProfile';

export function PhaserGame({ gameState, onAction }: { gameState: any, onAction: (action: any) => void }) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    async function initPhaser() {
      if (typeof window === 'undefined') return;
      const Phaser = (await import('phaser')).default;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: 'phaser-container',
        transparent: true,
        physics: {
          default: 'arcade',
          arcade: { debug: false },
        },
        scene: [
          BootScene,
          PreloadScene,
          GameScene,
        ],
      };

      if (!gameRef.current) {
        gameRef.current = new Phaser.Game(config);
        
        // Expose state and action handler to scenes
        const settings = loadLocalSettings();
        gameRef.current.registry.set('gameState', gameState);
        gameRef.current.registry.set('onAction', onAction);
        gameRef.current.registry.set('currentTheme', settings.theme);

        // Listen for internal theme changes from Phaser
        gameRef.current.events.on('theme-changed', (newTheme: string) => {
          const s = loadLocalSettings();
          saveLocalSettings({ ...s, theme: newTheme as any });
        });
      }
    }

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Update game state in registry when it changes
  useEffect(() => {
    if (gameRef.current && gameState) {
      gameRef.current.registry.set('gameState', gameState);
      // Emit event for scenes to update
      gameRef.current.events.emit('state-changed', gameState);
    }
  }, [gameState]);

  return (
    <div 
      id="phaser-container" 
      className="w-full h-full flex items-center justify-center bg-black overflow-hidden" 
    />
  );
}
