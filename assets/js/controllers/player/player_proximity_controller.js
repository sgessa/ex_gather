import { TALK_RADIUS, PROXIMITY_OFFSET } from "../../const/player_const"

export default class PlayerProximityController {
  constructor(player) {
    this.player = player;
    this.scene = this.player.scene;
    this.collider = this.create();
  }

  create() {
    let collider = this.scene.add.zone(this.player.sprite.x, this.player.sprite.y);
    collider.player = this.player;

    this.scene.physics.world.enable(collider);
    collider.body.setCircle(TALK_RADIUS);
    collider.setOrigin(TALK_RADIUS - PROXIMITY_OFFSET, TALK_RADIUS + PROXIMITY_OFFSET);
    collider.body.setAllowGravity(false);

    return collider;
  }

  handleUpdate() {
    this.collider.setPosition(this.player.sprite.x, this.player.sprite.y);
  }
}
