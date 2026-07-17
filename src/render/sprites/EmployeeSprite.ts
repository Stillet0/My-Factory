import Phaser from 'phaser';
import type { Employee } from '../../sim/entities/employee';

const TEXTURE_BY_ROLE: Record<Employee['role'], string> = {
  operator: 'emp_operator',
  setter: 'emp_setter',
  forklift: 'emp_forklift',
};

/** A small pixel-art worker that idles near its assigned post, or wanders
 * slowly near the break area when unassigned/off-shift. */
export class EmployeeSprite {
  readonly sprite: Phaser.GameObjects.Image;
  private targetX: number;
  private targetY: number;
  private wanderTimer = 0;

  constructor(scene: Phaser.Scene, role: Employee['role'], x: number, y: number) {
    this.sprite = scene.add.image(x, y, TEXTURE_BY_ROLE[role]).setOrigin(0.5, 1);
    this.targetX = x;
    this.targetY = y;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  update(deltaMs: number, onShift: boolean): void {
    this.sprite.setAlpha(onShift ? 1 : 0.45);
    const dx = this.targetX - this.sprite.x;
    const dy = this.targetY - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const speed = 0.03 * deltaMs;
      const step = Math.min(dist, speed);
      this.sprite.x += (dx / dist) * step;
      this.sprite.y += (dy / dist) * step;
      this.sprite.setFlipX(dx < 0);
    } else if (onShift) {
      this.wanderTimer -= deltaMs;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2000 + Math.random() * 3000;
        this.targetX += (Math.random() - 0.5) * 14;
      }
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
