import Phaser from 'phaser';

/** Ambient electric hoist travelling along an overhead rail, carrying a mold
 * block back and forth between the mold rack and the press bay — seen from
 * above, so trolley and payload just glide together with no hanging hook. */
export class HoistSprite {
  private trolley: Phaser.GameObjects.Image;
  private mold: Phaser.GameObjects.Image;
  private minX: number;
  private maxX: number;

  constructor(scene: Phaser.Scene, minX: number, maxX: number, railY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.trolley = scene.add.image(minX, railY, 'hoist_trolley').setAlpha(0.85);
    this.mold = scene.add.image(minX, railY, 'mold_block').setAlpha(0.85);
    this.startLoop(scene);
  }

  private startLoop(scene: Phaser.Scene): void {
    const travel = () => {
      const goingRight = this.trolley.x <= this.minX + 1;
      const targetX = goingRight ? this.maxX : this.minX;
      scene.tweens.add({
        targets: [this.trolley, this.mold],
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
    this.mold.destroy();
  }
}
