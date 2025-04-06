export default class ActorController {
  constructor(scene, username, x, y, dir, state) {
    let anim = dir == "up" ? "player_back" : "player_front";

    this.scene = scene;
    this.sprite = this.scene.physics.add.sprite(x, y, anim);
    this.sprite.body.setImmovable(true);
    this.sprite.setScale(64 / 350, 48 / 350);

    this.direction = dir;
    this.state = state;

    this.collider = this.scene.physics.add.collider(
      this.scene.player.sprite,
      this.sprite,
      null,
      null,
      this
    );

    this.name = this.scene.add.text(x, y - 20, username, {
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

  update() {
    // Sync the label's position with the player
    this.name.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  move(data) {
    const { id, x, y, dir, state } = data;

    // Apply tween for smooth movement
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: 100, // Matches network update rate
      ease: 'Linear'
    });

    // Update animation
    if (this.state !== state || this.direction !== dir) {
      this.sprite.flipX = dir !== "left";

      if (state === "walk") {
        let anim = dir == "up" ? "walk_up" : "walk_down";
        this.sprite.play(anim);
      } else {
        let anim = dir == "up" ? "idle_up" : "idle_down";
        this.sprite.play(anim);
      }
    }

    this.direction = dir;
    this.state = state;
  }

  destroy() {
    this.sprite.destroy();
    this.collider.destroy();
    this.name.destroy();
  }
}
