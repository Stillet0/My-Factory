import Phaser from 'phaser';

/** Ambient electric hoist that travels along an overhead rail, carrying a
 * mold block back and forth — purely atmospheric factory-floor detail. */
export class HoistSprite {
  private trolley: Phaser.GameObjects.Image;
  private hook: Phaser.GameObjects.Rectangle;
  private mold: Phaser.GameObjects.Image;
  private minX: number;
  private maxX: number;

  constructor(scene: Phaser.Scene, minX: number, maxX: number, railY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.trolley = scene.add.image(minX, railY, 'hoist_trolley');
    this.hook = scene.add.rectangle(minX, railY + 18, 2, 24, 0x23252a);
    this.mold = scene.add.image(minX, railY + 34, 'mold_block');
    this.startLoop(scene);
  }

  private startLoop(scene: Phaser.Scene): void {
    const travel = () => {
      const goingRight = this.trolley.x <= this.minX + 1;
      const targetX = goingRight ? this.maxX : this.minX;
      scene.tweens.add({
        targets: [this.trolley, this.hook, this.mold],
        x: targetX,
        duration: 6000,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          scene.time.delayedCall(1500 + Math.random() * 2500, travel);
        },
      });
    };
    scene.time.delayedCall(500, travel);
  }

  destroy(): void {
    this.trolley.destroy();
    this.hook.destroy();
    this.mold.destroy();
  }
}
