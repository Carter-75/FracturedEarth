import Phaser from 'phaser';

export class CardBackSprite extends Phaser.GameObjects.Container {
  private backImage: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    const width = 140;
    const height = 210;

    // 1. Back Image (Cropped 2:3 from square 1024x1024 source)
    const back = scene.add.image(0, 0, 'card-back');
    back.setDisplaySize(width, height);
    
    // Calculate crop for square source (centered 2/3 width strip)
    // Phaser coordinates for setCrop are in local pixels of the texture
    const tex = scene.textures.get('card-back').getSourceImage() as HTMLImageElement;
    const sourceW = tex.width;
    const sourceH = tex.height;
    const cropW = sourceH * (2/3);
    const offsetX = (sourceW - cropW) / 2;
    
    back.setCrop(offsetX, 0, cropW, sourceH);
    this.backImage = back;
    this.add(back);

    // 2. Tactical Glow
    const glow = scene.add.graphics();
    glow.lineStyle(2, 0x00ffcc, 0.4);
    glow.strokeRoundedRect(-width/2, -height/2, width, height, 12);
    this.add(glow);

    // 3. Neon Pulse Animation
    scene.tweens.add({
      targets: glow,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.setSize(width, height);
    scene.add.existing(this);
  }

  public setTint(color: number) {
    this.backImage.setTint(color);
  }

  public clearTint() {
    this.backImage.clearTint();
  }
}
