import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TabletopScene } from './scenes/TabletopScene';

export function createGame(parent: HTMLElement, initialData?: any) {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: parent,
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scene: [BootScene, PreloadScene, TabletopScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    callbacks: {
      preBoot: (game) => {
        if (initialData) {
          game.registry.set('INITIAL_DATA', initialData);
        }
      }
    }
  };

  return new Phaser.Game(config);
}
