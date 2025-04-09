import { TALK_RADIUS, PROXIMITY_OFFSET } from "../../const/player_const";
export default class PlayerProximityController {
  constructor(player) {
    this.player = player;
    this.scene = this.player.scene;
    this.proximityCollider = this.create();
  }

  create() {
    let proximityCollider = this.scene.add.zone(this.player.sprite.x, this.player.sprite.y);
    proximityCollider.player = this.player;

    this.scene.physics.world.enable(proximityCollider);
    proximityCollider.body.setCircle(TALK_RADIUS);
    proximityCollider.setOrigin(TALK_RADIUS - PROXIMITY_OFFSET, TALK_RADIUS + PROXIMITY_OFFSET);
    proximityCollider.body.setAllowGravity(false);

    return proximityCollider;
  }

  handleUpdate() {
    this.proximityCollider.setPosition(this.player.sprite.x, this.player.sprite.y);
    this.proximityCollider.body.u
  }
}