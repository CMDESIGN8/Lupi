// src/components/game/scenes/MainScene.js
import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.player = null;
    this.cursors = null;
    this.npcs = [];
    this.interactionZones = [];
    this.nearbyPlayers = [];
  }

  preload() {
    // Cargar assets (por ahora usaremos formas geométricas)
    // En producción, aquí cargarías sprites reales
    this.load.image('player', 'data:image/svg+xml;base64,...'); // Placeholder
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Obtener datos del personaje
    const character = this.game.registry.get('character');
    
    // Crear el mundo
    this.createWorld();
    
    // Crear jugador
    this.createPlayer(character);
    
    // Crear zonas de interacción
    this.createInteractionZones();
    
    // Crear NPCs y otros jugadores
    this.createNPCs();
    
    // Configurar controles
    this.setupControls();
    
    // Configurar cámara
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 2000, 2000);
    
    // Escuchar eventos
    this.game.events.on('start-training', this.handleTraining, this);
  }

  createWorld() {
    // Fondo del mundo
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2ecc71, 1);
    graphics.fillRect(0, 0, 2000, 2000);
    
    // Grid para referencia visual
    graphics.lineStyle(1, 0x27ae60, 0.3);
    for (let i = 0; i < 2000; i += 100) {
      graphics.moveTo(i, 0);
      graphics.lineTo(i, 2000);
      graphics.moveTo(0, i);
      graphics.lineTo(2000, i);
    }
    graphics.strokePath();
    
    // Crear áreas específicas
    this.createAreas();
  }

  createAreas() {
    const areas = [
      { name: 'training_ground', x: 400, y: 400, width: 300, height: 300, color: 0x3498db, label: '⚽ ENTRENAMIENTO' },
      { name: 'arena', x: 1200, y: 400, width: 300, height: 300, color: 0xe74c3c, label: '⚔️ ARENA' },
      { name: 'market', x: 400, y: 1200, width: 300, height: 300, color: 0xf39c12, label: '🛒 MERCADO' },
      { name: 'club_house', x: 1200, y: 1200, width: 300, height: 300, color: 0x9b59b6, label: '🏆 CLUB' },
      { name: 'exploration', x: 800, y: 800, width: 400, height: 400, color: 0x1abc9c, label: '🗺️ EXPLORACIÓN' }
    ];

    areas.forEach(area => {
      // Crear zona visual
      const zone = this.add.rectangle(
        area.x + area.width / 2,
        area.y + area.height / 2,
        area.width,
        area.height,
        area.color,
        0.3
      );
      zone.setStrokeStyle(4, area.color);
      
      // Etiqueta
      this.add.text(area.x + area.width / 2, area.y + 20, area.label, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Zona de interacción (invisible)
      const interactionZone = this.add.zone(
        area.x + area.width / 2,
        area.y + area.height / 2,
        area.width,
        area.height
      );
      this.physics.world.enable(interactionZone);
      interactionZone.body.setAllowGravity(false);
      interactionZone.body.moves = false;
      interactionZone.setData('location', area.name);
      
      this.interactionZones.push(interactionZone);
    });
  }

  createPlayer(character) {
    // Crear jugador (por ahora un círculo)
    this.player = this.add.circle(1000, 1000, 20, 0x00ff88);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setDrag(800);
    
    // Nombre del jugador
    this.playerNameText = this.add.text(0, -40, character.nickname, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Nivel
    this.playerLevelText = this.add.text(0, -25, `Nv. ${character.level}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // Barra de energía
    this.energyBarBg = this.add.rectangle(0, 30, 50, 5, 0x333333);
    this.energyBar = this.add.rectangle(0, 30, 50, 5, 0x00ff88);
    this.energyBar.setOrigin(0, 0.5);
    this.energyBarBg.setOrigin(0, 0.5);
    
    // Indicador de interacción
    this.interactionIndicator = this.add.text(0, 45, '↓ E para interactuar', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false);
    
    this.player.setData('character', character);
  }

  createNPCs() {
    // Crear algunos NPCs de ejemplo
    const npcPositions = [
      { x: 550, y: 550, name: 'Entrenador Mario', type: 'trainer' },
      { x: 1350, y: 550, name: 'Árbitro', type: 'referee' },
      { x: 550, y: 1350, name: 'Comerciante', type: 'merchant' },
      { x: 1350, y: 1350, name: 'Líder de Club', type: 'club_leader' }
    ];

    npcPositions.forEach(npcData => {
      const npc = this.add.circle(npcData.x, npcData.y, 15, 0xff6b6b);
      this.physics.add.existing(npc);
      npc.body.setImmovable(true);
      
      const npcText = this.add.text(npcData.x, npcData.y - 30, npcData.name, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      
      npc.setData('name', npcData.name);
      npc.setData('type', npcData.type);
      npc.setData('text', npcText);
      
      this.npcs.push(npc);
    });
  }

  setupControls() {
    // Controles de teclado
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = {
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      e: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      esc: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
    
    // Evento de interacción
    this.keys.e.on('down', () => {
      this.handleInteraction();
    });
    
    // Menú de pausa
    this.keys.esc.on('down', () => {
      this.game.events.emit('toggle-menu');
    });
  }

  update() {
    if (!this.player) return;
    
    // Movimiento del jugador
    const speed = 200;
    const velocity = new Phaser.Math.Vector2(0, 0);
    
    if (this.cursors.left.isDown || this.keys.a.isDown) {
      velocity.x = -speed;
    } else if (this.cursors.right.isDown || this.keys.d.isDown) {
      velocity.x = speed;
    }
    
    if (this.cursors.up.isDown || this.keys.w.isDown) {
      velocity.y = -speed;
    } else if (this.cursors.down.isDown || this.keys.s.isDown) {
      velocity.y = speed;
    }
    
    // Normalizar diagonal
    if (velocity.length() > 0) {
      velocity.normalize();
      this.player.body.setVelocity(velocity.x * speed, velocity.y * speed);
    }
    
    // Actualizar UI del jugador
    this.updatePlayerUI();
    
    // Verificar zonas de interacción
    this.checkInteractionZones();
    
    // Verificar NPCs cercanos
    this.checkNearbyNPCs();
  }

  updatePlayerUI() {
    const character = this.player.getData('character');
    
    // Actualizar posiciones de textos
    this.playerNameText.setPosition(this.player.x, this.player.y - 40);
    this.playerLevelText.setPosition(this.player.x, this.player.y - 25);
    
    // Actualizar barra de energía
    const energyPercent = (character.energia || 100) / 100;
    this.energyBarBg.setPosition(this.player.x - 25, this.player.y + 30);
    this.energyBar.setPosition(this.player.x - 25, this.player.y + 30);
    this.energyBar.width = 50 * energyPercent;
    
    // Indicador de interacción
    this.interactionIndicator.setPosition(this.player.x, this.player.y + 45);
  }

  checkInteractionZones() {
    let inZone = false;
    
    this.interactionZones.forEach(zone => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        zone.x,
        zone.y
      );
      
      if (distance < 150) {
        inZone = true;
        const location = zone.getData('location');
        this.game.events.emit('location-entered', location);
      }
    });
    
    this.interactionIndicator.setVisible(inZone);
  }

  checkNearbyNPCs() {
    this.npcs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );
      
      // Destacar NPCs cercanos
      if (distance < 80) {
        npc.setFillStyle(0xffd700);
      } else {
        npc.setFillStyle(0xff6b6b);
      }
    });
  }

  handleInteraction() {
    // Verificar si hay NPCs cerca
    const nearbyNPC = this.npcs.find(npc => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );
      return distance < 80;
    });
    
    if (nearbyNPC) {
      const npcType = nearbyNPC.getData('type');
      this.handleNPCInteraction(npcType);
      return;
    }
    
    // Verificar zonas de interacción
    this.interactionZones.forEach(zone => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        zone.x,
        zone.y
      );
      
      if (distance < 150) {
        const location = zone.getData('location');
        this.handleLocationInteraction(location);
      }
    });
  }

  handleNPCInteraction(npcType) {
    switch (npcType) {
      case 'trainer':
        this.showDialog('¿Quieres entrenar tus habilidades?');
        break;
      case 'merchant':
        this.game.events.emit('open-minigame', 'market');
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
        this.showDialog('Bienvenido al mercado');
        break;
      case 'club_house':
        this.game.events.emit('navigate', 'clubs');
        break;
      case 'exploration':
        this.handleExploration();
        break;
    }
  }

  handleTraining() {
    // Lógica de entrenamiento
    console.log('Entrenando...');
  }

  handleExploration() {
    // Random chance de encontrar items
    const chance = Math.random();
    if (chance > 0.7) {
      this.showDialog('¡Encontraste 50 Lupicoins!');
    } else if (chance > 0.4) {
      this.showDialog('Encontraste un item común');
    } else {
      this.showDialog('No encontraste nada esta vez');
    }
  }

  showDialog(message) {
    // Diálogo temporal
    const dialog = this.add.text(this.player.x, this.player.y - 60, message, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => {
      dialog.destroy();
    });
  }
}