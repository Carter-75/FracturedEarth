import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // We could load a minimal loading bar here
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
