export default class ActorController {
  constructor(scene, username, x, y, dirX, dirY, state) {
    this.scene = scene;

    let preset = dirY == "up" ? "player_back" : "player_front";
    this.sprite = this.scene.physics.add.sprite(x, y, preset);
    this.sprite.body.setImmovable(true);
    this.sprite.setScale(0.182, 0.137);
    this.sprite.body.setSize(130, 320);
    this.sprite.setPosition(x, y);

    this.dirX = dirX;
    this.dirY = dirY;
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
    this.name.setPosition(x, y - 20);
  }

  update() {
    // Sync the label's position with the player
    this.name.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  move(data) {
    const { id, x, y, dir_x, dir_y, state } = data;

    // Apply tween for smooth movement
    this.scene.tweens.add({
      targets: this.sprite,
      x: x,
      y: y,
      duration: 100, // Matches network update rate
      ease: 'Linear'
    });

    // Update animation
    if (this.state !== state || this.dirX !== dir_x || this.dirY !== dir_y) {
      this.sprite.flipX = dir_x !== "left";

      if (state === "walk") {
        let anim = dir_y == "up" ? "walk_up" : "walk_down";
        this.sprite.play(anim);
      } else {
        let anim = dir_y == "up" ? "idle_up" : "idle_down";
        this.sprite.play(anim);
      }
    }

    this.dirX = dir_x;
    this.dirY = dir_y;
    this.state = state;
  }

  destroy() {
    this.sprite.destroy();
    this.collider.destroy();
    this.name.destroy();
  }
}
