import ActorProximityController from "./actor/actor_proximity_controller";
import ActorTagController from "./actor/actor_tag_controller";

export default class ActorController {
  constructor(scene, actor) {
    this.scene = scene;
    this.mapManager = this.scene.mapManager;

    this.dirX = actor.dirX;
    this.dirY = actor.dirY;
    this.id = actor.id;
    this.username = actor.username;
    this.state = actor.state;
    this.x = actor.x;
    this.y = actor.y;

    this.sprite = this.createSprite();
    this.collider = this.createCollider();

    this.proximityController = new ActorProximityController(this);
    this.tagController = new ActorTagController(this);
  }

  createSprite() {
    let startTile = this.mapManager.bottomLayer.getTileAt(this.x, this.y)
    let preset = this.dirY == "up" ? "player_back" : "player_front";
    let sprite = this.scene.physics.add.sprite(startTile.pixelX, startTile.pixelY, preset);

    sprite.setOrigin(0, 1);
    sprite.body.setImmovable(true);
    sprite.setScale(0.182, 0.137);
    sprite.body.setSize(130, 320);
    sprite.setPosition(startTile.pixelX, startTile.pixelY);

    return sprite;
  }

  createCollider() {
    return this.scene.physics.add.collider(
      this.scene.player.sprite,
      this.sprite,
      null,
      null,
      this
    );
  }

  update() {
    const depthValue = this.sprite.y + 1; // this.mapManager.getDepth(this.sTile);
    this.sprite.setDepth(depthValue);

    this.proximityController.handleUpdate();
    this.tagController.handleUpdate();
  }

  move(data) {
    const { id, x, y, dir_x, dir_y, state } = data;

    let tile = this.mapManager.getTileAt(x, y, [
      this.mapManager.bottomLayer,
      this.mapManager.midLayer,
      this.mapManager.topLayer,
    ]);

    // Apply tween for smooth movement
    this.scene.tweens.add({
      targets: this.sprite,
      x: tile.pixelX,
      y: tile.pixelY + this.mapManager.getDepth(tile),
      duration: 300, // Matches network update rate
      ease: 'Linear'
    });
    // this.sprite.setPosition(tile.pixelX, tile.pixelY + this.mapManager.getDepth(tile));
    this.sprite.setDepth(this.sprite.y + this.mapManager.getDepth(tile));

    // Update animation
    if (this.state !== state || this.dirX !== dir_x || this.dirY !== dir_y) {
      this.sprite.flipX = dir_x !== "left";

      if (state === "walk") {
        let anim = dir_y == "up" ? "walk_up" : "walk_down";
        this.sprite.play(anim);
      } else {
        let anim = dir_y == "up" ? "idle_up" : "idle_down";
        this.sprite.play(anim);
      }
    }

    this.dirX = dir_x;
    this.dirY = dir_y;
    this.state = state;
  }

  destroy() {
    this.sprite.destroy();
    this.collider.destroy();
    this.proximityController.destroy();
    this.tagController.destroy();
  }
}
