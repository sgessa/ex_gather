import ActorProximityController from "./actor/actor_proximity_controller";
import ActorTagController from "./actor/actor_tag_controller";

export default class ActorController {
  constructor(scene, actor) {
    this.scene = scene;

    this.dirX = actor.dirX;
    this.dirY = actor.dirY;
    this.id = actor.id;
    this.username = actor.username;
    this.state = actor.state;

    this.sprite = this.createSprite();
    this.collider = this.createCollider();

    this.proximityController = new ActorProximityController(this);
    this.tagController = new ActorTagController(this);
  }

  createSprite() {
    let preset = this.dirY == "up" ? "player_back" : "player_front";
    let sprite = this.scene.physics.add.sprite(this.x, this.y, preset);

    sprite.body.setImmovable(true);
    sprite.setScale(0.182, 0.137);
    sprite.body.setSize(130, 320);
    sprite.setPosition(this.x, this.y);

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
    this.proximityController.handleUpdate();
    this.tagController.handleUpdate();
    // Sync the label's position with the player
  }

  move(data) {
    const { id, x, y, dir_x, dir_y, state } = data;

    // Apply tween for smooth movement
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: 100, // Matches network update rate
      ease: 'Linear'
    });

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
    this.name.destroy();
  }
}
