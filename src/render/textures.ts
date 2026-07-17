import Phaser from 'phaser';

/** Procedurally bakes small pixel-art-style textures so the game ships with
 * zero binary assets. Nearest-neighbour filtering (pixelArt:true on the game
 * config) keeps them crisp/blocky when scaled up. */
export function generateTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  bakeFloorTile(g, scene);
  bakePressBody(g, scene);
  bakePlaten(g, scene);
  bakeEmployee(g, scene, 'emp_operator', 0x3b82f6);
  bakeEmployee(g, scene, 'emp_setter', 0xf59e0b);
  bakeEmployee(g, scene, 'emp_forklift', 0x22c55e);
  bakeHoistTrolley(g, scene);
  bakeMoldBlock(g, scene);
  bakeStatusDot(g, scene);

  g.destroy();
}

function bakeFloorTile(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  g.fillStyle(0x2b2e35, 1);
  g.fillRect(0, 0, 32, 32);
  g.lineStyle(1, 0x35383f, 1);
  g.strokeRect(0, 0, 32, 32);
  g.fillStyle(0x313540, 1);
  g.fillRect(0, 0, 16, 16);
  g.fillRect(16, 16, 16, 16);
  g.generateTexture('floor_tile', 32, 32);
  if (scene.textures.get('floor_tile')) scene.textures.get('floor_tile').setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakePressBody(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 64;
  const h = 56;
  g.fillStyle(0x53585f, 1);
  g.fillRect(0, 20, w, h - 20);
  g.fillStyle(0x3d4147, 1);
  g.fillRect(0, h - 10, w, 10);
  g.fillStyle(0x6b7178, 1);
  g.fillRect(4, 24, w - 8, 8);
  g.fillStyle(0x23252a, 1);
  g.fillRect(10, 0, w - 20, 22);
  g.generateTexture('press_body', w, h);
  scene.textures.get('press_body')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakePlaten(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  g.clear();
  const w = 48;
  const h = 14;
  g.fillStyle(0x8b8f96, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x6b7178, 1);
  g.fillRect(0, h - 4, w, 4);
  g.generateTexture('press_platen', w, h);
  scene.textures.get('press_platen')?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function bakeEmployee(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene, key: string, shirtColor: number): void {
  g.clear();
  const w = 12;
  const h = 22;
  // legs
  g.fillStyle(0x2b2e35, 1);
  g.fillRect(2, h - 8, 3, 8);
  g.fillRect(w - 5, h - 8, 3, 8);
  // torso
  g.fillStyle(shirtColor, 1);
  g.fillRect(1, 7, w - 2, 10);
  // head
  g.fillStyle(0xe8c39e, 1);
  g.fillRect(3, 0, w - 6, 7);
  // hard hat
  g.fillStyle(0xf59e0b, 1);
  g.fillRect(2, 0, w - 4, 3);
  g.generateTexture(key, w, h);
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
