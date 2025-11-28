export class SpriteManager {
 constructor(scene) {
  this.scene = scene;
 }

 preload() {
  console.log('🎨 Cargando spritesheet del jugador (3D 4x4)...');
  
  // [¡IMPORTANTE!] Asumimos 256x256 por frame para esta imagen 4x4. 
  // Si tu imagen tiene otra resolución, debes ajustar estos números.
  this.scene.load.spritesheet(
   'player_spritesheet',
   '/assets/sprites/player/player.png', // <-- Asegúrate que la ruta sea correcta
   { 
    frameWidth: 256, // NUEVO: Ancho de cada cuadro
    frameHeight: 256 // NUEVO: Alto de cada cuadro
   }
  );
  
  console.log('✅ Spritesheet 3D programado para cargar con 256x256');
  
  // Crear sprites de NPCs y ambiente (sin cambios)
  this.createNPCSprites();
  this.createEnvironmentSprites();
 }

 createAnimations() {
  console.log('🎬 Creando animaciones del jugador (Estructura 4x4)...');
  
  if (!this.scene.textures.exists('player_spritesheet')) {
   console.error('❌ Textura player_spritesheet no encontrada. Asegúrate de que la ruta en preload() sea correcta.');
   return;
  }

  // Estructura 4x4: 4 frames por fila
  const COLS = 4; 
  
  // Mapping a la cuadrícula (estimado de la imagen proporcionada)
  const IDLE_DOWN_ROW = 0; // Fila 0: Vista Frontal (Idle)
  const WALK_RIGHT_ROW = 1; // Fila 1: Vista Lateral Derecha
  const WALK_LEFT_ROW = 2; // Fila 1: Vista Lateral Derecha
  const WALK_DOWN_ROW = 0; // Fila 2: Ciclo de caminar frontal
  const WALK_UP_ROW = 3; // Fila 3: Vista Trasera/Espalda
  
  // En este spritesheet, el frame estático es el primero de la fila
  const IDLE_FRAME_INDEX = 0; 
  const WALK_FRAME_COUNT = 4; // Hay 4 frames por ciclo de caminar

  // Función helper para calcular frame index
  const frameIndex = (row, col) => row * COLS + col;

  // ==================== IDLE (Quieto) ====================
  // Down - Idle (Fila 0, Frame 0)
  this.scene.anims.create({
   key: 'player_idle_down', 
   frames: [{ key: 'player_spritesheet', frame: frameIndex(IDLE_DOWN_ROW, IDLE_FRAME_INDEX) }],
   frameRate: 1, 
   repeat: -1
  });
  // Fallback key
  this.scene.anims.create({
   key: 'player_idle', 
   frames: [{ key: 'player_spritesheet', frame: frameIndex(IDLE_DOWN_ROW, IDLE_FRAME_INDEX) }],
   frameRate: 1, 
   repeat: -1
  });

  // Up - Idle (Fila 3, Frame 0)
  this.scene.anims.create({
   key: 'player_idle_up',
   frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_UP_ROW, IDLE_FRAME_INDEX) }],
   frameRate: 1,
   repeat: -1
  });

  // Right - Idle (Fila 1, Frame 0)
  this.scene.anims.create({
   key: 'player_idle_right',
   frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_RIGHT_ROW, IDLE_FRAME_INDEX) }],
   frameRate: 1,
   repeat: -1
  });

  // Left - Idle (Usamos Right y voltearemos el sprite en el update/movement logic)
  this.scene.anims.create({ 
   key: 'player_idle_left', 
   frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_LEFT_ROW, IDLE_FRAME_INDEX) }], 
   frameRate: 1, 
   repeat: -1 
  });


  // ==================== WALKING (Caminando) ====================
  
  // Down - Walking (Fila 2)
  this.scene.anims.create({
   key: 'player_walk_down',
   frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
    start: frameIndex(WALK_DOWN_ROW, 0),
    end: frameIndex(WALK_DOWN_ROW, WALK_FRAME_COUNT - 1) // 4 frames (0 a 3)
   }),
   frameRate: 6, // Un poco más lento que el correr
   repeat: -1
  });

  // Up - Walking (Fila 3)
  this.scene.anims.create({
   key: 'player_walk_up',
   frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
    start: frameIndex(WALK_UP_ROW, 0),
    end: frameIndex(WALK_UP_ROW, WALK_FRAME_COUNT - 1)
   }),
   frameRate: 6,
   repeat: -1
  });

  // Right - Walking (Fila 1)
  this.scene.anims.create({
   key: 'player_walk_right',
   frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
    start: frameIndex(WALK_RIGHT_ROW, 0),
    end: frameIndex(WALK_RIGHT_ROW, WALK_FRAME_COUNT - 1)
   }),
   frameRate: 6,
   repeat: -1
  });

  // Left - Walking (Usamos la Fila 2 dedicada)
  this.scene.anims.create({
    key: 'player_walk_left',
    frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
      start: frameIndex(WALK_LEFT_ROW, 0), // 
      end: frameIndex(WALK_LEFT_ROW, WALK_FRAME_COUNT - 1)
    }),
    frameRate: 6,
    repeat: -1
  });
  
  // ==================== RUNNING (Corriendo) ====================
  // Reutiliza los cuadros de caminar, aumentando la velocidad.

  // Down - Running 
  this.scene.anims.create({ 
    key: 'player_run_down', 
    frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
      start: frameIndex(WALK_DOWN_ROW, 0),
      end: frameIndex(WALK_DOWN_ROW, WALK_FRAME_COUNT - 1)
    }), 
    frameRate: 10, 
    repeat: -1 
  });
  
  // Up - Running
  this.scene.anims.create({ 
    key: 'player_run_up', 
    frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
      start: frameIndex(WALK_UP_ROW, 0),
      end: frameIndex(WALK_UP_ROW, WALK_FRAME_COUNT - 1)
    }), 
    frameRate: 10, 
    repeat: -1 
  });
  
  // Right - Running
  this.scene.anims.create({ 
    key: 'player_run_right', 
    frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
      start: frameIndex(WALK_RIGHT_ROW, 0),
      end: frameIndex(WALK_RIGHT_ROW, WALK_FRAME_COUNT - 1)
    }), 
    frameRate: 10, 
    repeat: -1 
  });
  
  // Left - Running
  this.scene.anims.create({ 
    key: 'player_run_left', 
    frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
      start: frameIndex(WALK_LEFT_ROW, 0),
      end: frameIndex(WALK_LEFT_ROW, WALK_FRAME_COUNT - 1)
    }), 
    frameRate: 10, 
    repeat: -1 
  });


  // ==================== ATTACKING (No hay frames de ataque claros, usamos Down Idle) ====================
  // Aquí deberías mapear tus frames de ataque si existieran.
  this.scene.anims.create({ 
   key: 'player_attack_down', 
   frames: [{ key: 'player_spritesheet', frame: frameIndex(IDLE_DOWN_ROW, 1) }], // Usamos un frame de la primera fila como placeholder
   frameRate: 15, 
   repeat: 0 
  });
  // El resto de ataques y Hurt/Die quedan como placeholders hasta tener frames dedicados.
  this.scene.anims.create({ key: 'player_attack_up', frames: this.scene.anims.get('player_attack_down').frames, frameRate: 15, repeat: 0 });
  this.scene.anims.create({ key: 'player_attack_left', frames: this.scene.anims.get('player_attack_down').frames, frameRate: 15, repeat: 0 });
  this.scene.anims.create({ key: 'player_attack_right', frames: this.scene.anims.get('player_attack_down').frames, frameRate: 15, repeat: 0 });
  this.scene.anims.create({ key: 'player_hurt', frames: this.scene.anims.get('player_attack_down').frames, frameRate: 1, repeat: 0 });
  this.scene.anims.create({ key: 'player_die', frames: this.scene.anims.get('player_attack_down').frames, frameRate: 1, repeat: 0 });

  console.log('✅ Animaciones 3D creadas correctamente');
  console.log('📋 Filas usadas: Idle (0), Walk Right (1), Walk Down (2), Walk Up (3)');
 }

 // NPCs (no modificados)
 createNPCSprites() {
  const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
  const npcTypes = [
   { key: 'npc_trainer', color: 0xff6b6b },
   { key: 'npc_referee', color: 0x000000 },
   { key: 'npc_merchant', color: 0xf39c12 },
   { key: 'npc_club_leader', color: 0x9b59b6 }
  ];

  npcTypes.forEach(npc => {
   if (this.scene.textures.exists(npc.key)) {
    this.scene.textures.remove(npc.key);
   }
   graphics.clear();
   graphics.fillStyle(npc.color, 1);
   graphics.fillCircle(15, 20, 12);
   graphics.fillStyle(0xffdbac, 1);
   graphics.fillCircle(15, 10, 8);
   graphics.generateTexture(npc.key, 30, 35);
  });

  graphics.destroy();
  console.log('✅ Sprites de NPCs creados');
 }

 // Ambiente (MEJORADO con más variedad)
 createEnvironmentSprites() {
  const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
  
  // 🌳 Árbol Grande
  if (this.scene.textures.exists('tree_1')) {
   this.scene.textures.remove('tree_1');
  }
  graphics.clear();
  graphics.fillStyle(0x654321, 1);
  graphics.fillRect(17, 25, 16, 25);
  graphics.fillStyle(0x228B22, 1);
  graphics.fillCircle(25, 15, 20);
  graphics.fillCircle(15, 20, 15);
  graphics.fillCircle(35, 20, 15);
  graphics.generateTexture('tree_1', 50, 50);
  
  // 🌲 Árbol Pequeño
  if (this.scene.textures.exists('tree_2')) {
   this.scene.textures.remove('tree_2');
  }
  graphics.clear();
  graphics.fillStyle(0x8b4513, 1);
  graphics.fillRect(12, 18, 8, 15);
  graphics.fillStyle(0x2d5016, 1);
  graphics.fillCircle(16, 12, 12);
  graphics.generateTexture('tree_2', 32, 35);
  
  // 🪨 Roca Grande
  if (this.scene.textures.exists('rock_1')) {
   this.scene.textures.remove('rock_1');
  }
  graphics.clear();
  graphics.fillStyle(0x696969, 1);
  graphics.fillCircle(25, 25, 20);
  graphics.fillStyle(0x808080, 1);
  graphics.fillCircle(20, 20, 18);
  graphics.fillStyle(0x555555, 1);
  graphics.fillCircle(30, 23, 12);
  graphics.generateTexture('rock_1', 50, 50);
  
  // 🪨 Roca Mediana
  if (this.scene.textures.exists('rock_2')) {
   this.scene.textures.remove('rock_2');
  }
  graphics.clear();
  graphics.fillStyle(0x808080, 1);
  graphics.fillCircle(15, 15, 12);
  graphics.fillStyle(0x696969, 1);
  graphics.fillCircle(18, 18, 10);
  graphics.generateTexture('rock_2', 30, 30);
  
  // 🌸 Arbusto con Flores
  if (this.scene.textures.exists('bush_1')) {
   this.scene.textures.remove('bush_1');
  }
  graphics.clear();
  graphics.fillStyle(0x2d5016, 1);
  graphics.fillCircle(15, 15, 12);
  graphics.fillCircle(25, 15, 10);
  graphics.fillStyle(0xff69b4, 1);
  graphics.fillCircle(12, 12, 3);
  graphics.fillCircle(18, 10, 3);
  graphics.fillCircle(25, 12, 3);
  graphics.generateTexture('bush_1', 35, 25);
  
  // 🌿 Arbusto Simple
  if (this.scene.textures.exists('bush_2')) {
   this.scene.textures.remove('bush_2');
  }
  graphics.clear();
  graphics.fillStyle(0x228B22, 1);
  graphics.fillCircle(12, 12, 10);
  graphics.fillCircle(20, 12, 8);
  graphics.generateTexture('bush_2', 28, 20);
  
  // 🪵 Tronco caído
  if (this.scene.textures.exists('log_1')) {
   this.scene.textures.remove('log_1');
  }
  graphics.clear();
  graphics.fillStyle(0x654321, 1);
  graphics.fillRoundedRect(0, 10, 45, 15, 5);
  graphics.fillStyle(0x8b6914, 1);
  graphics.fillCircle(5, 17, 6);
  graphics.fillCircle(40, 17, 6);
  graphics.generateTexture('log_1', 45, 30);
  
  // 🌼 Flores
  if (this.scene.textures.exists('flowers_1')) {
   this.scene.textures.remove('flowers_1');
  }
  graphics.clear();
  graphics.fillStyle(0xffff00, 1);
  graphics.fillCircle(8, 8, 4);
  graphics.fillCircle(15, 10, 4);
  graphics.fillCircle(22, 8, 4);
  graphics.fillStyle(0xff0000, 1);
  graphics.fillCircle(8, 8, 2);
  graphics.fillCircle(15, 10, 2);
  graphics.fillCircle(22, 8, 2);
  graphics.generateTexture('flowers_1', 30, 18);
  
  // 🪙 Cofre (decorativo)
  if (this.scene.textures.exists('chest_1')) {
   this.scene.textures.remove('chest_1');
  }
  graphics.clear();
  graphics.fillStyle(0x8b4513, 1);
  graphics.fillRect(5, 12, 30, 18);
  graphics.fillStyle(0xffd700, 1);
  graphics.fillRect(5, 12, 30, 3);
  graphics.fillRect(18, 18, 4, 8);
  graphics.generateTexture('chest_1', 40, 35);
  
  // 🏺 Vasija
  if (this.scene.textures.exists('vase_1')) {
   this.scene.textures.remove('vase_1');
  }
  graphics.clear();
  graphics.fillStyle(0xcd853f, 1);
  graphics.fillRect(10, 5, 10, 3);
  graphics.fillRect(8, 8, 14, 17);
  graphics.fillStyle(0xa0522d, 1);
  graphics.fillRect(10, 10, 10, 2);
  graphics.generateTexture('vase_1', 30, 30);
  
  // 🪧 Cartel de madera
  if (this.scene.textures.exists('sign_1')) {
   this.scene.textures.remove('sign_1');
  }
  graphics.clear();
  graphics.fillStyle(0x8b4513, 1);
  graphics.fillRect(18, 15, 4, 20);
  graphics.fillStyle(0xdeb887, 1);
  graphics.fillRect(5, 8, 30, 15);
  graphics.lineStyle(2, 0x654321);
  graphics.strokeRect(5, 8, 30, 15);
  graphics.generateTexture('sign_1', 40, 35);
  
  graphics.destroy();
  console.log('✅ Sprites de ambiente creados (11 tipos)');
 }
}