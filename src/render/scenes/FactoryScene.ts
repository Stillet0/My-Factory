import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';
import { generateTextures } from '../textures';
import { PressSprite } from '../sprites/PressSprite';
import { EmployeeSprite } from '../sprites/EmployeeSprite';
import { HoistSprite } from '../sprites/HoistSprite';
import type { Factory } from '../../sim/entities/factory';
import { isOnShiftNow } from '../../sim/entities/employee';
import { DAY_LENGTH_MS } from '../../sim/clock';
import { getPressTemplate } from '../../data/presses';

const PRESS_START_X = 120;
const PRESS_SPACING = 150;
const FLOOR_Y = 320;
const BREAK_X = 50;
const BREAK_Y = 340;

export class FactoryScene extends Phaser.Scene {
  private pressSprites = new Map<string, PressSprite>();
  private employeeSprites = new Map<string, EmployeeSprite>();
  private hoist?: HoistSprite;

  constructor() {
    super('FactoryScene');
  }

  create(): void {
    generateTextures(this);
    this.cameras.main.setBackgroundColor(0x1b1d23);
    this.drawFloor();
    this.hoist = new HoistSprite(this, 60, Math.max(700, this.scale.width - 100), 36);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hoist?.destroy());
  }

  private drawFloor(): void {
    const width = Math.max(this.scale.width, 900);
    this.add.tileSprite(0, FLOOR_Y - 10, width, 90, 'floor_tile').setOrigin(0, 0);
  }

  update(_time: number, delta: number): void {
    useGameStore.getState().update(delta);
    const { company, selectedFactoryId, clock } = useGameStore.getState();
    const factory = company.factories.find((f) => f.id === selectedFactoryId);
    if (!factory) return;

    const hourOfDay = ((clock.simTimeMs % DAY_LENGTH_MS) / DAY_LENGTH_MS) * 24;
    this.syncPresses(factory);
    this.syncEmployees(factory, delta, hourOfDay);
  }

  private slotPosition(index: number): { x: number; y: number } {
    return { x: PRESS_START_X + index * PRESS_SPACING, y: FLOOR_Y };
  }

  private syncPresses(factory: Factory): void {
    const seen = new Set<string>();
    factory.presses.forEach((press, i) => {
      seen.add(press.id);
      let spr = this.pressSprites.get(press.id);
      if (!spr) {
        const { x, y } = this.slotPosition(i);
        spr = new PressSprite(this, x, y, getPressTemplate(press.templateId).name);
        this.pressSprites.set(press.id, spr);
      }
      spr.update(press);
    });
    for (const [id, spr] of this.pressSprites) {
      if (!seen.has(id)) {
        spr.destroy();
        this.pressSprites.delete(id);
      }
    }
  }

  private syncEmployees(factory: Factory, delta: number, hourOfDay: number): void {
    const seen = new Set<string>();
    factory.employees.forEach((emp, i) => {
      seen.add(emp.id);
      let spr = this.employeeSprites.get(emp.id);
      if (!spr) {
        spr = new EmployeeSprite(this, emp.role, BREAK_X, BREAK_Y);
        this.employeeSprites.set(emp.id, spr);
      }
      const press = factory.presses.find((p) => p.operatorId === emp.id);
      if (press) {
        const idx = factory.presses.indexOf(press);
        const { x, y } = this.slotPosition(idx);
        spr.setTarget(x - 22, y);
      } else {
        spr.setTarget(BREAK_X + i * 16, BREAK_Y);
      }
      spr.update(delta, isOnShiftNow(emp.shift, hourOfDay));
    });
    for (const [id, spr] of this.employeeSprites) {
      if (!seen.has(id)) {
        spr.destroy();
        this.employeeSprites.delete(id);
      }
    }
  }
}
