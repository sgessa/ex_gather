import CurrentPlayerAnimator from "./current_player_animator.js"

export default class CurrentPlayer {
  constructor(scene, channel, userInfo) {
    this.userId = userInfo.id;
    this.scene = scene;
    this.channel = channel;

    this.player = this.scene.physics.add.sprite(100, 100, "player");
    this.setName(userInfo.name);
    this.animator = new CurrentPlayerAnimator(this.scene, this.player);

    this.animator.handleCreate();
  }

  handleUpdate() {
    this.animator.handleUpdate();

    // Sync the label's position with the player
    this.name.setPosition(this.player.x, this.player.y - 20);
  }

  setName(userName) {
    // Create a text object to display the player's name
    this.name = this.scene.add.text(
      this.player.x,
      this.player.y - 20, // Adjust for vertical offset
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
