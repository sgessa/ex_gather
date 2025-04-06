export default class AnimController {
  constructor(scene, currentPlayer) {
    this.scene = scene;
    this.sprite = currentPlayer.sprite;
    this.channel = currentPlayer.channel;
    this.anims = scene.anims;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
    this.lastUpdate = 0;
    this.state = 'idle';
    this.dirX = 'left';
    this.dirY = 'down';
  }

  handleCreate() {
    this.anims.create({
      key: "idle_down",
      frames: this.anims.generateFrameNumbers("player_front", { start: 0, end: 1 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "idle_up",
      frames: this.anims.generateFrameNumbers("player_back", { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("player_front", { start: 9, end: 12 }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("player_back", { start: 5, end: 8 }),
      frameRate: 8,
      repeat: -1
    });

    this.sprite.play("idle_down");
  }

  handleUpdate() {
    const { left, right, up, down } = this.cursors;
    const speed = 160;

    // Reset velocity
    this.sprite.setVelocity(0);

    // Movement logic
    let moved = false;
    let newState = this.state;
    let newDirX = this.dirX;
    let newDirY = this.dirY;

    if (left.isDown) {
      moved = true;
      newDirX = 'left';
      newState = 'walk';

      this.sprite.flipX = false;
      this.sprite.setVelocityX(-speed);
    } else if (right.isDown) {
      moved = true;
      newDirX = 'right';
      newState = 'walk';

      this.sprite.flipX = true;
      this.sprite.setVelocityX(speed);
    }

    if (up.isDown) {
      moved = true;
      newDirY = 'up';
      newState = 'walk';

      this.sprite.setVelocityY(-speed);
    } else if (down.isDown) {
      moved = true;
      newDirY = 'down';
      newState = 'walk';

      this.sprite.setVelocityY(speed);
    }

    if (moved) {
      this.sprite.play(`walk_${newDirY}`, true);
    } else {
      newState = "idle";

      // Keep last direction (e.g., idle_down if last moved down)
      if (this.state === "walk") {
        this.sprite.play(`idle_${newDirY}`, true);
      }
    }

    // Only send updates if:
    // 1. Player moved significantly (>5px)
    // 2. Animation/direction changed
    // 3. Throttled to 50ms
    const now = Date.now();

    const distanceMoved = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y,
      this.lastPosition.x, this.lastPosition.y
    );

    if ((moved && distanceMoved > 5) ||
      newState !== this.state ||
      newDirX !== this.dirX ||
      newDirY !== this.dirY) {

      if (now - this.lastUpdate > 50) {
        this.scene.socketManager.channel.push("player_move", {
          x: this.sprite.x,
          y: this.sprite.y,
          dir_x: newDirX,
          dir_y: newDirY,
          state: newState
        });

        this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
        this.state = newState;
        this.dirX = newDirX;
        this.dirY = newDirY;
        this.lastUpdate = now;
      }
    }
  }
}
