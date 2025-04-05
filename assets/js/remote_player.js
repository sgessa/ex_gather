export default class RemotePlayer {
  constructor(scene, username, x, y, dir, state) {
    this.sprite = scene.physics.add.sprite(x, y, "player");
    this.sprite.body.setImmovable(true);
    this.direction = dir;
    this.state = state;

    this.collider = scene.physics.add.collider(
      scene.currentPlayer.sprite,
      this.sprite,
      null,
      null,
      this
    );

    this.name = scene.add.text(x, y - 20, username, {
      fontSize: "16px",
      color: "#FFFF00",
      stroke: "#000000",
      strokeThickness: 2,
    });

    this.name.setOrigin(0.5, 1);

    // Update position
    this.sprite.setPosition(x, y);
    this.name.setPosition(x, y - 20);
  }

  handleUpdate() {
    // Sync the label's position with the player
    this.name.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  destroy() {
    this.sprite.destroy();
    this.collider.destroy();
    this.name.destroy();
  }
}
