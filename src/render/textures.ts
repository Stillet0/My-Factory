import Phaser from 'phaser';

/** Procedurally bakes small pixel-art-style textures so the game ships with
 * zero binary assets. Nearest-neighbour filtering (pixelArt:true on the game
 * config) keeps them crisp/blocky when scaled up. Everything is drawn as seen
 * from directly overhead (top-down factory floor plan). */
export function generateTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  bakeFloorTile(g, scene);
  bakePressChassis(g, scene);
  bakePressBarrel(g, scene);
  bakePressPlatenH(g, scene);
  bakeWorkerToken(g, scene, 'emp_operator', 0x3b82f6);
  bakeWorkerToken(g, scene, 'emp_setter', 0xf59e0b);
  bakeWorkerToken(g, scene, 'emp_forklift', 0x22c55e);
  bakeHoistTrolley(g, scene);
  bakeMoldBlock(g, scene);
  bakeStatusDot(g, scene);

  g.destroy();
}

function bakeFloorTile(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  g.fillStyle(0x24262d, 1);
  g.fillRect(0, 0, 32, 32);
  g.lineStyle(1, 0x2c2f37, 1);
  g.strokeRect(0, 0, 32, 32);
  g.fillStyle(0x282a32, 1);
  g.fillRect(0, 0, 16, 16);
  g.fillRect(16, 16, 16, 16);
  g.generateTexture('floor_tile', 32, 32);
  if (scene.textures.get('floor_tile')) scene.textures.get('floor_tile').setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Flat chassis strip, seen from above — the machine's footprint on the floor. */
function bakePressChassis(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 130;
  const h = 26;
  g.fillStyle(0x2f3238, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x3d4147, 1);
  g.fillRect(3, 3, w - 6, h - 6);
  g.generateTexture('press_chassis', w, h);
  scene.textures.get('press_chassis')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Injection barrel — a fixed unit feeding the mold along the machine's
 * horizontal clamping axis (the real orientation of an injection press). */
function bakePressBarrel(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 36;
  const h = 12;
  g.fillStyle(0x6b7178, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x8b8f96, 1);
  g.fillRect(2, 2, w - 4, h - 4);
  g.generateTexture('press_barrel', w, h);
  scene.textures.get('press_barrel')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** One clamp platen (fixed or moving) — reused for both halves of the mold. */
function bakePressPlatenH(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 16;
  const h = 40;
  g.fillStyle(0x8b8f96, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x6b7178, 1);
  g.fillRect(0, 0, 4, h);
  g.generateTexture('press_platen_h', w, h);
  scene.textures.get('press_platen_h')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Top-down worker token: a colored disc (role color) with a small highlight,
 * since a walking humanoid silhouette only reads correctly from the side. */
function bakeWorkerToken(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene, key: string, color: number): void {
  g.clear();
  const d = 16;
  g.fillStyle(0x14161b, 1);
  g.fillCircle(d / 2, d / 2, d / 2);
  g.fillStyle(color, 1);
  g.fillCircle(d / 2, d / 2, d / 2 - 2);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(d / 2 - 2, d / 2 - 2, 2);
  g.generateTexture(key, d, d);
  scene.textures.get(key)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakeHoistTrolley(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 26;
  const h = 12;
  g.fillStyle(0xf59e0b, 1);
  g.fillRect(0, 0, w, 6);
  g.fillStyle(0x23252a, 1);
  g.fillRect(w / 2 - 1, 6, 2, h - 6);
  g.generateTexture('hoist_trolley', w, h);
  scene.textures.get('hoist_trolley')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakeMoldBlock(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const s = 16;
  g.fillStyle(0x4b5563, 1);
  g.fillRect(0, 0, s, s);
  g.fillStyle(0x6b7280, 1);
  g.fillRect(2, 2, s - 4, s - 4);
  g.generateTexture('mold_block', s, s);
  scene.textures.get('mold_block')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakeStatusDot(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(4, 4, 4);
  g.generateTexture('status_dot', 8, 8);
  scene.textures.get('status_dot')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}
