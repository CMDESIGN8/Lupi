// src/components/game/utils/TilemapManager.js

export class TilemapManager {
  constructor(scene) {
    this.scene = scene;
    this.tileSize = 64; // Asegúrate que coincida con tu configuración de Tiled
  }

  // NUEVO: Método para cargar los archivos externos
  preload() {
    // Cargar el JSON del mapa exportado por Tiled
    this.scene.load.tilemapTiledJSON('world_map_json', '/assets/maps/world.json');
    // Cargar la imagen del tileset (asegúrate que el nombre coincida con el configurado en Tiled)
    this.scene.load.image('tileset_img', '/assets/maps/tileset.png');
  }

  createWorldMap() {
    // Intentar crear mapa desde JSON primero
    if (this.scene.cache.tilemap.exists('world_map_json')) {
      return this.createTiledMap();
    } else {
      console.warn('⚠️ JSON de mapa no encontrado, generando mapa procedural...');
      this.createProceduralTileset(); // Generamos texturas primero
      return this.createProceduralMap();
    }
  }

  createTiledMap() {
    console.log('🗺️ Cargando mapa desde Tiled...');
    const map = this.scene.make.tilemap({ key: 'world_map_json' });
    
    // El primer argumento es el nombre del tileset EN TILED
    // El segundo es la key de la imagen cargada en Phaser
    const tileset = map.addTilesetImage('MainTileset', 'tileset_img');

    if (!tileset) {
        console.error('❌ Error: No se pudo vincular el tileset. Verifica el nombre en Tiled.');
        return null;
    }

    // Crear capas (Asegúrate que los nombres coincidan con tus capas en Tiled)
    // createLayer(nombre_capa_tiled, tileset, x, y)
    const groundLayer = map.createLayer('Ground', tileset, 0, 0);
    const pathLayer = map.createLayer('Paths', tileset, 0, 0);
    const decorLayer = map.createLayer('Decoration', tileset, 0, 0);
    const collisionLayer = map.createLayer('Collisions', tileset, 0, 0);

    // Configurar colisiones
    if (collisionLayer) {
      collisionLayer.setCollisionByProperty({ collides: true });
      // O si usas rangos de tiles: collisionLayer.setCollisionBetween(1, 100);
      
      // Visualizar colisiones (Debug)
      /*
      const debugGraphics = this.scene.add.graphics().setAlpha(0.75);
      collisionLayer.renderDebug(debugGraphics, {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255)
      });
      */
    }

    // Configurar límites del mundo basados en el mapa
    this.scene.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.scene.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return { map, groundLayer, pathLayer, decorLayer, collisionLayer };
  }

  // --- MÉTODOS PROCEDURALES (LEGACY/FALLBACK) ---
  
  createProceduralTileset() {
     // ... (Tu código actual de createTileset va aquí)
     // Copia exactamente el contenido de tu método createTileset() original
     // para usarlo como respaldo.
     const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
     // ... generar texturas tile_grass_light, etc ...
     graphics.generateTexture('tiles', this.tileSize * 10, this.tileSize); // Ejemplo simplificado
     graphics.destroy();
  }

  createProceduralMap() {
    // ... (Tu código actual de createWorldMap va aquí)
    // Renombrado para diferenciarlo del mapa real
    const map = this.scene.make.tilemap({ 
      key: 'procedural_map', 
      tileWidth: this.tileSize, 
      tileHeight: this.tileSize 
    });
    // ... resto de tu lógica procedural ...
    return { map }; // Retorna estructura similar
  }
}