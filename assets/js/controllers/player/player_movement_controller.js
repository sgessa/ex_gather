import { MOVE_UPDATE_DELTA } from "../../const/player_const";

export default class PlayerMovementController {
  constructor(player, startTile) {
    this.player = player;
    this.scene = this.player.scene;
    this.mapManager = this.scene.mapManager;

    // Set current player's tile
    this.sTile = startTile;

    // Initialize empty destination tile
    this.dTile = null;

    // Initialize cursor marker
    this.marker = this.scene.add.sprite(100, 100, "marker");
    this.marker.setOrigin(0, 1);

    // Initialize empty aStar path
    this.path = [];

    // Initialize update frame counter
    this.frameTime = 0;

    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.updateMarker);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.move);
  }

  handleUpdate(time, delta) {
    this.frameTime += delta;

    if (this.frameTime > MOVE_UPDATE_DELTA) {
      this.frameTime = 0;

      if (this.path.length > 0) {
        const point = this.path.shift();

        const tile = this.mapManager.getTileAt(point.x, point.y, [
          this.mapManager.bottomLayer,
          this.mapManager.midLayer,
          this.mapManager.topLayer,
        ]);

        if (tile) {
          this.sTile = tile;
          console.log("Moving to tile: ", tile);
          this.player.sprite.setPosition(tile.pixelX, tile.pixelY + this.mapManager.getDepth(tile) + 1);

          // Isometric depth sorting
          const depthValue = this.player.sprite.y + this.mapManager.getDepth(this.sTile);
          this.player.sprite.setDepth(depthValue);
        }
      }
    }
  }

  // Updates marker position when cursor moves
  // updateMarker = (e) => {
  //   const px = this.scene.cameras.main.worldView.x + e.x;
  //   const py = this.scene.cameras.main.worldView.y + e.y + 42;
  //
  //   const tile = this.mapManager.getTile(
  //     px,
  //     py,
  //     [
  //       this.mapManager.bottomLayer,
  //       this.mapManager.midLayer,
  //       this.mapManager.topLayer,
  //     ]
  //   );
  //
  //   if (tile && tile.properties.walkable) {
  //     this.marker.setPosition(
  //       tile.pixelX,
  //       tile.pixelY + this.mapManager.getDepth(tile)
  //     );
  //
  //     this.marker.setDepth(tile.pixelY + this.mapManager.getDepth(tile) + 1);
  //
  //     this.marker.visible = true;
  //     this.dTile = tile;
  //   } else {
  //     this.marker.visible = false;
  //   }
  // };
  updateMarker = (e) => {
    // Get camera-adjusted pointer position
    const camera = this.player.scene.cameras.main;
    const px = camera.worldView.x + (e.x / camera.zoom);
    const py = camera.worldView.y + (e.y / camera.zoom) + 42;

    const tile = this.mapManager.getTile(
      px,
      py,
      [
        this.mapManager.bottomLayer,
        this.mapManager.midLayer,
        this.mapManager.topLayer,
      ]
    );

    if (tile && tile.properties.walkable) {
      console.log("Marker Tile: ", tile);
      this.marker.setPosition(
        tile.pixelX,
        tile.pixelY + this.mapManager.getDepth(tile)
      );

      this.marker.setDepth(tile.pixelY + this.mapManager.getDepth(tile) + 1);

      this.marker.visible = true;
      this.dTile = tile;
    } else {
      this.marker.visible = false;
    }
  };

  // Updates player position when cursor clicks
  move = (e) => {
    if (this.marker.visible) {
      this.mapManager.aStar.findPath(
        this.sTile.x,
        this.sTile.y,
        this.dTile.x,
        this.dTile.y,
        (path) => {
          if (path) {
            this.path = path;
          }
        }
      );
      this.mapManager.aStar.calculate();
    }
  };
}
