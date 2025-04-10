import { TALK_RADIUS, PROXIMITY_OFFSET } from "../../const/player_const"

export default class ActorProximityController {
  constructor(actor) {
    this.actor = actor;
    this.scene = actor.scene;

    this.inProximity = false;
    this.proximityCollider = this.create();
  }

  create() {
    // Initialize collisions with player
    let proximityCollider = this.scene.add.zone(this.actor.sprite.x, this.actor.sprite.y);
    proximityCollider.actor = this.actor;
    this.scene.physics.world.enable(proximityCollider);

    proximityCollider.body.setCircle(TALK_RADIUS);
    proximityCollider.setOrigin(TALK_RADIUS - PROXIMITY_OFFSET, TALK_RADIUS + PROXIMITY_OFFSET);
    proximityCollider.body.setAllowGravity(false);

    return proximityCollider;
  }

  handleUpdate() {
    if (!this.scene.player.proximityController || !this.proximityCollider) return;

    this.proximityCollider.setPosition(this.actor.sprite.x, this.actor.sprite.y);

    const wasInProximity = this.inProximity;
    let inProximity = this.scene.physics.world.overlap(
      this.scene.player.proximityController.proximityCollider,
      this.proximityCollider
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
    this.proximityCollider.destroy();
  }
}
