import { TAG_STYLE } from "../../const/actor_const"

export default class ActorTagController {
  constructor(actor) {
    this.actor = actor;
    this.scene = actor.scene;
    this.name = this.create();
  }

  create() {
    let name = this.scene.add.text(this.actor.x, this.actor.y - 20, this.actor.username, TAG_STYLE);
    name.setOrigin(0.5, 1);
    name.setPosition(this.actor.x, this.actor.y - 20);

    return name;
  }

  handleUpdate() {
    this.name.setPosition(this.actor.sprite.x, this.actor.sprite.y - 20);
  }

  destroy() {
    this.name.destroy();
  }
}