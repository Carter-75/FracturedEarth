import Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class LANScene extends Phaser.Scene {
  private currentTheme!: Theme;

  constructor() {
    super('LANScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.currentTheme = THEMES.find(t => t.name === themeName) || THEMES[0];
  }

  create() {
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Background
    this.add.image(width / 2, height / 2, 'bg_home').setDisplaySize(width, height).setAlpha(0.1).setTint(theme.bgTint);

    // Title
    this.add.text(width / 2, height * 0.15, 'START_PROTOCOL_LOBBY', {
      fontFamily: theme.fontPrimary, fontSize: '36px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba, letterSpacing: 10
    }).setOrigin(0.5);

    // Active Sectors (Room List)
    const listContainer = this.add.container(width / 2, height * 0.5);
    const bg = this.add.rectangle(0, 0, 700, 400, 0x000000, 0.6).setStrokeStyle(1, theme.primary, 0.2);
    listContainer.add(bg);

    this.add.text(width / 2, height * 0.35, 'ACTIVE_NEURAL_SECTORS', {
        fontFamily: theme.fontPrimary, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.5);

    // Placeholder Rooms
    const rooms = [
        { code: 'AX-77', players: '2/4' },
        { code: 'KR-91', players: '1/4' },
        { code: 'BT-04', players: '4/4' }
    ];

    rooms.forEach((r, i) => {
        const item = this.add.container(0, -120 + i * 80);
        const itemBg = this.add.rectangle(0, 0, 600, 60, 0x000000, 0.4).setStrokeStyle(1, theme.primary, 0.1);
        const codeText = this.add.text(-250, 0, r.code, { fontFamily: theme.fontPrimary, fontSize: '20px', color: '#ffffff' }).setOrigin(0, 0.5);
        const playersText = this.add.text(100, 0, `LOAD: ${r.players}`, { fontFamily: theme.fontPrimary, fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba }).setOrigin(0, 0.5);
        const joinBtn = this.add.text(250, 0, 'SYNC_LINK', {
            fontFamily: theme.fontPrimary, fontSize: '16px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.accent).rgba
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        item.add([itemBg, codeText, playersText, joinBtn]);
        listContainer.add(item);
    });

    // Back Button
    this.createButton(width / 2, height * 0.88, 'TERMINATE_LOBBY', () => this.scene.start('HomeScene'));

    // Registry Listener for Theme Changes
    this.game.events.on('theme-changed', (newName: string) => {
        const found = THEMES.find(t => t.name === newName);
        if (found) {
            this.currentTheme = found;
            if (this.scene.isActive()) this.scene.restart();
        }
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 400, 50, 0x000000, 0.8).setStrokeStyle(1, theme.primary, 0.5);
    const txt = this.add.text(0, 0, text, {
      fontFamily: theme.fontPrimary, fontSize: '16px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba
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
