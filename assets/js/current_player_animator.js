export default class CurrentPlayerAnimator {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.anims = scene.anims;
    this.cursors = scene.input.keyboard.createCursorKeys();
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
    this.player.play("idle_down");
  }

  handleUpdate() {
  	const { left, right, up, down } = this.cursors;
  	const speed = 160;

  	// Reset velocity
  	this.player.setVelocity(0);

  	if (left.isDown) {
    	this.player.setVelocityX(-speed);
    	this.player.play("walk_left", true); // Play left animation
  	}	else if (right.isDown) {
    	this.player.setVelocityX(speed);
    	this.player.play("walk_right", true); // Play right animation
  	}

  	// --- Vertical Movement ---
  	if (up.isDown) {
    	this.player.setVelocityY(-speed);
    	this.player.play("walk_up", true); // Play up animation
  	}	else if (down.isDown) {
    	this.player.setVelocityY(speed);
    	this.player.play("walk_down", true); // Play down animation
  	}

  	// --- Return to Idle When No Keys Pressed ---
  	if (!left.isDown && !right.isDown && !up.isDown && !down.isDown) {
    	// Keep last direction (e.g., idle_down if last moved down)
    	const currentAnim = this.player.anims.currentAnim.key;

    	if (currentAnim.startsWith("walk_")) {
      	this.player.play(`idle_${currentAnim.split("_")[1]}`, true);
    	}
  	}
  }
}
