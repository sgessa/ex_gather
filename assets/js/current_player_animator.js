export default class CurrentPlayerAnimator {
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
    // Idle: Single frame (frame 1 = standing up)
    this.anims.create({
      key: "idle_up",
      frames: [{ key: "player", frame: 10 }],
      frameRate: 5,
      repeat: -1
    });

    // Idle: Single frame (frame 1 = standing down)
    this.anims.create({
      key: "idle_down",
      frames: [{ key: "player", frame: 1 }],
      frameRate: 5,
      repeat: -1
    });

    // Idle: Single frame (frame 1 = standing left)
    this.anims.create({
      key: "idle_left",
      frames: [{ key: "player", frame: 4 }],
      frameRate: 5,
      repeat: -1
    });

    // Idle: Single frame (frame 1 = standing right)
    this.anims.create({
    key: "idle_right",
      frames: [{ key: "player", frame: 7 }],
      frameRate: 5,
      repeat: -1
    });

    // Walk Down: Frames 0, 1, 2 (loop)
    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 2 }),
      frameRate: 8,
      repeat: -1
    });

    // Walk Left: Frames 3, 4, 5 (loop)
    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("player", { start: 3, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // Walk Right: Frames 6, 7, 8 (loop)
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("player", { start: 6, end: 8 }),
      frameRate: 8,
      repeat: -1
    });

    // Walk Up: Frames 9, 10, 11 (loop)
    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("player", { start: 9, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    // Default: Idle (facing down)
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
    	this.sprite.setVelocityX(-speed);
    	this.sprite.play("walk_left", true); // Play left animation
    	moved = true;
    	newDirection = 'left';
      newState = 'walk';
  	}	else if (right.isDown) {
    	this.sprite.setVelocityX(speed);
    	this.sprite.play("walk_right", true); // Play right animation
    	moved = true;
    	newDirection = 'right';
      newState = 'walk';
  	}

  	// --- Vertical Movement ---
  	if (up.isDown) {
    	this.sprite.setVelocityY(-speed);
    	this.sprite.play("walk_up", true); // Play up animation
    	moved = true;
    	newDirection = 'up';
      newState = 'walk';
  	}	else if (down.isDown) {
    	this.sprite.setVelocityY(speed);
    	this.sprite.play("walk_down", true); // Play down animation
    	moved = true;
    	newDirection = 'down';
      newState = 'walk';
  	}

  	// --- Return to Idle When No Keys Pressed ---
  	if (!moved) {
    	// Keep last direction (e.g., idle_down if last moved down)
    	if (this.state == 'walk') {
    	  newState = 'idle';
      	this.sprite.play(`idle_${newDirection}`, true);
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
        this.channel.push("player_move", {
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
