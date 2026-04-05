import * as Phaser from 'phaser';
import { Theme } from '../../lib/themeConfig';

export class CinematicOverlay {
    private scene: Phaser.Scene;
    private theme: Theme;
    
    private background?: Phaser.GameObjects.Image;
    private tintLayer?: Phaser.GameObjects.Rectangle;
    private scanlines?: Phaser.GameObjects.TileSprite;
    private vignette?: Phaser.GameObjects.Image;
    private noise?: Phaser.GameObjects.TileSprite;

    constructor(scene: Phaser.Scene, theme: Theme) {
        this.scene = scene;
        this.theme = theme;
        this.create();
    }

    private create() {
        const { width, height } = this.scene.scale;

        // 1. Background Image (Lowest Layer)
        this.background = this.scene.add.image(width / 2, height / 2, this.theme.bgAsset)
            .setDisplaySize(width, height)
            .setAlpha(0.2);

        // 2. Tint Layer
        this.tintLayer = this.scene.add.rectangle(0, 0, width, height, this.theme.bgTint, 0.05)
            .setOrigin(0);

        // 3. Scanlines
        this.scanlines = this.scene.add.tileSprite(0, 0, width, height, 'noise')
            .setOrigin(0)
            .setAlpha(this.theme.scanlineAlpha)
            .setTint(this.theme.primary)
            .setBlendMode('ADD');
        
        // Custom scanline simulation using tiling
        if (this.theme.scanlineAlpha > 0) {
            this.scene.time.addEvent({
                delay: 50,
                callback: () => {
                    if (this.scanlines) this.scanlines.tilePositionY += 1;
                },
                loop: true
            });
        }

        // 4. Noise / Grain
        this.noise = this.scene.add.tileSprite(0, 0, width, height, 'noise')
            .setOrigin(0)
            .setAlpha(this.theme.noiseAlpha)
            .setBlendMode('SCREEN');
        
        this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                if (this.noise) {
                    this.noise.tilePositionX = Math.random() * 100;
                    this.noise.tilePositionY = Math.random() * 100;
                }
            },
            loop: true
        });

        // 5. Vignette (Highest Layer)
        this.vignette = this.scene.add.image(width / 2, height / 2, 'vignette')
            .setDisplaySize(width, height)
            .setAlpha(this.theme.vignetteAlpha)
            .setBlendMode('MULTIPLY');

        // Glitch Effect (Optional)
        if (this.theme.glitchMode) {
            this.applyGlitch();
        }
    }

    private applyGlitch() {
        this.scene.time.addEvent({
            delay: 3000,
            callback: () => {
                if (!this.background) return;
                const originalX = this.background.x;
                this.scene.tweens.add({
                    targets: this.background,
                    x: originalX + (Math.random() * 10 - 5),
                    alpha: 0.5,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        if (this.background) {
                            this.background.x = originalX;
                            this.background.setAlpha(0.2);
                        }
                    }
                });
            },
            loop: true
        });
    }

    public updateTheme(newTheme: Theme) {
        this.theme = newTheme;
        const { width, height } = this.scene.scale;

        if (this.background) {
            this.background.setTexture(this.theme.bgAsset).setDisplaySize(width, height);
        }
        if (this.tintLayer) {
            this.tintLayer.setFillStyle(this.theme.bgTint, 0.05);
        }
        if (this.scanlines) {
            this.scanlines.setAlpha(this.theme.scanlineAlpha).setTint(this.theme.primary);
        }
        if (this.noise) {
            this.noise.setAlpha(this.theme.noiseAlpha);
        }
        if (this.vignette) {
            this.vignette.setAlpha(this.theme.vignetteAlpha);
        }
    }
}
