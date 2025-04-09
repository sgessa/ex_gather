import { TAG_STYLE } from "../../const/actor_const"

export default class ActorTagController {
  constructor(actor) {
    this.actor = actor;
    this.scene = actor.scene;
    this.name = this.create();
  }

  create() {
    let name = this.scene.add.text(0, 0, this.actor.username, TAG_STYLE);

    name.setDepth(2000);
    name.setOrigin(0.5, 1);

    return name;
  }

  handleUpdate() {
    this.name.setPosition(
      this.actor.sprite.x + (this.actor.sprite.displayWidth * 0.5),
      this.actor.sprite.y - this.actor.sprite.displayHeight
    );
  }

  destroy() {
    this.name.destroy();
  }
}
