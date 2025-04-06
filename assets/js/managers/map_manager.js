export default class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.layer = null;
  }

  preload() {
    this.scene.load.image('tiles', '/images/tilemaps/iso/iso-64x64-outside.png');
    this.scene.load.image('tiles2', '/images/tilemaps/iso/iso-64x64-building.png');
    this.scene.load.tilemapTiledJSON('map', '/images/tilemaps/iso/isorpg.json');
  }

  create() {
    this.map = this.scene.add.tilemap('map');

    const tileset1 = this.map.addTilesetImage('iso-64x64-outside', 'tiles');
    const tileset2 = this.map.addTilesetImage('iso-64x64-building', 'tiles2');

    const layer1 = this.map.createLayer('Tile Layer 1', [tileset1, tileset2]);
    const layer2 = this.map.createLayer('Tile Layer 2', [tileset1, tileset2]);
    const layer3 = this.map.createLayer('Tile Layer 3', [tileset1, tileset2]);
    const layer4 = this.map.createLayer('Tile Layer 4', [tileset1, tileset2]);
    const layer5 = this.map.createLayer('Tile Layer 5', [tileset1, tileset2]);

    this.scene.cameras.main.setZoom(5);
  }
}
