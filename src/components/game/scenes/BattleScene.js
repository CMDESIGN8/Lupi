// src/components/game/scenes/BattleScene.js
import Phaser from 'phaser';

// CAMBIO: Quitamos 'default' para permitir la importación con { BattleScene }
export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
    
    // Estado de la batalla
    this.battleState = {
      phase: 'selection', // selection, action, result
      playerTeam: [],
      opponentTeam: [],
      currentPlayer: 0,
      selectedAction: null,
      turnOrder: []
    };
  }

  init(data) {
    // Recibir datos del mundo principal
    this.playerData = data.playerData || {};
    this.opponentData = data.opponentData || {};
    this.battleType = data.battleType || 'training'; // training, pvp, tournament
  }

  preload() {
    // Cargar assets para la batalla
    this.load.image('battle_background', '/assets/battle/background.png');
    this.load.image('soccer_field', '/assets/battle/soccer_field.png');
    this.load.image('player_icon', '/assets/battle/player_icon.png');
    this.load.image('opponent_icon', '/assets/battle/opponent_icon.png');
    
    // UI elements
    this.load.image('action_button', '/assets/ui/button.png');
    this.load.image('health_bar', '/assets/ui/health_bar.png');
    this.load.image('stamina_bar', '/assets/ui/stamina_bar.png');
  }

  create() {
    // Crear fondo de batalla
    this.createBattleBackground();
    
    // Inicializar equipos
    this.initializeTeams();
    
    // Crear UI de batalla
    this.createBattleUI();
    
    // Iniciar primera fase
    this.startBattle();
  }

  createBattleBackground() {
    // Fondo según el tipo de batalla
    const backgrounds = {
      training: 'soccer_field',
      pvp: 'battle_background',
      tournament: 'soccer_field'
    };
    
    this.add.image(640, 360, backgrounds[this.battleType] || 'soccer_field');
    
    // Título de la batalla
    this.add.text(640, 50, this.getBattleTitle(), {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  getBattleTitle() {
    const titles = {
      training: 'ENTRENAMIENTO',
      pvp: 'BATALLA PVP',
      tournament: 'TORNEO'
    };
    return titles[this.battleType] || 'BATALLA';
  }

  initializeTeams() {
    // Inicializar equipo del jugador
    this.battleState.playerTeam = [
      {
        name: this.playerData.name || 'Jugador',
        stats: this.playerData.stats || { attack: 50, defense: 50, stamina: 100, technique: 50 },
        health: 100,
        stamina: 100,
        position: { x: 200, y: 360 },
        skills: ['Disparo', 'Pase', 'Regate', 'Defensa']
      }
    ];

    // Inicializar equipo oponente
    this.battleState.opponentTeam = [
      {
        name: this.opponentData.name || 'Rival',
        stats: this.opponentData.stats || { attack: 45, defense: 55, stamina: 100, technique: 45 },
        health: 100,
        stamina: 100,
        position: { x: 1080, y: 360 },
        skills: ['Disparo', 'Pase', 'Regate', 'Defensa']
      }
    ];

    // Crear sprites de los jugadores
    this.createPlayerSprites();
  }

  createPlayerSprites() {
    // Sprite del jugador
    this.playerSprite = this.add.sprite(200, 360, 'player_icon')
      .setScale(2)
      .setInteractive();
    
    // Sprite del oponente
    this.opponentSprite = this.add.sprite(1080, 360, 'opponent_icon')
      .setScale(2);

    // Añadir nombres
    this.add.text(200, 300, this.battleState.playerTeam[0].name, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(1080, 300, this.battleState.opponentTeam[0].name, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
  }

  createBattleUI() {
    // Barra de salud del jugador
    this.playerHealthBar = this.createHealthBar(150, 450, this.battleState.playerTeam[0].health);
    
    // Barra de stamina del jugador
    this.playerStaminaBar = this.createStaminaBar(150, 480, this.battleState.playerTeam[0].stamina);
    
    // Barra de salud del oponente
    this.opponentHealthBar = this.createHealthBar(1130, 450, this.battleState.opponentTeam[0].health);
    
    // Barra de stamina del oponente
    this.opponentStaminaBar = this.createStaminaBar(1130, 480, this.battleState.opponentTeam[0].stamina);

    // Panel de acciones
    this.createActionPanel();
  }

  createHealthBar(x, y, value) {
    const background = this.add.rectangle(x, y, 200, 20, 0x666666);
    const health = this.add.rectangle(x - (100 - value), y, value * 2, 20, 0xff0000);
    
    return { background, health, value };
  }

  createStaminaBar(x, y, value) {
    const background = this.add.rectangle(x, y, 200, 15, 0x666666);
    const stamina = this.add.rectangle(x - (100 - value), y, value * 2, 15, 0x00ff00);
    
    return { background, stamina, value };
  }

  createActionPanel() {
    // Panel de acciones en la parte inferior
    const actions = ['DISPARO', 'PASE', 'REGATE', 'DEFENSA', 'HABILIDAD'];
    
    this.actionButtons = [];
    
    actions.forEach((action, index) => {
      const button = this.add.rectangle(200 + (index * 160), 600, 140, 50, 0x3498db)
        .setInteractive()
        .on('pointerdown', () => this.selectAction(action))
        .on('pointerover', () => button.setFill(0x2980b9))
        .on('pointerout', () => button.setFill(0x3498db));
      
      this.add.text(200 + (index * 160), 600, action, {
        fontSize: '14px',
        fill: '#ffffff'
      }).setOrigin(0.5);
      
      this.actionButtons.push(button);
    });
  }

  startBattle() {
    this.battleState.phase = 'selection';
    this.showMessage('¡Que comience la batalla! Elige tu acción.');
  }

  selectAction(action) {
    if (this.battleState.phase !== 'selection') return;
    
    this.battleState.selectedAction = action;
    this.battleState.phase = 'action';
    
    this.showMessage(`Usaste: ${action}`);
    this.performAction(action);
  }

  performAction(action) {
    const player = this.battleState.playerTeam[0];
    const opponent = this.battleState.opponentTeam[0];
    
    // Consumir stamina
    const staminaCost = 20;
    player.stamina = Math.max(0, player.stamina - staminaCost);
    this.updateStaminaBar(this.playerStaminaBar, player.stamina);
    
    // Calcular daño basado en la acción y estadísticas
    let damage = 0;
    let opponentDamage = 0;
    
    switch (action) {
      case 'DISPARO':
        damage = this.calculateDamage(player.stats.attack, opponent.stats.defense, 'attack');
        break;
      case 'PASE':
        damage = this.calculateDamage(player.stats.technique, opponent.stats.defense, 'technique');
        break;
      case 'REGATE':
        damage = this.calculateDamage(player.stats.technique, opponent.stats.defense, 'technique');
        opponent.stamina -= 10; // El regate consume stamina del oponente
        break;
      case 'DEFENSA':
        // La defensa reduce el daño recibido en el próximo turno
        player.stats.defense += 20;
        this.showMessage('¡Defensa aumentada!');
        break;
    }
    
    // Aplicar daño al oponente
    if (damage > 0) {
      opponent.health = Math.max(0, opponent.health - damage);
      this.updateHealthBar(this.opponentHealthBar, opponent.health);
      this.showDamageEffect(this.opponentSprite, damage);
    }
    
    // Turno del oponente
    this.time.delayedCall(1000, () => {
      this.opponentTurn();
    });
  }

  opponentTurn() {
    const player = this.battleState.playerTeam[0];
    const opponent = this.battleState.opponentTeam[0];
    
    // IA simple del oponente
    const actions = ['DISPARO', 'PASE', 'REGATE', 'DEFENSA'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    this.showMessage(`El rival usa: ${randomAction}`);
    
    let damage = 0;
    
    switch (randomAction) {
      case 'DISPARO':
        damage = this.calculateDamage(opponent.stats.attack, player.stats.defense, 'attack');
        break;
      case 'PASE':
        damage = this.calculateDamage(opponent.stats.technique, player.stats.defense, 'technique');
        break;
    }
    
    // Aplicar daño al jugador
    if (damage > 0) {
      player.health = Math.max(0, player.health - damage);
      this.updateHealthBar(this.playerHealthBar, player.health);
      this.showDamageEffect(this.playerSprite, damage);
    }
    
    // Verificar condiciones de victoria/derrota
    this.time.delayedCall(1000, () => {
      this.checkBattleEnd();
    });
  }

  calculateDamage(attack, defense, type) {
    const baseDamage = type === 'attack' ? 15 : 10;
    const damage = Math.max(5, baseDamage + (attack - defense) * 0.5);
    return Math.round(damage);
  }

  showDamageEffect(sprite, damage) {
    const damageText = this.add.text(sprite.x, sprite.y - 50, `-${damage}`, {
      fontSize: '24px',
      fill: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: damageText,
      y: sprite.y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });
    
    // Efecto de parpadeo
    this.tweens.add({
      targets: sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });
  }

  updateHealthBar(healthBar, newHealth) {
    healthBar.health.width = newHealth * 2;
    healthBar.value = newHealth;
  }

  updateStaminaBar(staminaBar, newStamina) {
    staminaBar.stamina.width = newStamina * 2;
    staminaBar.value = newStamina;
  }

  checkBattleEnd() {
    const player = this.battleState.playerTeam[0];
    const opponent = this.battleState.opponentTeam[0];
    
    if (player.health <= 0) {
      this.endBattle(false);
    } else if (opponent.health <= 0) {
      this.endBattle(true);
    } else {
      // Continuar batalla
      this.battleState.phase = 'selection';
      this.showMessage('Elige tu siguiente acción');
      
      // Regenerar stamina
      player.stamina = Math.min(100, player.stamina + 10);
      opponent.stamina = Math.min(100, opponent.stamina + 10);
      this.updateStaminaBar(this.playerStaminaBar, player.stamina);
      this.updateStaminaBar(this.opponentStaminaBar, opponent.stamina);
    }
  }

  endBattle(victory) {
    this.battleState.phase = 'result';
    
    const resultText = victory ? '¡VICTORIA!' : 'DERROTA';
    const color = victory ? '#00ff00' : '#ff0000';
    
    this.showMessage(resultText, color);
    
    // Deshabilitar botones
    this.actionButtons.forEach(button => {
      button.disableInteractive();
      button.setFill(0x777777);
    });
    
    // Botón para volver al mundo
    const returnButton = this.add.rectangle(640, 650, 200, 50, 0x3498db)
      .setInteractive()
      .on('pointerdown', () => this.returnToWorld(victory));
    
    this.add.text(640, 650, 'Volver al Mundo', {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);
    
    // Calcular recompensas
    if (victory) {
      this.calculateRewards();
    }
  }

  calculateRewards() {
    const rewards = {
      exp: 50,
      coins: 25,
      items: []
    };
    
    // Emitir evento con las recompensas
    this.events.emit('battle-complete', {
      victory: true,
      rewards: rewards,
      battleType: this.battleType
    });
  }

  returnToWorld(victory) {
    // Transición de vuelta al MainScene
    this.scene.start('MainScene', {
      battleResult: victory ? 'victory' : 'defeat',
      rewards: victory ? this.calculateRewards() : null
    });
  }

  showMessage(text, color = '#ffffff') {
    // Limpiar mensaje anterior si existe
    if (this.messageText) {
      this.messageText.destroy();
    }
    
    this.messageText = this.add.text(640, 550, text, {
      fontSize: '20px',
      fill: color,
      fontFamily: 'Arial',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  update() {
    // Lógica de actualización si es necesaria
  }
}