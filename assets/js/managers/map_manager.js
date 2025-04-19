import Phaser from "phaser";
import { EasyStar, IPoint } from "easystarts";

export default class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.map = null;
    this.layers = [];

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

    this.layers[0] = this.map.createLayer("Ground", tileSet).setDepth(10);
    this.layers[1] = this.map.createLayer("Tile Layer 1", tileSet).setDepth(20);
    this.layers[2] = this.map.createLayer("Tile Layer 2", tileSet).setDepth(30);

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
        tile = this.getTileAt(j, i);

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

  getTile(x, y) {
    return this.getTileFromLayers(x, y, [...this.layers]);
  }

  getTileAt(iX, iY) {
    return this.getTileAtFromLayers(iX, iY, [...this.layers]);
  }

  getTileFromLayers(x, y, layers) {
    if (layers.length === 0) return undefined;

    const layer = layers.pop();
    const tile = layer.getTileAtWorldXY(x, y);

    if (tile) return tile;
    else return this.getTileFromLayers(x, y, layers);
  }

  getTileAtFromLayers(iX, iY, layers) {
    if (layers.length === 0) return undefined;

    const layer = layers.pop();
    const tile = layer.getTileAt(iX, iY);

    if (tile) return tile;
    else return this.getTileAtFromLayers(iX, iY, layers);
  }

  getDepth(tile) {
    if (tile.layer.name === this.layers[0].layer.name) return 64;
    if (tile.layer.name === this.layers[1].layer.name) return 32;
    else return 0;
  }
}
