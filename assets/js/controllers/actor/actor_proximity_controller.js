import { TALK_RADIUS, PROXIMITY_OFFSET } from "../../const/player_const"

export default class ActorProximityController {
  constructor(actor) {
    this.actor = actor;
    this.scene = actor.scene;

    this.inProximity = false;
    this.collider = this.create();
  }

  create() {
    // Initialize collisions with player
    let collider = this.scene.add.zone(this.actor.sprite.x, this.actor.sprite.y);
    collider.actor = this.actor;
    this.scene.physics.world.enable(collider);

    collider.body.setCircle(TALK_RADIUS);
    collider.setOrigin(TALK_RADIUS - PROXIMITY_OFFSET, TALK_RADIUS + PROXIMITY_OFFSET);
    collider.body.setAllowGravity(false);

    return collider;
  }

  handleUpdate() {
    if (!this.scene.player.proximityController || !this.collider) return;

    this.collider.setPosition(this.actor.sprite.x, this.actor.sprite.y);

    const wasInProximity = this.inProximity;
    let inProximity = this.scene.physics.world.overlap(
      this.scene.player.proximityController.collider,
      this.collider
    );

    if (wasInProximity && !inProximity) {
      this.onProximityExit();
    } else if (!wasInProximity && inProximity) {
      this.onProximityEnter();
    }
  }

  onProximityEnter() {
    this.inProximity = true;
    this.scene.rtcManager.videoPlayersManager.toggle(this.actor);
  }

  onProximityExit() {
    this.inProximity = false;
    this.scene.rtcManager.videoPlayersManager.toggle(this.actor);
  }

  destroy() {
    if (this.inProximity) this.onProximityExit();
    this.collider.destroy();
  }
}
