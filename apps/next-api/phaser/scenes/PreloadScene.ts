import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // 1. Loading Text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2, 'SYNCING_NEURAL_LINK...', {
      font: '20px Spectral',
      color: '#00ffcc'
    }).setOrigin(0.5);

    // 2. Load Assets
    const types = ['survival', 'disaster', 'power', 'adapt', 'chaos', 'ascended', 'twist', 'cataclysm'];
    types.forEach(type => {
       this.load.image(`bg-${type}`, `/assets/type-bgs/${type}.png`);
    });

    // 3. Fonts (Already in Web)
    // We assume Spectral and Inter are loaded in CSS, which is true for Next.js

    this.load.on('complete', () => {
      loadingText.destroy();
    });

    this.load.on('error', (file: any) => {
      console.warn('Neural_Link_Warning: Asset load failed:', file.src);
    });

    // 4. Fail-safe timeout
    this.time.delayedCall(5000, () => {
      if (this.scene.isActive('PreloadScene')) {
        console.warn('Neural_Link_Recovery: Preload timed out, forcing transition.');
        this.scene.start('TabletopScene');
      }
    });
  }

  create() {
    this.scene.start('TabletopScene');
  }
}
