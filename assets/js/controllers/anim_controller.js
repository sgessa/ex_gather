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
    this.direction = 'down';
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
    let newDirection = this.direction;

    if (left.isDown) {
      moved = true;
      newDirection = 'left';
      newState = 'walk';

      this.sprite.flipX = false;
      this.sprite.setVelocityX(-speed);
    } else if (right.isDown) {
      moved = true;
      newDirection = 'right';
      newState = 'walk';

      this.sprite.flipX = true;
      this.sprite.setVelocityX(speed);
    } else if (up.isDown) {
      moved = true;
      newDirection = 'up';
      newState = 'walk';

      this.sprite.setVelocityY(-speed);
    } else if (down.isDown) {
      moved = true;
      newDirection = 'down';
      newState = 'walk';

      this.sprite.setVelocityY(speed);
    }

    if (moved) {
      let anim = newDirection === 'up' ? "walk_up" : "walk_down";
      this.sprite.play(anim, true); // Play up animation
    } else {
      // Keep last direction (e.g., idle_down if last moved down)
      if (this.state == 'walk') {
        let anim = newDirection === 'up' ? "idle_up" : "idle_down";
        newState = 'idle';
        this.sprite.play(anim, true);
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
      newDirection !== this.direction) {

      if (now - this.lastUpdate > 50) {
        this.scene.socketManager.channel.push("player_move", {
          x: this.sprite.x,
          y: this.sprite.y,
          dir: newDirection,
          state: newState
        });

        this.lastPosition = { x: this.sprite.x, y: this.sprite.y };
        this.state = newState;
        this.direction = newDirection;
        this.lastUpdate = now;
      }
    }
  }
}
