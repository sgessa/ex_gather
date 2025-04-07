import AnimController from "./anim_controller.js"

export default class PlayerController {
  constructor(scene, channel, userInfo) {
    this.userId = userInfo.id;
    this.scene = scene;
    this.channel = channel;

    this.sprite = this.scene.physics.add.sprite(100, 100, "player_front");
    this.sprite.setScale(64 / 350, 48 / 350);

    this.setName(userInfo.username);
    this.animator = new AnimController(this.scene, this);

    this.scene.cameras.main.startFollow(this.sprite);

    this.animator.handleCreate();
  }

  update() {
    this.animator.handleUpdate();

    // Sync the label's position with the player
    this.name.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  setName(userName) {
    // Create a text object to display the player's name
    this.name = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 20, // Adjust for vertical offset
      userName,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 2,
      }
    );

    // Make the text follow the player
    this.name.setOrigin(0.5, 1);
  }
}
