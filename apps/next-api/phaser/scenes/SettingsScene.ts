import * as Phaser from 'phaser';
import { THEMES, Theme } from '../../lib/themeConfig';

export class SettingsScene extends Phaser.Scene {
  private currentTheme!: Theme;
  private themeIndex: number = 0;

  constructor() {
    super('SettingsScene');
  }

  init() {
    const themeName = this.registry.get('currentTheme') || 'Obsidian';
    this.themeIndex = THEMES.findIndex(t => t.name === themeName);
    if (this.themeIndex === -1) this.themeIndex = 0;
    this.currentTheme = THEMES[this.themeIndex];
  }

  create() {
    this.renderSettings();
  }

  private renderSettings() {
    this.children.removeAll();
    const { width, height } = this.scale;
    const theme = this.currentTheme;

    // Background
    this.add.image(width / 2, height / 2, 'bg_power').setDisplaySize(width, height).setAlpha(0.1).setTint(theme.bgTint);

    // Title
    this.add.text(width / 2, height * 0.15, 'SYSTEM_CONFIGURATION', {
      fontFamily: theme.fontPrimary, fontSize: '32px', fontStyle: 'bold', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, letterSpacing: 8
    }).setOrigin(0.5);

    // Settings Panel
    const panel = this.add.container(width / 2, height / 2);
    const bg = this.add.rectangle(0, 0, 800, 500, 0x000000, 0.6).setStrokeStyle(1, theme.primary, 0.2);
    panel.add(bg);

    // Theme Picker Row
    const themeRow = this.add.container(-350, -180);
    const themeLabel = this.add.text(0, 0, 'ACTIVE_NEURAL_THEME', {
        fontFamily: theme.fontPrimary, fontSize: '18px', color: '#ffffff'
    });
    
    const themeValue = this.add.text(700, 0, theme.name.toUpperCase(), {
        fontFamily: theme.fontPrimary, fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(theme.primary).rgba, fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Cycle Buttons
    const prevBtn = this.add.text(450, 0, '<', { fontSize: '24px', color: '#ffffff' }).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.cycleTheme(-1));
    const nextBtn = this.add.text(720, 0, '>', { fontSize: '24px', color: '#ffffff' }).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.cycleTheme(1));

    themeRow.add([themeLabel, themeValue, prevBtn, nextBtn]);
    panel.add(themeRow);

    // Other Generic Settings
    const otherSettings = [
      { label: 'VISUAL_OVERLAY_FX', value: 'ULTRA_STABLE' },
      { label: 'AUDIO_LINK_SYNC', value: 'ENABLED' },
      { label: 'HAPTIC_FEEDBACK', value: 'MINIMAL' }
    ];

    otherSettings.forEach((s, i) => {
        const item = this.add.container(-350, -80 + i * 80);
        const label = this.add.text(0, 0, s.label, {
            fontFamily: theme.fontPrimary, fontSize: '18px', color: '#ffffff'
        });
        const val = this.add.text(700, 0, s.value, {
            fontFamily: theme.fontPrimary, fontSize: '18px', color: Phaser.Display.Color.IntegerToColor(theme.secondary).rgba, fontStyle: 'bold'
        }).setOrigin(1, 0);
        item.add([label, val]);
        panel.add(item);
    });

    // Back Button
    this.createButton(width / 2, height * 0.85, 'RETURN_TO_BASE_LINK', () => this.scene.start('HomeScene'));
  }

  private cycleTheme(dir: number) {
    this.themeIndex = (this.themeIndex + dir + THEMES.length) % THEMES.length;
    this.currentTheme = THEMES[this.themeIndex];
    
    // Update registry and emit global events
    this.registry.set('currentTheme', this.currentTheme.name);
    this.game.events.emit('theme-changed', this.currentTheme.name);
    
    // Re-render scene to show immediate change
    this.renderSettings();
  }

  private createButton(x: number, y: number, text: string, callback: () => void) {
    const theme = this.currentTheme;
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 320, 50, 0x000000, 0.8).setStrokeStyle(1, theme.primary, 0.5);
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
