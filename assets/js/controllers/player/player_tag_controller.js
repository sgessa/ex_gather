import { TAG_STYLE } from "../../const/player_const";

export default class PlayerTagController {
  constructor(player) {
    this.player = player;
    this.scene = this.player.scene;
    this.name = null;

    this.create(player.username);
  }

  create(username) {
    // Create a text object to display the player's name
    this.name = this.scene.add.text(0, 0, username, TAG_STYLE);

    this.name.setOrigin(0.5, 1);
    this.name.setDepth(this.player.sprite.depth);
    this.handleUpdate();
  }

  handleUpdate() {
    this.name.setPosition(
      this.player.sprite.x + (this.player.sprite.displayWidth * 0.5),
      this.player.sprite.y - this.player.sprite.displayHeight
    );
  }
}