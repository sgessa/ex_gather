import PlayerAnimController from "./player/player_anim_controller.js"
import PlayerMovementController from "./player/player_movement_controller.js";
import PlayerTagController from "./player/player_tag_controller.js";
import PlayerProximityController from "./player/player_proximity_controller.js";
import CameraController from "./camera_controller.js";

export default class PlayerController {
  constructor(scene, channel, user) {
    this.id = user.id;
    this.scene = scene;
    this.channel = channel;
    this.username = user.username;

    this.mapManager = this.scene.mapManager;

    let startTile = this.scene.mapManager.bottomLayer.getTileAt(user.x, user.y)
    this.sprite = this.createSprite(startTile);

    this.proximityController = new PlayerProximityController(this);
    this.tagController = new PlayerTagController(this);

    this.cameraController = new CameraController(this.scene, this.sprite);
    this.movementController = new PlayerMovementController(this, startTile);
    this.animController = new PlayerAnimController(this);

    this.animController.handleCreate();
  }

  createSprite(startTile) {
    let sprite = this.scene.physics.add.sprite(
      startTile.pixelX,
      startTile.pixelY + this.mapManager.getDepth(startTile),
      "player_front"
    );

    sprite.setOrigin(0, 1);
    sprite.setScale(0.182, 0.137);

    // Set the body size smaller than the sprite for better collision detection
    sprite.body.setSize(130, 320);

    const depthValue = sprite.y + this.mapManager.getDepth(startTile);
    sprite.setDepth(depthValue);

    return sprite;
  }

  update(time, delta) {
    this.movementController.handleUpdate(time, delta);
    this.animController.handleUpdate();
    this.tagController.handleUpdate();
    this.proximityController.handleUpdate();
    this.cameraController.update(delta);
  }
}
