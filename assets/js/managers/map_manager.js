import Phaser from "phaser";
import { EasyStar, IPoint } from "easystarts";

export default class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.map = null;

    this.aStar = new EasyStar();
    this.aStar.enableDiagonals();
    this.aStar.disableCornerCutting();
  }

  preload() {
    this.scene.load.image('tileset', '/images/tilemaps/iso/iso-64x64-outside.png');
    this.scene.load.tilemapTiledJSON('map', '/images/tilemaps/iso/map.json');
  }

  create() {
    this.map = this.scene.add.tilemap("map");

    const tileSet = this.map.addTilesetImage("tileset");

    this.bottomLayer = this.map.createLayer("Ground", tileSet).setDepth(10);
    this.midLayer = this.map.createLayer("Tile Layer 1", tileSet).setDepth(20);
    this.topLayer = this.map.createLayer("Tile Layer 2", tileSet).setDepth(30);

    this.map.createLayer("Tile Layer 3", tileSet).setDepth(40);
    this.map.createLayer("Boundry", tileSet).setDepth(800);
    this.map.createLayer("AlwaysAbove-1", tileSet).setDepth(1000);
    this.map.createLayer("AlwaysAbove-2", tileSet).setDepth(2000);

    this.initAStarGrid();
  }

  initAStarGrid() {
    let grid = [];
    let tile;

    for (let i = 0; i < this.map.width; i++) {
      let col = [];

      for (let j = 0; j < this.map.height; j++) {
        tile =
          this.topLayer.getTileAt(j, i) ||
          this.midLayer.getTileAt(j, i) ||
          this.bottomLayer.getTileAt(j, i);

        if (tile.properties.walkable) {
          col.push(0);
        } else {
          col.push(1);
        }
      }

      grid.push(col);
    }

    this.aStar.setGrid(grid);
    this.aStar.setAcceptableTiles([0]);
  }

  getTile(x, y, layers) {
    if (layers.length === 0) return undefined;

    const layer = layers.pop();
    const tile = layer.getTileAtWorldXY(x, y);

    if (tile) return tile;
    else return this.getTile(x, y, layers);
  }

  getTileAt(iX, iY, layers) {
    if (layers.length === 0) return undefined;

    const layer = layers.pop();
    const tile = layer.getTileAt(iX, iY);

    if (tile) return tile;
    else return this.getTileAt(iX, iY, layers);
  }

  getDepth(tile) {
    if (tile.layer.name === this.bottomLayer.layer.name) return 64;
    if (tile.layer.name === this.midLayer.layer.name) return 32;
    else return 0;
  }
}
