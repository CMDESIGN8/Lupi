export class SpriteManager {
  constructor(scene) {
    this.scene = scene;
  }

  preload() {
    console.log('🎨 Cargando spritesheet del jugador (LPC 64x64)...');
    
    // CRUCIAL: Asegúrate que esta ruta apunta al spritesheet completo generado por LPC.
    // La imagen debe contener todas las animaciones (Walk, Attack, etc.)
    this.scene.load.spritesheet(
      'player_spritesheet',
      '/assets/sprites/player/player.png', 
      { 
        frameWidth: 64,  // ¡ADAPTADO A LPC! El tamaño de frame es 64px
        frameHeight: 64  // ¡ADAPTADO A LPC! El tamaño de frame es 64px
      }
    );
    
    console.log('✅ Spritesheet LPC programado para cargar');
    
    // Crear sprites de NPCs y ambiente
    this.createNPCSprites();
    this.createEnvironmentSprites();
  }

  createAnimations() {
    console.log('🎬 Creando animaciones del jugador (LPC standard)...');
    
    if (!this.scene.textures.exists('player_spritesheet')) {
      console.error('❌ Textura player_spritesheet no encontrada. Asegúrate de que la ruta en preload() sea correcta.');
      return;
    }

    // Estructura LPC: 9 frames por fila de animación
    const COLS = 9; 
    
    // Filas de animación LPC (Las filas 0-3 son para Thrust Attack)
    const WALK_DOWN_ROW = 4;
    const WALK_LEFT_ROW = 5;
    const WALK_RIGHT_ROW = 6;
    const WALK_UP_ROW = 7;
    
    // El frame estático de "Idle" en LPC es usualmente el segundo frame (índice 1) del ciclo de caminar.
    const IDLE_FRAME_INDEX = 1; 

    // Función helper para calcular frame index: (Fila * COLS) + Columna
    const frameIndex = (row, col) => row * COLS + col;

    // ==================== IDLE (Quieto) ====================
    // Usamos el frame estático (columna 1) de cada fila de caminar.

    // Down - Idle
    this.scene.anims.create({
      key: 'player_idle_down', 
      frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_DOWN_ROW, IDLE_FRAME_INDEX) }],
      frameRate: 1, 
      repeat: -1
    });
     // Fallback key
     this.scene.anims.create({
      key: 'player_idle', 
      frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_DOWN_ROW, IDLE_FRAME_INDEX) }],
      frameRate: 1, 
      repeat: -1
    });

    // Up - Idle
    this.scene.anims.create({
      key: 'player_idle_up',
      frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_UP_ROW, IDLE_FRAME_INDEX) }],
      frameRate: 1,
      repeat: -1
    });

    // Left - Idle
    this.scene.anims.create({
      key: 'player_idle_left',
      frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_LEFT_ROW, IDLE_FRAME_INDEX) }],
      frameRate: 1,
      repeat: -1
    });

    // Right - Idle
    this.scene.anims.create({
        key: 'player_idle_right',
        frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_RIGHT_ROW, IDLE_FRAME_INDEX) }],
        frameRate: 1,
        repeat: -1
    });

    // ==================== WALKING (Caminando) ====================
    // Cada fila usa los 9 frames (0 a 8) para el ciclo completo.

    // Down - Walking (Fila 4)
    this.scene.anims.create({
      key: 'player_walk_down',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_DOWN_ROW, 0),
        end: frameIndex(WALK_DOWN_ROW, 8) // 9 frames (0 a 8)
      }),
      frameRate: 8,
      repeat: -1
    });

    // Up - Walking (Fila 7)
    this.scene.anims.create({
      key: 'player_walk_up',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_UP_ROW, 0),
        end: frameIndex(WALK_UP_ROW, 8)
      }),
      frameRate: 8,
      repeat: -1
    });

    // Left - Walking (Fila 5)
    this.scene.anims.create({
      key: 'player_walk_left',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_LEFT_ROW, 0),
        end: frameIndex(WALK_LEFT_ROW, 8)
      }),
      frameRate: 8,
      repeat: -1
    });

    // Right - Walking (Fila 6)
    this.scene.anims.create({
      key: 'player_walk_right',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_RIGHT_ROW, 0),
        end: frameIndex(WALK_RIGHT_ROW, 8)
      }),
      frameRate: 8,
      repeat: -1
    });

    // ==================== RUNNING (Corriendo) ====================
    // Reutiliza los cuadros de caminar, aumentando la velocidad.

    // Down - Running 
    this.scene.anims.create({
      key: 'player_run_down',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_DOWN_ROW, 0),
        end: frameIndex(WALK_DOWN_ROW, 8)
      }),
      frameRate: 12, 
      repeat: -1
    });

    // Up - Running
    this.scene.anims.create({
      key: 'player_run_up',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_UP_ROW, 0),
        end: frameIndex(WALK_UP_ROW, 8)
      }),
      frameRate: 12,
      repeat: -1
    });

    // Left - Running
    this.scene.anims.create({
      key: 'player_run_left',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_LEFT_ROW, 0),
        end: frameIndex(WALK_LEFT_ROW, 8)
      }),
      frameRate: 12,
      repeat: -1
    });

    // Right - Running
    this.scene.anims.create({
      key: 'player_run_right',
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', {
        start: frameIndex(WALK_RIGHT_ROW, 0),
        end: frameIndex(WALK_RIGHT_ROW, 8)
      }),
      frameRate: 12,
      repeat: -1
    });

    // ==================== ATTACKING (Thrust Attack - Filas 0 a 3) ====================
    // Estas animaciones ahora usan los 9 frames reales de ataque de LPC (Thrust/Estocada)
    
    // Attack Down (Fila 0)
    this.scene.anims.create({ 
      key: 'player_attack_down', 
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', { start: frameIndex(0, 0), end: frameIndex(0, 8) }),
      frameRate: 15, // Rápido para un ataque
      repeat: 0 
    });
    // Attack Up (Fila 3)
    this.scene.anims.create({ 
      key: 'player_attack_up', 
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', { start: frameIndex(3, 0), end: frameIndex(3, 8) }),
      frameRate: 15, 
      repeat: 0 
    });
    // Attack Left (Fila 1)
    this.scene.anims.create({ 
      key: 'player_attack_left', 
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', { start: frameIndex(1, 0), end: frameIndex(1, 8) }),
      frameRate: 15, 
      repeat: 0 
    });
    // Attack Right (Fila 2)
    this.scene.anims.create({ 
      key: 'player_attack_right', 
      frames: this.scene.anims.generateFrameNumbers('player_spritesheet', { start: frameIndex(2, 0), end: frameIndex(2, 8) }),
      frameRate: 15, 
      repeat: 0 
    });


    // Hurt/Die (Mantenemos estático o usa el frame de ataque para simular golpe)
    // Idealmente, usaríamos la fila 12 de LPC, pero para simplificar, usamos un frame de Idle.
    this.scene.anims.create({ key: 'player_hurt', frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_DOWN_ROW, IDLE_FRAME_INDEX) }], frameRate: 1, repeat: 0 });
    this.scene.anims.create({ key: 'player_die', frames: [{ key: 'player_spritesheet', frame: frameIndex(WALK_DOWN_ROW, IDLE_FRAME_INDEX) }], frameRate: 1, repeat: 0 });

    console.log('✅ Animaciones LPC creadas correctamente');
    console.log('📋 Filas usadas: Walk (4-7), Thrust Attack (0-3)');
    // ... (otras animaciones de la consola)
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

  // Ambiente (no modificado)
  createEnvironmentSprites() {
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    
    if (this.scene.textures.exists('tree_1')) {
      this.scene.textures.remove('tree_1');
    }
    graphics.clear();
    graphics.fillStyle(0x8b4513, 1);
    graphics.fillRect(14, 20, 12, 20);
    graphics.fillStyle(0x228B22, 1);
    graphics.fillCircle(20, 10, 15);
    graphics.generateTexture('tree_1', 40, 45);
    
    if (this.scene.textures.exists('rock_1')) {
      this.scene.textures.remove('rock_1');
    }
    graphics.clear();
    graphics.fillStyle(0x808080, 1);
    graphics.fillCircle(20, 20, 15);
    graphics.generateTexture('rock_1', 40, 40);
    
    graphics.destroy();
    console.log('✅ Sprites de ambiente creados');
  }
}