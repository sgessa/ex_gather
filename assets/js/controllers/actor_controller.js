import ActorProximityController from "./actor/actor_proximity_controller";
import ActorTagController from "./actor/actor_tag_controller";
import { SPRITE_OFFSET } from "../const/player_const";

export default class ActorController {
  constructor(scene, actor) {
    this.scene = scene;
    this.mapManager = this.scene.mapManager;

    this.dirX = actor.dir_x;
    this.dirY = actor.dir_y;
    this.id = actor.id;
    this.username = actor.username;
    this.state = actor.state;
    this.x = actor.x;
    this.y = actor.y;

    this.audioEnabled = actor.rtc_audio_enabled;
    this.cameraEnabled = actor.rtc_camera_enabled;
    this.rtcTracks = actor.rtc_tracks;

    this.sprite = this.createSprite();
    this.collider = this.createCollider();
    this.updateAnimation(this.state, this.dirX, this.dirY);

    this.proximityController = new ActorProximityController(this);
    this.tagController = new ActorTagController(this);
  }

  createSprite() {
    let startTile = this.mapManager.getTileAt(this.x, this.y, [
      this.mapManager.bottomLayer,
      this.mapManager.midLayer,
      this.mapManager.topLayer,
    ]);

    let preset = this.dirY == "up" ? "player_back" : "player_front";

    const depth = this.mapManager.getDepth(startTile);
    let sprite = this.scene.physics.add.sprite(0, 0, preset);
    sprite.setOrigin(0, 1 + SPRITE_OFFSET);
    sprite.body.setImmovable(true);
    sprite.setScale(0.182, 0.137);
    sprite.body.setSize(130, 320);
    sprite.setPosition(startTile.pixelX, startTile.pixelY + depth);
    sprite.setDepth(sprite.y + depth + 1);

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
      this.updateAnimation(state, dir_x, dir_y);
    }

    this.dirX = dir_x;
    this.dirY = dir_y;
    this.state = state;
  }

  updateAnimation(newState, newDirX, newDirY) {
    this.sprite.flipX = newDirX !== "left";

    if (newState === "walk") {
      let anim = newDirY == "up" ? "walk_up" : "walk_down";
      this.sprite.play(anim);
    } else {
      let anim = newDirY == "up" ? "idle_up" : "idle_down";
      this.sprite.play(anim);
    }
  }

  destroy() {
    this.proximityController.destroy();
    this.sprite.destroy();
    this.collider.destroy();
    this.tagController.destroy();
  }
}
