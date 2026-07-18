import Phaser from 'phaser';
import type { Press } from '../../sim/entities/press';

const STATE_COLORS: Record<Press['state'], number> = {
  idle: 0x9ca3af,
  clamping: 0xfacc15,
  injecting: 0xf97316,
  cooling: 0x38bdf8,
  ejecting: 0x4ade80,
  fault: 0xef4444,
};

const FIXED_PLATEN_X = -2;
const OPEN_X = 26;
const CLOSED_X = 6;

/** Visualises one press as seen from directly overhead: a barrel (injection
 * unit) feeds a fixed platen, and a moving platen slides left/right to
 * open/close the mold cavity — the real clamping axis of an injection press
 * runs horizontally, not up/down. */
export class PressSprite {
  readonly container: Phaser.GameObjects.Container;
  private movingPlaten: Phaser.GameObjects.Image;
  private barrel: Phaser.GameObjects.Image;
  private statusDot: Phaser.GameObjects.Image;
  private wearBar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private lastState: Press['state'] | null = null;
  private clampTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string, onClick?: () => void) {
    this.container = scene.add.container(x, y);

    const chassis = scene.add.image(0, 0, 'press_chassis');
    this.barrel = scene.add.image(-20, 0, 'press_barrel').setOrigin(1, 0.5);
    const fixedPlaten = scene.add.image(FIXED_PLATEN_X, 0, 'press_platen_h');
    this.movingPlaten = scene.add.image(OPEN_X, 0, 'press_platen_h');
    this.statusDot = scene.add.image(0, -26, 'status_dot').setTint(STATE_COLORS.idle);
    const wearTrack = scene.add.rectangle(-24, -32, 48, 4, 0x1f2937).setOrigin(0, 0.5);
    this.wearBar = scene.add.rectangle(-24, -32, 0, 4, 0xef4444).setOrigin(0, 0.5);
    this.label = scene.add.text(0, 22, name, { fontSize: '10px', color: '#d1d5db', fontFamily: 'monospace' }).setOrigin(0.5, 0);

    this.container.add([chassis, this.barrel, fixedPlaten, this.movingPlaten, wearTrack, this.wearBar, this.statusDot, this.label]);

    if (onClick) {
      this.container.setInteractive({
        hitArea: new Phaser.Geom.Rectangle(-65, -34, 130, 74),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });
      this.container.on('pointerdown', onClick);
    }
  }

  update(press: Press): void {
    this.statusDot.setTint(STATE_COLORS[press.state]);
    this.wearBar.width = 48 * press.wear;

    if (press.state !== this.lastState) {
      this.lastState = press.state;
      this.clampTween?.stop();
      const scene = this.container.scene;
      if (press.state === 'clamping') {
        this.clampTween = scene.tweens.add({ targets: this.movingPlaten, x: CLOSED_X, duration: 500, ease: 'Cubic.easeIn' });
      } else if (press.state === 'ejecting') {
        this.clampTween = scene.tweens.add({ targets: this.movingPlaten, x: OPEN_X, duration: 350, ease: 'Cubic.easeOut' });
      } else if (press.state === 'idle') {
        this.movingPlaten.x = OPEN_X;
      } else if (press.state === 'injecting') {
        this.clampTween = scene.tweens.add({
          targets: this.movingPlaten,
          x: CLOSED_X - 2,
          duration: 120,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
