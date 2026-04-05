import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class TutorialScene extends Phaser.Scene {
  private currentTheme!: Theme;

  constructor() {
    super('TutorialScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Background
    this.add.image(width / 2, height / 2, 'bg_adapt').setDisplaySize(width, height).setAlpha(0.1).setTint(theme.bgTint);

    // Title
    this.add.text(width / 2, height * 0.1, 'TRAINING_PROGRAM: NEURAL_DEPLOYMENT', {
      fontFamily: theme.fontPrimary, fontSize: '32px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, letterSpacing: 8
    }).setOrigin(0.5);

    // Tutorial Area
    const tutorialBoard = this.add.container(width / 2, height * 0.5);
    const bg = this.add.rectangle(0, 0, 1000, 500, 0x000000, 0.4).setStrokeStyle(1, theme.primary, 0.1);
    tutorialBoard.add(bg);

    // Step Indicator
    const stepTxt = this.add.text(0, -200, 'STEP_1: SECTOR_INITIALIZATION', {
        fontFamily: theme.fontPrimary, fontSize: '20px', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba, fontStyle: 'bold'
    }).setOrigin(0.5);
    tutorialBoard.add(stepTxt);

    // Dummy Cards for tutorial
    const cardTypes = ['SURVIVAL', 'POWER', 'DISASTER'];
    cardTypes.forEach((type, i) => {
        this.createTutorialCard(tutorialBoard, -300 + i * 300, 20, type);
    });

    // Back Button
    this.createButton(width / 2, height * 0.88, 'END_TRAINING_CYCLE', () => this.scene.start('HomeScene'));

    // Registry Listener for Theme Changes
    this.game.events.on('theme-changed', (newName: string) => {
        const found = THEMES.find(t => t.name === newName);
        if (found) {
            this.currentTheme = found;
            if (this.scene.isActive()) this.scene.restart();
        }
    });
  }

  private createTutorialCard(parent: Phaser.GameObjects.Container, x: number, y: number, type: string) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bg = this.add.image(0, 0, 'card_frame').setDisplaySize(120, 180);
    const tbg = this.add.image(0,0, `bg_${type.toLowerCase()}`).setDisplaySize(110, 170).setAlpha(0.6);
    const txt = this.add.text(0, -60, type, { 
        fontFamily: theme.fontPrimary, fontSize: '12px', fontStyle: 'bold', color: '#ffffff' 
    }).setOrigin(0.5);
    container.add([tbg, bg, txt]);
    parent.add(container);
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 300, 50, 0x000000, 0.8).setStrokeStyle(1, theme.primary, 0.5);
    const txt = this.add.text(0, 0, text, {
      fontFamily: theme.fontPrimary, fontSize: '14px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
    }).setOrigin(0.5);
    container.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.setStrokeStyle(2, theme.accent, 1);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.accent).rgba);
      })
      .on('pointerout', () => {
        bg.setStrokeStyle(1, theme.primary, 0.5);
        txt.setColor(Phaser.Display.Color.IntegerToColor(theme.primary).rgba);
      })
      .on('pointerdown', callback);

    return container;
  }
}
