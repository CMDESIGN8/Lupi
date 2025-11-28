import Phaser from 'phaser';
import "../../../lib/supabaseClient"

import { SpriteManager } from '../utils/SpriteManager';


class TilemapManager {
  constructor(scene) {
    this.scene = scene;
  }

  createTileset() {
    console.log('✅ Tileset básico creado');
  }

  createWorldMap() {
    console.log('✅ Mundo básico creado');
    return {
      map: null,
      groundLayer: null,
      pathLayer: null,
      decorLayer: null,
      collisionLayer: null
    };
  }
}

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.player = null;
    this.cursors = null;
    this.keys = null;
    this.npcs = [];
    this.interactionZones = [];
    this.currentLocation = null;
    this.services = null;
    this.lupicoinsDisplay = null;
    this.currentLupicoins = 0;
    this.isLupicoinsInitialized = false;
    this.characterId = null;
    this.clubHUD = null;
    this.clubNameText = null;
    this.clubLevelText = null;
    this.clubMembersText = null;
    this.playerClubText = null;
    this.playerNameText = null;
    this.isLoadingDynamicData = false;
    this.clubData = null;
    this.dynamicDataLoaded = false;
    this.clubLoadAttempted = false;
    this.spriteManager = null;
    this.tilemapManager = null;
    this.worldMap = null;
  }

  // 🟢 NUEVO O CORREGIDO: Método PRELOAD de la escena
    preload() {
    console.log('--- FASE PRELOAD INICIADA ---');
    // 1. Inicializar managers que cargan assets
    this.spriteManager = new SpriteManager(this);
    this.tilemapManager = new TilemapManager(this);

    // 2. Programar la carga de assets (¡Usando el método del manager!)
    // Esto hace this.load.spritesheet(...)
    this.spriteManager.preload();
    // this.tilemapManager.preload(); // Si el tilemap usa assets externos
    
    console.log('--- FASE PRELOAD FINALIZADA. Espere carga ---');
}

  create() {
    // 1. Obtener datos y servicios del Registry
    const character = this.game.registry.get('character');
    this.services = this.game.registry.get('services');
    this.user = this.game.registry.get('user');
    this.wallet = this.game.registry.get('wallet');
    this.clubData = this.game.registry.get('clubData'); 
    this.characterId = character?.id;
    console.log('🎮 MainScene iniciada con personaje:', character?.nickname);
    console.log('🏆 Club Data:', this.clubData);
    console.log('💰 Wallet:', this.wallet);
    
    // 2. Inicializar managers
    this.spriteManager = new SpriteManager(this);
    this.tilemapManager = new TilemapManager(this);
    
    // 3. Crear assets visuales
    this.createAssetsAndAnimations();
    
    // 4. Crear el mundo visual
    this.createWorld();
    
    // 5. Crear jugador con textos del nombre y club
    const startX = character?.position_x || 1000;
    const startY = character?.position_y || 1000;
    this.createPlayer(character, startX, startY);
    
    // 6. Crear zonas, NPCs y decoraciones
    this.createInteractionZones();
    this.createNPCs();
    this.createDecorations();
    
    // 7. Configurar controles y cámara
    this.setupControls();
    
    // Configurar cámara después de crear el mundo
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    
    console.log('📷 Cámara configurada. Límites:', this.cameras.main.getBounds());
    console.log('🌍 Límites mundo físico:', this.physics.world.bounds);

    // 8. Inicializar sistemas después de un pequeño delay
    this.time.delayedCall(500, () => {
      this.createLupicoinsDisplay();
      this.isLupicoinsInitialized = true;
      
      // Si ya tenemos datos del club, mostrarlos inmediatamente
      if (this.clubData) {
        console.log('✅ Usando datos del club del registry:', this.clubData.name);
        this.showClubInUI(this.clubData);
        this.updateClubZoneInMap(this.clubData);
      } else {
        // Solo cargar de la BD si no tenemos datos en el registry
        this.loadDynamicData();
      }
    });

    // Guardado automático cada 30 segundos
    this.time.addEvent({
      delay: 30000,
      callback: () => this.autoSave(),
      loop: true
    });

    // Actualizar lupicoins cada 15 segundos
    this.time.addEvent({
      delay: 15000,
      callback: () => this.updateLupicoinsFromDB(),
      loop: true
    });
  }

  // 2. REFECTORIZACIÓN DE createVisualAssets
  createAssetsAndAnimations() {
    try {
        console.log('🎬 Creando todas las animaciones del juego...');
        // El SpriteManager.createAnimations() ahora es seguro porque los spritesheets ya cargaron.
        this.spriteManager.createAnimations(); 
        console.log('✅ Assets visuales y animaciones creados correctamente');
    } catch (error) {
        console.error('❌ Error creando assets visuales:', error);
    }
}

  createWorld() {
    try {
      console.log('🗺️ Creando mundo...');
      this.tilemapManager.createTileset();
      this.worldMap = this.tilemapManager.createWorldMap();
      
      this.physics.world.setBounds(0, 0, 2000, 2000);
      
      // Mundo visual básico
      const graphics = this.add.graphics();
      graphics.fillStyle(0x2ecc71, 1);
      graphics.fillRect(0, 0, 2000, 2000);
      
      // Patrón de grid
      graphics.lineStyle(1, 0x27ae60, 0.3);
      for (let i = 0; i < 2000; i += 100) {
        graphics.moveTo(i, 0);
        graphics.lineTo(i, 2000);
        graphics.moveTo(0, i);
        graphics.lineTo(2000, i);
      }
      graphics.strokePath();
      
      console.log('🗺️ Mundo creado: 2000x2000');
    } catch (error) {
      console.error('❌ Error creando mundo:', error);
      this.createBasicWorld();
    }
  }

  createBasicWorld() {
    this.physics.world.setBounds(0, 0, 2000, 2000);
    
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2ecc71, 1);
    graphics.fillRect(0, 0, 2000, 2000);
    
    graphics.lineStyle(1, 0x27ae60, 0.3);
    for (let i = 0; i < 2000; i += 100) {
      graphics.moveTo(i, 0);
      graphics.lineTo(i, 2000);
      graphics.moveTo(0, i);
      graphics.lineTo(2000, i);
    }
    graphics.strokePath();
  }

  // 3. REFECTORIZACIÓN DE createPlayer
  createPlayer(character, x, y) {
    const safeX = Phaser.Math.Clamp(x, 50, 1950);
    const safeY = Phaser.Math.Clamp(y, 50, 1950);

    
    
    console.log(`🎯 Creando jugador en: ${safeX}, ${safeY}`);
    
    try {
      // Usar la clave del spritesheet generado ('player_spritesheet')
      this.player = this.physics.add.sprite(safeX, safeY, 'player_spritesheet');
      this.player.setCollideWorldBounds(true);
      this.player.setDepth(100);
      
      // Ajustar tamaño y offset para el frame de 64x64
      this.player.body.setSize(30, 30);
      this.player.body.setOffset(17, 30); // Centrado X: (64-30)/2 = 17, Y ajustado al pie.
      
      // Iniciar la animación idle
      this.player.play('player_idle');

    } catch (error) {
      console.log('🔄 Usando círculo para jugador');
      // Fallback a círculo
      this.player = this.add.circle(safeX, safeY, 20, 0x00ff88);
      this.physics.add.existing(this.player);
      this.player.body.setCollideWorldBounds(true);
      this.player.setDepth(100);
    }

    // TEXTO DEL NICKNAME
    this.playerNameText = this.add.text(0, 35, character?.nickname || 'Jugador', {
      fontSize: '17px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(101);
    
    // TEXTO DEL CLUB
    const clubName = this.clubData ? this.clubData.name : '';
    this.playerClubText = this.add.text(0, 55, clubName, {
      fontSize: '14px',
      fontFamily: 'Arial black',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'italic',
      fontWeight: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(101);
    
    // BARRA DE ESTAMINA
    this.energyBarBg = this.add.rectangle(0, 75, 50, 6, 0x333333).setDepth(101);
    this.energyBarBg.setOrigin(0, 0.5);
    
    this.energyBar = this.add.rectangle(0, 75, 50, 6, 0x00ff88).setDepth(102);
    this.energyBar.setOrigin(0, 0.5);
    
    // INDICADOR DE INTERACCIÓN
    this.interactionIndicator = this.add.text(0, 90, '↓ E', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(101);
    
    this.player.setData('character', character);
    
    // Inicializar textos
    this.updatePlayerClubText();
    
    console.log('✅ Jugador creado correctamente');
  }

  createNPCs() {
    const npcPositions = [
      { x: 550, y: 550, name: 'Entrenador', type: 'trainer', sprite: 'npc_trainer' },
      { x: 1350, y: 550, name: 'Árbitro', type: 'referee', sprite: 'npc_referee' },
      { x: 550, y: 1350, name: 'Comerciante', type: 'merchant', sprite: 'npc_merchant' },
      { x: 1250, y: 1350, name: 'Líder Club', type: 'club_leader', sprite: 'npc_club_leader' }
    ];

    npcPositions.forEach(npcData => {
      try {
        const npc = this.physics.add.sprite(npcData.x, npcData.y, npcData.sprite);
        npc.body.setImmovable(true);
        npc.setDepth(50);
        npc.body.setSize(20, 25);
        npc.body.setOffset(5, 5);
        
        const npcText = this.add.text(npcData.x, npcData.y - 30, npcData.name, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(51);
        
        npc.setData('name', npcData.name);
        npc.setData('type', npcData.type);
        
        this.npcs.push(npc);
      } catch (error) {
        console.log(`🔄 Usando círculo para NPC ${npcData.name}`);
        // Fallback a círculo
        const npc = this.add.circle(npcData.x, npcData.y, 15, 0xff6b6b);
        this.physics.add.existing(npc);
        npc.body.setImmovable(true);
        npc.setDepth(50);
        
        const npcText = this.add.text(npcData.x, npcData.y - 30, npcData.name, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(51);
        
        npc.setData('name', npcData.name);
        npc.setData('type', npcData.type);
        
        this.npcs.push(npc);
      }
    });
  }

  createDecorations() {
    try {
      const decorations = [
        { x: 300, y: 300, key: 'tree_1' },
        { x: 1700, y: 300, key: 'tree_1' },
        { x: 300, y: 1700, key: 'tree_1' },
        { x: 1700, y: 1700, key: 'tree_1' },
        { x: 800, y: 800, key: 'rock_1' },
        { x: 1200, y: 800, key: 'rock_1' }
      ];

      decorations.forEach(deco => {
        try {
          const sprite = this.add.sprite(deco.x, deco.y, deco.key);
          sprite.setDepth(10);
        } catch (error) {
          console.warn(`⚠️ No se pudo crear decoración ${deco.key}`);
        }
      });
      console.log('✅ Decoraciones creadas');
    } catch (error) {
      console.error('❌ Error creando decoraciones:', error);
    }
  }

  createInteractionZones() {
    const areas = [
      { name: 'training_ground', x: 400, y: 400, width: 300, height: 300, color: 0x3498db, label: '⚽ ENTRENAMIENTO' },
      { name: 'arena', x: 1200, y: 400, width: 300, height: 300, color: 0xe74c3c, label: '⚔️ ARENA' },
      { name: 'market', x: 400, y: 1200, width: 300, height: 300, color: 0xf39c12, label: '🛒 MERCADO' },
      { name: 'club_house', x: 1100, y: 1200, width: 300, height: 300, color: 0x9b59b6, label: '🏆 CLUB BARRIAL' },
      { name: 'exploration', x: 1550, y: 800, width: 400, height: 400, color: 0x1abc9c, label: '🗺️ EXPLORACIÓN' }
    ];

    areas.forEach(area => {
      const zone = this.add.rectangle(
        area.x + area.width / 2,
        area.y + area.height / 2,
        area.width,
        area.height,
        area.color,
        0.4
      );
      zone.setStrokeStyle(1, area.color);
      zone.setDepth(5);
      
      const label = this.add.text(area.x + area.width / 2, area.y + 20, area.label, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(10);
      
      const interactionZone = this.add.zone(
        area.x + area.width / 2,
        area.y + area.height / 2,
        area.width + 50,
        area.height + 50
      );
      this.physics.world.enable(interactionZone);
      interactionZone.body.setAllowGravity(false);
      interactionZone.body.moves = false;
      interactionZone.setData('location', area.name);
      
      interactionZone.labelObject = label;
      interactionZone.visualZone = zone;
      
      this.interactionZones.push(interactionZone);
    });

    console.log('📍 Zonas de interacción creadas');
  }

  setupControls() {
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keys = {
    w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
    s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    e: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    c: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
    z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
    m: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
    shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT), // NUEVO
    space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)  // NUEVO (para atacar)
  };
  
  this.keys.e.on('down', () => this.handleInteraction());
  this.keys.c.on('down', () => this.debugClubInfo());
  this.keys.z.on('down', () => this.debugZones());
  this.keys.m.on('down', () => this.debugMovement());
  this.keys.space.on('down', () => this.handleAttack()); // NUEVO
  
  console.log('🎮 Controles configurados (WASD/Flechas, SHIFT=correr, ESPACIO=atacar)');
}

  createLupicoinsDisplay() {
    try {
      console.log('💎 Creando display de lupicoins...');
      
      if (this.lupicoinsDisplay) {
        this.lupicoinsDisplay.destroy(true);
      }
      
      this.lupicoinsDisplay = this.add.group();
      
      const bg = this.add.rectangle(20, 20, 180, 60, 0x000000, 0.8)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0xffd700)
        .setScrollFactor(0);
      
      const icon = this.add.text(40, 35, '💎', { 
        fontSize: '24px',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0);
      
      const initialCoins = this.wallet?.lupicoins || 0;
      this.lupicoinsText = this.add.text(100, 35, `${initialCoins.toLocaleString()}`, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setScrollFactor(0);
      
      const label = this.add.text(100, 20, 'LUPICOINS', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setScrollFactor(0);

      this.lupicoinsDisplay.add(bg);
      this.lupicoinsDisplay.add(icon);
      this.lupicoinsDisplay.add(this.lupicoinsText);
      this.lupicoinsDisplay.add(label);
      
      this.lupicoinsDisplay.setDepth(1000);
      this.currentLupicoins = initialCoins;
      this.isLupicoinsInitialized = true;
      
      console.log('✅ Display de lupicoins creado con:', initialCoins, 'lupicoins');
    } catch (error) {
      console.error('❌ Error creando display de lupicoins:', error);
    }
  }

  updateLupicoinsDisplay(amount) {
    if (!this.lupicoinsText || !this.isLupicoinsInitialized) {
      return;
    }
    
    try {
      this.currentLupicoins = amount;
      this.lupicoinsText.setText(`${amount.toLocaleString()}`);
      
      this.tweens.add({
        targets: this.lupicoinsText,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      });
    } catch (error) {
      console.error('❌ Error actualizando display de lupicoins:', error);
    }
  }

  async updateLupicoinsFromDB() {
    if (!this.isLupicoinsInitialized || !this.characterId) {
      return;
    }
    
    try {
      console.log('🔄 Actualizando lupicoins desde DB...');
      
      if (this.services.getWallet) {
        const wallet = await this.services.getWallet(this.characterId);
        if (wallet && wallet.lupicoins !== this.currentLupicoins) {
          console.log('💰 Nuevo valor de lupicoins:', wallet.lupicoins);
          this.updateLupicoinsDisplay(wallet.lupicoins);
        }
      }
    } catch (error) {
      console.error('❌ Error actualizando lupicoins desde DB:', error);
    }
  }

  async loadDynamicData() {
    console.log('🔄 Cargando datos dinámicos...');
    await this.loadUserClub();
    await this.updateLupicoinsFromDB();
  }

  async loadUserClub() {
    if (this.clubLoadAttempted) {
      return;
    }
    
    this.clubLoadAttempted = true;
    const character = this.player?.getData('character');
    
    if (!character?.club_id) {
      console.log('ℹ️ El usuario no pertenece a ningún club');
      this.showClubInUI(null);
      return;
    }
    
    console.log('🔍 Cargando club ID:', character.club_id);
    
    if (this.clubData && this.clubData.name) {
      console.log('✅ Usando datos del registry:', this.clubData.name);
      this.showClubInUI(this.clubData);
      this.updateClubZoneInMap(this.clubData);
      return;
    }
    
    this.updatePlayerClubText();
    
    try {
      console.log('🏆 Cargando club del usuario desde BD...');
      const clubData = await this.getClubNameWithFallback(character.club_id);
      
      if (clubData && clubData.name) {
        console.log('✅ Club cargado desde BD:', clubData.name);
        this.clubData = clubData;
        this.showClubInUI(clubData);
        this.updateClubZoneInMap(clubData);
      } else {
        console.log('⚠️ No se pudieron cargar los datos del club desde BD');
        this.showClubInUI(null);
      }
      
    } catch (error) {
      console.error('❌ Error cargando club del usuario:', error);
      this.showClubInUI(null);
    }
  }

  async getClubNameWithFallback(clubId) {
    if (!clubId) return null;
    
    try {
      console.log('🔄 Intentando obtener datos del club con fallbacks...');
      
      if (this.services.getClubDetails) {
        const clubData = await this.services.getClubDetails(clubId);
        if (clubData && clubData.name) {
          console.log('✅ Club obtenido via servicio principal');
          return clubData;
        }
      }
      
      console.log('🔄 Intentando consulta simple del club...');
      const simpleClubData = await this.getClubSimple(clubId);
      if (simpleClubData && simpleClubData.name) {
        console.log('✅ Club obtenido via consulta simple');
        return simpleClubData;
      }
      
      console.log('🔄 Usando datos mock para testing...');
      const mockClubData = this.getMockClubData(clubId);
      if (mockClubData) {
        console.log('✅ Usando datos mock del club');
        return mockClubData;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error en fallback del club:', error);
      return null;
    }
  }

  async getClubSimple(clubId) {
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      
      const { data, error } = await supabase
        .from('clubs')
        .select('name, level, member_count')
        .eq('id', clubId)
        .single();
      
      if (error) {
        console.error('❌ Error en consulta simple:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error en getClubSimple:', error);
      return null;
    }
  }

  getMockClubData(clubId) {
    const mockClubs = {
      '242ff70d-1b5d-4837-a37e-88daac29cb70': {
        name: 'Lupi Team',
        level: 5,
        member_count: 12
      },
    };
    
    return mockClubs[clubId] || {
      name: `Club ${clubId.substring(0, 8)}`,
      level: 1,
      member_count: 1
    };
  }

  showClubInUI(clubData) {
    if (!clubData && this.clubData && this.clubData.name) {
      return;
    }
    
    if (clubData) {
      console.log('🎯 Mostrando club en UI:', clubData.name);
      this.updateClubHUD(clubData);
      this.updatePlayerClubDisplay(clubData);
      this.showClubNotification(clubData);
    } else {
      console.log('🎯 Usuario sin club - mostrando opciones para unirse');
      this.showNoClubMessage();
      this.updatePlayerClubText();
      this.clubData = null;
    }
  }

  updateClubZoneInMap(clubData) {
    const clubZone = this.interactionZones.find(z => z.getData('location') === 'club_house');
    if (clubZone && clubZone.labelObject) {
      clubZone.labelObject.setText(`${clubData.name}`);
      clubZone.labelObject.setColor('#ffd700');
      
      clubZone.setData('clubInfo', {
        name: clubData.name,
        level: clubData.level,
        members: clubData.member_count
      });
      
      console.log('🗺️ Zona del club actualizada en el mapa');
    }
  }

  updateClubHUD(clubData) {
    if (!this.clubHUD) {
      this.createClubHUD();
    }
    
    if (this.clubNameText) {
      this.clubNameText.setText(clubData.name);
    }
    
    if (this.clubLevelText) {
      this.clubLevelText.setText(`Nv. ${clubData.level || 1}`);
    }
    
    if (this.clubMembersText) {
      this.clubMembersText.setText(`👥 ${clubData.member_count || 1}`);
    }
  }

  createClubHUD() {
    this.clubHUD = this.add.group();
    
    const x = this.cameras.main.width - 235;
    const y = 10;
    
    const bg = this.add.rectangle(x, y, 200, 70, 0x000000, 0.25)
      .setOrigin(1, 0)
      .setStrokeStyle(3, 0xffd700)
      .setScrollFactor(0);
    
    const icon = this.add.text(x - 160, y + 15, '🛡️', {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true
      }
    }).setOrigin(0, 0.5).setScrollFactor(0);

    this.clubNameText = this.add.text(x - 130, y + 15, 'Cargando...', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true
      },
      maxLines: 1,
      wordWrap: { width: 150 }
    }).setOrigin(0, 0.5).setScrollFactor(0);
    
    this.clubLevelText = this.add.text(x - 160, y + 40, 'Nv. 1', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffd700',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        fill: true
      }
    }).setOrigin(0, 0.5).setScrollFactor(0);
    
    this.clubMembersText = this.add.text(x - 80, y + 40, '👥 0', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        fill: true
      }
    }).setOrigin(0, 0.5).setScrollFactor(0);

    this.clubHUD.addMultiple([bg, icon, this.clubNameText, this.clubLevelText, this.clubMembersText]);
    this.clubHUD.setDepth(999);
    
    console.log('✅ HUD del club creado');
  }

  updatePlayerClubText() {
    if (!this.playerClubText) return;
    
    const character = this.player?.getData('character');
    
    if (!character?.club_id) {
      this.playerClubText.setText('');
      this.playerClubText.setVisible(false);
      return;
    }
    
    this.playerClubText.setText('Cargando club...');
    this.playerClubText.setVisible(true);
    this.playerClubText.setColor('#cccccc');
  }

  updatePlayerClubDisplay(clubData) {
    if (!clubData || !this.playerClubText) return;
    
    console.log('🏆 Actualizando display del club sobre el jugador:', clubData.name);
    
    const displayName = `${clubData.name}`;
    this.playerClubText.setText(displayName);
    this.playerClubText.setColor('#ffd700');
    this.playerClubText.setVisible(true);
    
    console.log('✅ Texto del club actualizado:', displayName);
    
    this.playerClubText.setScale(0.8);
    this.playerClubText.setAlpha(0);
    
    this.tweens.add({
      targets: this.playerClubText,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
    
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (this.playerClubText && this.playerClubText.visible) {
          this.tweens.add({
            targets: this.playerClubText,
            alpha: 0.8,
            duration: 1000,
            yoyo: true,
            ease: 'Sine.easeInOut'
          });
        }
      },
      loop: true
    });
  }

  showClubNotification(clubData) {
    if (!this.player) return;
    
    const notification = this.add.text(this.player.x, this.player.y - 100, `🏆 Club: ${clubData.name}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#9b59b6',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(200);
    
    this.tweens.add({
      targets: notification,
      y: this.player.y - 120,
      alpha: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    });
  }

  showNoClubMessage() {
    const character = this.player?.getData('character');
    if (character?.club_id && this.clubData) {
      return;
    }
    
    const clubZone = this.interactionZones.find(z => z.getData('location') === 'club_house');
    if (clubZone && clubZone.labelObject) {
      clubZone.labelObject.setText(`🏆 UNIRSE A CLUB`);
      clubZone.labelObject.setColor('#e74c3c');
    }
    
    this.updatePlayerClubText();
  }

  // 4. REFECTORIZACIÓN DE update (Movimiento y Animación)
  update() {
  if (!this.player || !this.player.body) return;
  
  // Restablecer velocidad en cada ciclo
  this.player.body.setVelocity(0);
  
  // Detectar si está corriendo (SHIFT presionado)
  const isRunning = this.keys.shift.isDown;
  const speed = isRunning ? 300 : 200; // Correr es más rápido
  
  let moving = false;
  let direction = this.player.getData('lastDirection') || 'down'; // Usar última dirección como punto de partida
  
  // Movimiento Horizontal
  if (this.cursors.left.isDown || this.keys.a.isDown) {
    this.player.body.setVelocityX(-speed);
    direction = 'left';
    moving = true;
  } else if (this.cursors.right.isDown || this.keys.d.isDown) {
    this.player.body.setVelocityX(speed);
    direction = 'right';
    moving = true;
  }
  
  // Movimiento Vertical
  if (this.cursors.up.isDown || this.keys.w.isDown) {
    this.player.body.setVelocityY(-speed);
    direction = 'up';
    moving = true;
  } else if (this.cursors.down.isDown || this.keys.s.isDown) {
    this.player.body.setVelocityY(speed);
    direction = 'down';
    moving = true;
  }
  
  // Normalizar velocidad diagonal
  if (this.player.body.velocity.x !== 0 && this.player.body.velocity.y !== 0) {
    this.player.body.velocity.normalize().scale(speed);
  }
  
  // ==================== SISTEMA DE ANIMACIONES (Adaptado a LPC) ====================
  
  // ¡IMPORTANTE! LPC tiene sprites separados para 'left' y 'right', no necesitamos voltear.
  this.player.setFlipX(false); 
  
  if (moving) {
    // Decidir entre caminar o correr
    const moveType = isRunning ? 'run' : 'walk';
    
    // La clave se construye dinámicamente: player_walk_down, player_run_up, etc.
    const animKey = `player_${moveType}_${direction}`;
    
    // Reproducir animación si es diferente
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey, true);
    }
    
    // Guardar última dirección
    this.player.setData('lastDirection', direction);
    
  } else {
    // IDLE - usar la última dirección conocida
    const lastDir = this.player.getData('lastDirection') || 'down';
    
    // Construir la clave de Idle usando la dirección guardada.
    // Usamos 'down' como fallback para 'idle' genérico.
    let animKey = `player_idle_${lastDir}`;
    
    // En el caso de que 'lastDir' sea indefinido o 'down', usa 'player_idle_down'
    if (lastDir === 'down' && this.player.anims.currentAnim?.key === 'player_idle') {
      // Caso especial para corregir si el fallback genérico 'player_idle' (que creaste) estaba activo
      animKey = 'player_idle_down';
    }

    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey, true);
    }
  }
  
  // Actualizar UI y sistemas
  this.updatePlayerUI();
  this.checkInteractionZones();
  this.checkNearbyNPCs();
}

// NUEVO: Método para manejar ataques
handleAttack() {
  // Evitar spam de ataques
  if (this.isAttacking) return;
  
  this.isAttacking = true;
  const lastDir = this.player.getData('lastDirection') || 'down';
  
  // Reproducir animación de ataque
  let attackAnim = 'player_attack_down';
  let flipX = false;
  
  switch (lastDir) {
    case 'down':
      attackAnim = 'player_attack_down';
      break;
    case 'up':
      attackAnim = 'player_attack_up';
      break;
    case 'left':
      attackAnim = 'player_attack_left';
      flipX = false;
      break;
    case 'right':
      attackAnim = 'player_attack_left';
      flipX = true;
      break;
  }
  
  this.player.setFlipX(flipX);
  this.player.play(attackAnim);
  
  // Crear efecto visual del ataque
  this.createAttackEffect(lastDir);
  
  // Verificar si golpea a un NPC
  this.checkAttackHit();
  
  // Permitir otro ataque después de la animación
  this.time.delayedCall(400, () => {
    this.isAttacking = false;
  });
}

// NUEVO: Efecto visual del ataque
createAttackEffect(direction) {
  const offsets = {
    down: { x: 0, y: 40 },
    up: { x: 0, y: -40 },
    left: { x: -40, y: 0 },
    right: { x: 40, y: 0 }
  };
  
  const offset = offsets[direction];
  
  const effect = this.add.circle(
    this.player.x + offset.x,
    this.player.y + offset.y,
    15,
    0xffff00,
    0.5
  ).setDepth(99);
  
  this.tweens.add({
    targets: effect,
    scale: 2,
    alpha: 0,
    duration: 300,
    onComplete: () => effect.destroy()
  });
}

// NUEVO: Verificar si el ataque golpea algo
checkAttackHit() {
  this.npcs.forEach(npc => {
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      npc.x,
      npc.y
    );
    
    if (distance < 60) {
      // ¡Golpeó al NPC!
      this.showFloatingText('¡Golpe!', 0xff0000);
      
      // Efecto de sacudida en el NPC
      this.tweens.add({
        targets: npc,
        x: npc.x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3
      });
    }
  });
}

// NUEVO: Mostrar efecto de daño
showHurtEffect() {
  if (!this.player) return;
  
  this.player.play('player_hurt');
  
  // Efecto de parpadeo rojo
  this.player.setTint(0xff0000);
  
  this.time.delayedCall(500, () => {
    this.player.clearTint();
  });
}

  updatePlayerUI() {
    const character = this.player.getData('character');
    
    this.playerNameText.setPosition(this.player.x, this.player.y + 35);
    
    if (this.playerClubText) {
      this.playerClubText.setPosition(this.player.x, this.player.y + 55);
    }
    
    const energyPercent = (character?.energia || 100) / 100;
    this.energyBarBg.setPosition(this.player.x - 25, this.player.y + 75);
    this.energyBar.setPosition(this.player.x - 25, this.player.y + 75);
    this.energyBar.width = 50 * energyPercent;
    
    this.interactionIndicator.setPosition(this.player.x, this.player.y - 50);
  }

  checkInteractionZones() {
    let inZone = false;
    let closestZone = null;
    let minDistance = Infinity;
    
    this.interactionZones.forEach(zone => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      
      const detectionRadius = 200;
      
      if (distance < detectionRadius && distance < minDistance) {
        inZone = true;
        closestZone = zone;
        minDistance = distance;
        
        if (zone.visualZone) {
          zone.visualZone.setAlpha(0.6);
        }
      } else {
        if (zone.visualZone) {
          zone.visualZone.setAlpha(0.4);
        }
      }
    });
    
    if (inZone && closestZone) {
      const location = closestZone.getData('location');
      if (this.currentLocation !== location) {
        this.currentLocation = location;
        this.game.events.emit('location-entered', location);
        console.log(`📍 Entrando a: ${location}`);
      }
    } else if (!inZone && this.currentLocation) {
      console.log(`📍 Saliendo de: ${this.currentLocation}`);
      this.currentLocation = null;
      this.game.events.emit('location-entered', null);
    }
    
    this.interactionIndicator.setVisible(inZone);
    if (inZone && closestZone) {
      this.interactionIndicator.setText(`↓ E - ${closestZone.getData('location').toUpperCase()}`);
    }
  }

  checkNearbyNPCs() {
    this.npcs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      npc.setTint(distance < 80 ? 0xffd700 : 0xffffff);
    });
  }

  handleInteraction() {
    let nearbyNPC = null;
    let closestZone = null;
    let minDistance = Infinity;

    this.npcs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (distance < 100 && distance < minDistance) {
        nearbyNPC = npc;
        minDistance = distance;
      }
    });
    
    if (nearbyNPC) {
      console.log(`🤝 Interactuando con NPC: ${nearbyNPC.getData('name')}`);
      this.handleNPCInteraction(nearbyNPC.getData('type'));
      return;
    }
    
    this.interactionZones.forEach(zone => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      if (distance < 200 && distance < minDistance) {
        closestZone = zone;
        minDistance = distance;
      }
    });

    if (closestZone) {
      const location = closestZone.getData('location');
      console.log(`🎯 Interactuando con zona: ${location}`);
      this.handleLocationInteraction(location);
    } else {
      console.log('❌ No hay NPCs o zonas cercanas para interactuar');
      this.showDialog('No hay nada con lo que interactuar aquí');
    }
  }

  handleNPCInteraction(npcType) {
    switch (npcType) {
      case 'trainer': 
        this.showDialog('¿Quieres entrenar?');
        this.time.delayedCall(1000, () => {
          this.addLupicoins(25, 'Entrenamiento');
        });
        break;
      case 'merchant': 
        this.showDialog('Bienvenido al mercado');
        break;
      case 'referee': 
        this.game.events.emit('open-minigame', 'futsal');
        break;
      case 'club_leader': 
        this.game.events.emit('navigate', 'clubs');
        break;
    }
  }

  handleLocationInteraction(location) {
    switch (location) {
      case 'training_ground': 
        this.game.events.emit('open-minigame', 'futsal');
        break;
      case 'arena': 
        this.game.events.emit('navigate', 'bot-match');
        break;
      case 'market': 
        this.showDialog('Mercado - Próximamente');
        break;
      case 'club_house': 
        this.game.events.emit('navigate', 'clubs');
        break;
      case 'exploration': 
        this.handleExploration();
        break;
    }
  }

  handleExploration() {
    const chance = Math.random();
    if (chance > 0.7) {
      this.addLupicoins(50, 'Exploración');
      this.showDialog('¡Tesoro encontrado! +50 Lupicoins');
    } else if (chance > 0.4) {
      this.showDialog('Item encontrado');
      this.addLupicoins(10, 'Item raro');
    } else {
      this.showDialog('Nada por aquí');
    }
  }

  showDialog(message) {
    const dialog = this.add.text(this.player.x, this.player.y - 60, message, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(200);
    
    this.time.delayedCall(2000, () => dialog.destroy());
  }

  addLupicoins(amount, source) {
    const newAmount = this.currentLupicoins + amount;
    this.updateLupicoinsDisplay(newAmount);
    
    this.showFloatingText(`+${amount} 💎`, 0xffd700);
    console.log(`💰 ${amount} lupicoins añadidos por: ${source}`);
  }

  showFloatingText(text, color = 0xffffff) {
    if (!this.player) return;
    
    const floatingText = this.add.text(this.player.x, this.player.y - 80, text, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: Phaser.Display.Color.ValueToColor(color).rgba
    }).setOrigin(0.5).setDepth(201);
    
    this.tweens.add({
      targets: floatingText,
      y: this.player.y - 120,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => floatingText.destroy()
    });
  }

  debugMovement() {
    console.log('🎯 DEBUG MOVIMIENTO:');
    console.log('Posición jugador:', Math.round(this.player.x), Math.round(this.player.y));
    console.log('Velocidad:', this.player.body.velocity);
    
    this.showDialog(`Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
    
    const marker = this.add.circle(this.player.x, this.player.y, 10, 0xff0000, 0.5)
      .setDepth(300);
    
    this.time.delayedCall(2000, () => marker.destroy());
  }

  debugZones() {
    console.log('🔍 DEBUG ZONAS:');
    this.interactionZones.forEach((zone, index) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y);
      console.log(`Zona ${index}: ${zone.getData('location')} - Distancia: ${Math.round(distance)}`);
    });
    
    this.showDialog(`Posición: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`);
  }

  debugClubInfo() {
    const character = this.player?.getData('character');
    if (character?.club_id) {
      this.showDialog(`Club ID: ${character.club_id}`);
      console.log('🔍 Debug Club - Character:', character);
    } else {
      this.showDialog('No perteneces a ningún club');
    }
  }

  autoSave() {
    if (this.player && this.services.saveProgress) {
      this.services.saveProgress(
        this.characterId,
        this.player.x,
        this.player.y,
        this.currentLocation
      );
      
      const saveText = this.add.text(this.player.x, this.player.y - 60, '💾 Guardando...', {
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.tweens.add({
        targets: saveText,
        y: this.player.y - 80,
        alpha: 0,
        duration: 1000,
        onComplete: () => saveText.destroy()
      });
    }
  }
}