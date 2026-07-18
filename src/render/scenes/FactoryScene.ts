import Phaser from 'phaser';
import { useGameStore, type UiTab } from '../../store/gameStore';
import { generateTextures } from '../textures';
import { PressSprite } from '../sprites/PressSprite';
import { EmployeeSprite } from '../sprites/EmployeeSprite';
import { HoistSprite } from '../sprites/HoistSprite';
import type { Factory } from '../../sim/entities/factory';
import { isOnShiftNow } from '../../sim/entities/employee';
import { DAY_LENGTH_MS } from '../../sim/clock';
import { getPressTemplate } from '../../data/presses';
import { getMaterial } from '../../data/materials';

/** Top-down factory floor plan: an expandable room (grows with the press
 * count) holding an office corner (click a desk to open the matching
 * management tab), a row of horizontal injection presses, and a stock strip
 * showing raw material, idle mold and finished-parts inventory. */

const ROOM_PAD = 24;
const WALL_COLOR = 0x475569;

const OFFICE_W = 190;
const OFFICE_H = 150;
const OFFICE_GAP = 36;

const PRESS_CELL_W = 150;
const PRESS_CELL_H = 100;
const PRESS_COLS_MAX = 4;

const STOCK_ZONE_H = 110;
const STOCK_GAP = 30;
const BREAK_ZONE_H = 50;

const MAX_MATERIAL_ROWS = 4;
const MAX_MOLD_ICONS = 6;
const MAX_PART_ICONS = 6;
const MATERIAL_BAR_REF_KG = 500;

interface OfficeDesk {
  tab: UiTab;
  label: string;
}

const OFFICE_DESKS: OfficeDesk[] = [
  { tab: 'contracts', label: 'Contrats' },
  { tab: 'hr', label: 'RH' },
  { tab: 'finance', label: 'Finances' },
  { tab: 'research', label: 'R&D' },
  { tab: 'design', label: 'Bureau d’étude' },
  { tab: 'logistics', label: 'Logistique' },
];

interface Layout {
  cols: number;
  rows: number;
  pressAreaX: number;
  pressAreaY: number;
  stockX: number;
  stockY: number;
  stockW: number;
  breakX: number;
  breakY: number;
  roomW: number;
  roomH: number;
}

export class FactoryScene extends Phaser.Scene {
  private pressSprites = new Map<string, PressSprite>();
  private employeeSprites = new Map<string, EmployeeSprite>();
  private hoist?: HoistSprite;

  private wallsGfx!: Phaser.GameObjects.Graphics;
  private officeGfx!: Phaser.GameObjects.Graphics;
  private stockGfx!: Phaser.GameObjects.Graphics;
  private floorTile?: Phaser.GameObjects.TileSprite;
  private officeTitle?: Phaser.GameObjects.Text;
  private officeLabels: Phaser.GameObjects.Text[] = [];
  private officeZones: { tab: UiTab; rect: Phaser.Geom.Rectangle }[] = [];
  private materialBars: Phaser.GameObjects.Rectangle[] = [];
  private materialTracks: Phaser.GameObjects.Rectangle[] = [];
  private materialLabels: Phaser.GameObjects.Text[] = [];
  private moldIcons: Phaser.GameObjects.Image[] = [];
  private partIcons: Phaser.GameObjects.Image[] = [];
  private moldCountLabel?: Phaser.GameObjects.Text;
  private partCountLabel?: Phaser.GameObjects.Text;
  private materialsTitleLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('FactoryScene');
  }

  create(): void {
    generateTextures(this);
    this.cameras.main.setBackgroundColor(0x14161b);
    this.wallsGfx = this.add.graphics();
    this.officeGfx = this.add.graphics();
    this.stockGfx = this.add.graphics();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.hoist?.destroy());
  }

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    for (const zone of this.officeZones) {
      if (Phaser.Geom.Rectangle.Contains(zone.rect, pointer.worldX, pointer.worldY)) {
        useGameStore.getState().setUiTab(zone.tab);
        return;
      }
    }
  }

  update(_time: number, delta: number): void {
    useGameStore.getState().update(delta);
    const { company, selectedFactoryId, clock } = useGameStore.getState();
    const factory = company.factories.find((f) => f.id === selectedFactoryId);
    if (!factory) return;

    const hourOfDay = ((clock.simTimeMs % DAY_LENGTH_MS) / DAY_LENGTH_MS) * 24;
    const layout = this.computeLayout(factory);

    this.drawRoom(layout);
    this.drawOffice(company.factories.length > 1);
    this.drawStockZone(factory, layout);
    this.ensureHoist(layout);

    this.syncPresses(factory, layout);
    this.syncEmployees(factory, delta, hourOfDay, layout);
  }

  private computeLayout(factory: Factory): Layout {
    const n = factory.presses.length;
    const cols = Math.max(1, Math.min(PRESS_COLS_MAX, n || 1));
    const rows = Math.max(1, Math.ceil((n || 1) / cols));

    const pressAreaX = ROOM_PAD + OFFICE_W + OFFICE_GAP;
    const pressAreaY = ROOM_PAD + 20;
    const pressAreaW = cols * PRESS_CELL_W;
    const pressAreaH = rows * PRESS_CELL_H;

    const officeBottom = ROOM_PAD + 20 + OFFICE_H;
    const pressBottom = pressAreaY + pressAreaH;

    const stockX = ROOM_PAD;
    const stockY = Math.max(officeBottom, pressBottom) + STOCK_GAP;
    const stockW = Math.max(pressAreaX + pressAreaW, ROOM_PAD + OFFICE_W) - ROOM_PAD;

    const breakX = ROOM_PAD + 30;
    const breakY = stockY + STOCK_ZONE_H + STOCK_GAP;

    const roomW = Math.max(760, ROOM_PAD * 2 + stockW);
    const roomH = breakY + BREAK_ZONE_H + ROOM_PAD;

    return { cols, rows, pressAreaX, pressAreaY, stockX, stockY, stockW, breakX, breakY, roomW, roomH };
  }

  private drawRoom(layout: Layout): void {
    if (!this.floorTile) {
      this.floorTile = this.add.tileSprite(0, 0, layout.roomW, layout.roomH, 'floor_tile').setOrigin(0, 0);
    } else {
      this.floorTile.setSize(layout.roomW, layout.roomH);
    }
    this.wallsGfx.clear();
    this.wallsGfx.lineStyle(6, WALL_COLOR, 1);
    this.wallsGfx.strokeRect(0, 0, layout.roomW, layout.roomH);
  }

  private drawOffice(hasLogistics: boolean): void {
    this.officeGfx.clear();
    const x = ROOM_PAD;
    const y = ROOM_PAD + 20;

    this.officeGfx.fillStyle(0x1f2937, 1);
    this.officeGfx.fillRect(x, y, OFFICE_W, OFFICE_H);
    this.officeGfx.lineStyle(3, 0x64748b, 1);
    this.officeGfx.strokeRect(x, y, OFFICE_W, OFFICE_H);

    if (!this.officeTitle) {
      this.officeTitle = this.add.text(0, 0, 'BUREAU', { fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }).setOrigin(0.5, 1);
    }
    this.officeTitle.setPosition(x + OFFICE_W / 2, y - 4);

    const cellW = OFFICE_W / 2;
    const cellH = OFFICE_H / 3;
    const zones: { tab: UiTab; rect: Phaser.Geom.Rectangle }[] = [];

    OFFICE_DESKS.forEach((desk, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = x + col * cellW;
      const cy = y + row * cellH;
      const enabled = desk.tab !== 'logistics' || hasLogistics;

      this.officeGfx.lineStyle(1, 0x475569, 1);
      this.officeGfx.strokeRect(cx, cy, cellW, cellH);

      if (!this.officeLabels[i]) {
        this.officeLabels[i] = this.add
          .text(0, 0, '', { fontSize: '10px', color: '#e5e7eb', fontFamily: 'monospace', align: 'center' })
          .setOrigin(0.5);
      }
      const t = this.officeLabels[i];
      t.setText(desk.label);
      t.setPosition(cx + cellW / 2, cy + cellH / 2);
      t.setAlpha(enabled ? 1 : 0.35);

      if (enabled) zones.push({ tab: desk.tab, rect: new Phaser.Geom.Rectangle(cx, cy, cellW, cellH) });
    });

    this.officeZones = zones;
  }

  private drawStockZone(factory: Factory, layout: Layout): void {
    this.stockGfx.clear();
    this.stockGfx.fillStyle(0x1f2937, 0.6);
    this.stockGfx.fillRect(layout.stockX, layout.stockY, layout.stockW, STOCK_ZONE_H);
    this.stockGfx.lineStyle(2, 0x475569, 1);
    this.stockGfx.strokeRect(layout.stockX, layout.stockY, layout.stockW, STOCK_ZONE_H);

    const colW = layout.stockW / 3;
    this.renderMaterials(factory, layout.stockX + 10, layout.stockY + 8, colW - 20);
    this.renderMoldRack(factory, layout.stockX + colW + 10, layout.stockY + 8, colW - 20);
    this.renderPartsCrates(factory, layout.stockX + colW * 2 + 10, layout.stockY + 8, colW - 20);

    this.stockGfx.lineStyle(1, 0x334155, 1);
    this.stockGfx.lineBetween(layout.stockX + colW, layout.stockY + 6, layout.stockX + colW, layout.stockY + STOCK_ZONE_H - 6);
    this.stockGfx.lineBetween(layout.stockX + colW * 2, layout.stockY + 6, layout.stockX + colW * 2, layout.stockY + STOCK_ZONE_H - 6);
  }

  private renderMaterials(factory: Factory, x: number, y: number, w: number): void {
    if (!this.materialsTitleLabel) {
      this.materialsTitleLabel = this.add.text(0, 0, 'MATIÈRES', { fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' });
    }
    this.materialsTitleLabel.setPosition(x, y);

    const entries = Object.entries(factory.materialStockKg)
      .filter(([, kg]) => kg > 0.05)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_MATERIAL_ROWS);

    for (let i = 0; i < MAX_MATERIAL_ROWS; i++) {
      if (!this.materialTracks[i]) {
        this.materialTracks[i] = this.add.rectangle(0, 0, w, 5, 0x111827).setOrigin(0, 0.5);
        this.materialBars[i] = this.add.rectangle(0, 0, 0, 5, 0x38bdf8).setOrigin(0, 0.5);
        this.materialLabels[i] = this.add.text(0, 0, '', { fontSize: '8px', color: '#cbd5e1', fontFamily: 'monospace' });
      }
      const rowY = y + 28 + i * 20;
      const track = this.materialTracks[i];
      const bar = this.materialBars[i];
      const label = this.materialLabels[i];
      const entry = entries[i];
      if (!entry) {
        track.setVisible(false);
        bar.setVisible(false);
        label.setVisible(false);
        continue;
      }
      const [materialId, kg] = entry;
      track.setPosition(x, rowY).setSize(w, 5).setVisible(true);
      const ratio = Math.min(1, kg / MATERIAL_BAR_REF_KG);
      bar.setPosition(x, rowY).setSize(Math.max(1, w * ratio), 5).setVisible(true);
      label.setText(`${getMaterial(materialId).name} ${Math.round(kg)}kg`).setPosition(x, rowY - 12).setVisible(true);
    }
  }

  private renderMoldRack(factory: Factory, x: number, y: number, w: number): void {
    const idleMolds = factory.molds.filter((m) => !factory.presses.some((p) => p.moldId === m.id));
    if (!this.moldCountLabel) this.moldCountLabel = this.add.text(0, 0, '', { fontSize: '9px', color: '#e5e7eb', fontFamily: 'monospace' });
    this.renderIconRow(this.moldIcons, 0x9ca3af, idleMolds.length, x, y, w, MAX_MOLD_ICONS, this.moldCountLabel, 'Moules en stock');
  }

  private renderPartsCrates(factory: Factory, x: number, y: number, w: number): void {
    const pendingUnits = factory.presses.reduce((sum, p) => sum + p.pendingGoodUnits, 0);
    if (!this.partCountLabel) this.partCountLabel = this.add.text(0, 0, '', { fontSize: '9px', color: '#e5e7eb', fontFamily: 'monospace' });
    this.renderIconRow(this.partIcons, 0xf59e0b, Math.round(pendingUnits), x, y, w, MAX_PART_ICONS, this.partCountLabel, 'En attente de livraison');
  }

  private renderIconRow(
    pool: Phaser.GameObjects.Image[],
    tint: number,
    count: number,
    x: number,
    y: number,
    w: number,
    iconCap: number,
    label: Phaser.GameObjects.Text,
    labelPrefix: string,
  ): void {
    const shown = Math.min(count, iconCap);
    const spacing = Math.min(20, w / iconCap);

    for (let i = 0; i < iconCap; i++) {
      if (!pool[i]) pool[i] = this.add.image(0, 0, 'mold_block');
      const icon = pool[i];
      if (i < shown) {
        icon.setPosition(x + 8 + i * spacing, y + 24).setTint(tint).setVisible(true);
      } else {
        icon.setVisible(false);
      }
    }

    label.setText(`${labelPrefix}: ${count}`).setPosition(x, y + 40);
  }

  private ensureHoist(layout: Layout): void {
    if (!this.hoist) {
      this.hoist = new HoistSprite(this, layout.stockX + layout.stockW / 3 + 20, layout.pressAreaX + 40, layout.stockY - 12);
    }
  }

  private slotPosition(index: number, layout: Layout): { x: number; y: number } {
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    return {
      x: layout.pressAreaX + col * PRESS_CELL_W + PRESS_CELL_W / 2,
      y: layout.pressAreaY + row * PRESS_CELL_H + PRESS_CELL_H / 2,
    };
  }

  private syncPresses(factory: Factory, layout: Layout): void {
    const seen = new Set<string>();
    factory.presses.forEach((press, i) => {
      seen.add(press.id);
      let spr = this.pressSprites.get(press.id);
      if (!spr) {
        const { x, y } = this.slotPosition(i, layout);
        spr = new PressSprite(this, x, y, getPressTemplate(press.templateId).name, () => useGameStore.getState().setUiTab('machines'));
        this.pressSprites.set(press.id, spr);
      } else {
        const { x, y } = this.slotPosition(i, layout);
        spr.container.setPosition(x, y);
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

  private syncEmployees(factory: Factory, delta: number, hourOfDay: number, layout: Layout): void {
    const seen = new Set<string>();
    factory.employees.forEach((emp, i) => {
      seen.add(emp.id);
      let spr = this.employeeSprites.get(emp.id);
      if (!spr) {
        spr = new EmployeeSprite(this, emp.role, layout.breakX, layout.breakY);
        this.employeeSprites.set(emp.id, spr);
      }
      const operatedPress = emp.role === 'operator' ? factory.presses.find((p) => p.operatorId === emp.id) : undefined;
      const taskPress = emp.task && emp.assignedPressId ? factory.presses.find((p) => p.id === emp.assignedPressId) : undefined;
      const targetPress = operatedPress ?? taskPress;
      if (targetPress) {
        const idx = factory.presses.indexOf(targetPress);
        const { x, y } = this.slotPosition(idx, layout);
        spr.setTarget(x, y + 30);
      } else {
        spr.setTarget(layout.breakX + i * 16, layout.breakY);
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
