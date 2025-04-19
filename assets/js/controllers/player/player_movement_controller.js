import { MOVE_UPDATE_DELTA, MOVEMENT_SPEED } from "../../const/player_const";

export default class PlayerMovementController {
  constructor(player, startTile) {
    this.player = player;
    this.scene = this.player.scene;
    this.mapManager = this.scene.mapManager;

    // Tile positions
    this.sTile = startTile;
    this.dTile = null;

    // Pixel positions
    this.currentPosition = {
      x: startTile.pixelX,
      y: startTile.pixelY + this.mapManager.getDepth(startTile) + 1
    };
    this.targetPosition = { ...this.currentPosition };

    // Movement control
    this.path = [];
    this.isMoving = false;
    this.movementSpeed = MOVEMENT_SPEED;
    this.frameTime = 0;

    // Marker initialization
    this.marker = this.scene.add.sprite(100, 100, "marker");
    this.marker.setOrigin(0, 1);

    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.updateMarker);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.move);
  }

  handleUpdate(time, delta) {
    this.frameTime += delta;

    // Handle smooth movement
    if (this.isMoving) {
      this.updateSmoothMovement(delta);
    }
    // Get next path point when not moving and path exists
    else if (this.path.length > 0 && this.frameTime > MOVE_UPDATE_DELTA) {
      this.frameTime = 0;
      this.setNextTarget();
    }
  }

  setNextTarget() {
    const point = this.path.shift();
    const tile = this.mapManager.getTileAt(point.x, point.y);

    if (tile) {
      this.sTile = tile;

      this.targetPosition = {
        x: tile.pixelX,
        y: tile.pixelY + this.mapManager.getDepth(tile) + 1
      };

      this.isMoving = true;
    }
  }

  updateSmoothMovement(delta) {
    const dx = this.targetPosition.x - this.currentPosition.x;
    const dy = this.targetPosition.y - this.currentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate movement step
    const moveDistance = (this.movementSpeed * delta) / 1000;

    // If we're close enough to snap to target
    if (distance <= moveDistance) {
      this.currentPosition = { ...this.targetPosition };
      this.player.sprite.setPosition(this.currentPosition.x, this.currentPosition.y);
      this.isMoving = false;

      // Update depth
      const depthValue = this.currentPosition.y + this.mapManager.getDepth(this.sTile);
      this.player.sprite.setDepth(depthValue);
      return;
    }

    // Normalize direction and move
    const directionX = dx / distance;
    const directionY = dy / distance;

    this.currentPosition.x += directionX * moveDistance;
    this.currentPosition.y += directionY * moveDistance;
    this.player.sprite.setPosition(this.currentPosition.x, this.currentPosition.y);

    // Update depth during movement
    const depthValue = this.currentPosition.y + this.mapManager.getDepth(this.sTile);
    this.player.sprite.setDepth(depthValue);
  }

  updateMarker = (e) => {
    // Get camera-adjusted pointer position
    const camera = this.player.scene.cameras.main;
    const px = camera.worldView.x + (e.x / camera.zoom);
    const py = camera.worldView.y + (e.y / camera.zoom) + 42;

    const tile = this.mapManager.getTile(px, py);

    if (tile && tile.properties.walkable) {
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
