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

/** Visualises one press: body, a platen that squashes shut on 'clamping',
 * and a status dot reflecting the current cycle state. */
export class PressSprite {
  readonly container: Phaser.GameObjects.Container;
  private platen: Phaser.GameObjects.Image;
  private statusDot: Phaser.GameObjects.Image;
  private wearBar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private lastState: Press['state'] | null = null;
  private clampTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    this.container = scene.add.container(x, y);

    const body = scene.add.image(0, 0, 'press_body').setOrigin(0.5, 1);
    this.platen = scene.add.image(0, -34, 'press_platen').setOrigin(0.5, 1);
    this.statusDot = scene.add.image(24, -50, 'status_dot').setTint(STATE_COLORS.idle);
    this.wearBar = scene.add.rectangle(-24, -54, 0, 4, 0xef4444).setOrigin(0, 0.5);
    scene.add.rectangle(-24, -54, 48, 4, 0x1f2937).setOrigin(0, 0.5).setDepth(-1);
    this.label = scene.add.text(0, 4, name, { fontSize: '10px', color: '#d1d5db', fontFamily: 'monospace' }).setOrigin(0.5, 0);

    this.container.add([body, this.platen, this.statusDot, this.wearBar, this.label]);
  }

  update(press: Press): void {
    this.statusDot.setTint(STATE_COLORS[press.state]);
    this.wearBar.width = 48 * press.wear;

    if (press.state !== this.lastState) {
      this.lastState = press.state;
      this.clampTween?.stop();
      const scene = this.container.scene;
      if (press.state === 'clamping') {
        this.clampTween = scene.tweens.add({ targets: this.platen, y: -22, duration: 500, ease: 'Cubic.easeIn' });
      } else if (press.state === 'ejecting') {
        this.clampTween = scene.tweens.add({ targets: this.platen, y: -34, duration: 350, ease: 'Cubic.easeOut' });
      } else if (press.state === 'idle') {
        this.platen.y = -34;
      } else if (press.state === 'injecting') {
        this.clampTween = scene.tweens.add({
          targets: this.platen,
          y: -21,
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
