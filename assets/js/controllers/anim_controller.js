export default class AnimController {
  constructor(scene, currentPlayer) {
    this.scene = scene;
    this.sprite = currentPlayer.sprite;
    this.channel = currentPlayer.channel;
    this.anims = scene.anims;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.lastUpdate = 0;
    this.state = 'idle';
    this.dirX = 'left';
    this.dirY = 'down';
    this.lastPos = { x: this.sprite.x, y: this.sprite.y, state: this.state };
    // For click movements
    this.moveSpeed = 160;
    this.targetPosition = null; // For click movement
    this.lastBroadcastTime = 0;
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
    this.sprite.setVelocity(0);

    if (this.isKeyboardMoving()) {
      this.handleKeyboardMovement();
    } else if (this.targetPosition) {
      this.handleClickMovement();
    } else {
      this.setIdle();
    }

    this.broadcastMovement();
  }

  handleClickMovement() {
    const dx = this.targetPosition.x - this.sprite.x;
    const dy = this.targetPosition.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      // Reached target
      this.targetPosition = null;
      this.setIdle();
    } else {
      // Move toward target
      const angle = Math.atan2(dy, dx);
      this.sprite.setVelocity(
        Math.cos(angle) * this.moveSpeed,
        Math.sin(angle) * this.moveSpeed
      );

      // Update animation directly without going through handleUpdate
      this.setMovementFromClick(dx, dy);
    }
  }

  handleKeyboardMovement() {
    // Reset target position when using keyboard
    this.targetPosition = null;

    this.state = 'walk';

    const { left, right, up, down } = this.cursors;

    if (left.isDown) {
      this.dirX = 'left';
      this.sprite.flipX = false;
      this.sprite.setVelocityX(-this.moveSpeed);
    } else if (right.isDown) {
      this.dirX = 'right';
      this.sprite.flipX = true;
      this.sprite.setVelocityX(this.moveSpeed);
    }

    if (up.isDown) {
      this.dirY = 'up';
      this.sprite.setVelocityY(-this.moveSpeed);
    } else if (down.isDown) {
      this.dirY = 'down';
      this.sprite.setVelocityY(this.moveSpeed);
    }

    this.sprite.play(`walk_${this.dirY}`, true);
  }

  isKeyboardMoving() {
    return this.cursors.left.isDown || this.cursors.right.isDown ||
      this.cursors.up.isDown || this.cursors.down.isDown;
  }

  setMovementFromClick(dx, dy) {
    // Calculate the absolute values for comparison
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine if movement is more horizontal or vertical
    const isPrimaryHorizontal = absDx > absDy * 1.5; // 1.5:1 ratio threshold
    const isPrimaryVertical = absDy > absDx * 1.5;

    if (isPrimaryHorizontal) {
      // Clearly horizontal movement
      this.dirX = dx > 0 ? 'right' : 'left';
      this.dirY = 'down'; // Default vertical direction
    } else if (isPrimaryVertical) {
      // Clearly vertical movement
      this.dirY = dy > 0 ? 'down' : 'up';
      // Maintain current horizontal direction
    } else {
      // Diagonal movement - combine directions
      this.dirX = dx > 0 ? 'right' : 'left';
      this.dirY = dy > 0 ? 'down' : 'up';

      // For diagonals, prioritize the more dominant axis
      if (absDx > absDy) {
        this.dirY = 'down'; // Flatten the diagonal slightly
      }
    }

    this.state = 'walk';
    this.updateAnimation();
  }

  setIdle() {
    this.state = 'idle';
    this.updateAnimation();
  }

  updateAnimation() {
    const animKey = `${this.state}_${this.dirY}`;
    this.sprite.play(animKey, true);
    this.sprite.flipX = this.dirX === 'right';
  }

  broadcastMovement() {
    // Only send updates if state or direction changed
    const now = Date.now();

    if (this.lastPos.state !== this.state ||
      this.lastPos.x !== this.sprite.x ||
      this.lastPos.y !== this.sprite.y) {
        this.scene.socketManager.channel.push("player_move", {
          x: this.sprite.x,
          y: this.sprite.y,
          dir_x: this.dirX,
          dir_y: this.dirY,
          state: this.state
        });
    }

    this.lastPos = { x: this.sprite.x, y: this.sprite.y, state: this.state };
  }
}
