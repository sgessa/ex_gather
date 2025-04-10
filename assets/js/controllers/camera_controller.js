export default class CameraController {
  constructor(scene, target) {
    this.scene = scene;
    this.target = target;
    this.camera = scene.cameras.main;

    // Camera states
    this.followingTarget = true;
    this.manualControlActive = false;
    this.originalFollowOffset = this.camera.followOffset.clone();

    // Movement properties
    this.moveSpeed = 5;
    this.lastPlayerPosition = { x: target.x, y: target.y };
    this.movementThreshold = 5;

    // Zoom properties
    this.zoomLevel = 1.0;
    this.minZoom = 0.5;
    this.maxZoom = 2.0;
    this.zoomStep = 0.1;
    this.zoomDuration = 200;

    // Initialize camera to follow player
    this.camera.startFollow(this.target);
    this.camera.setFollowOffset(
      this.originalFollowOffset.x,
      this.originalFollowOffset.y
    );

    this.initControls();
  }
  initControls() {
    // Initialize keyboard controls
    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Mouse wheel zoom
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.handleZoom(deltaY);
    });
  }

  activateManualControl() {
    if (!this.manualControlActive) {
      this.manualControlActive = true;
      this.followingTarget = false;
      this.camera.stopFollow();
      // Store current player position when manual control starts
      this.lastPlayerPosition = { x: this.target.x, y: this.target.y };
    }
  }

  returnToTarget() {
    this.manualControlActive = false;
    this.followingTarget = true;
    this.camera.startFollow(this.target);
    this.camera.setFollowOffset(
      this.originalFollowOffset.x,
      this.originalFollowOffset.y
    );
    // Update last known position after returning
    this.lastPlayerPosition = { x: this.target.x, y: this.target.y };
  }

  handleZoom(deltaY) {
    const zoomDirection = Math.sign(deltaY) * -1;
    const newZoom = Phaser.Math.Clamp(
      this.zoomLevel + (this.zoomStep * zoomDirection),
      this.minZoom,
      this.maxZoom
    );

    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.camera.zoomTo(this.zoomLevel, this.zoomDuration);
    }
  }

  update(delta) {
    this.handleCameraMovement(delta);
    this.checkPlayerMovement();
  }

  handleCameraMovement(delta) {
    if (this.keys.up.isDown || this.keys.down.isDown ||
        this.keys.left.isDown || this.keys.right.isDown) {
      this.activateManualControl();

      const moveSpeed = this.moveSpeed * (delta / 16);

      if (this.keys.up.isDown) this.camera.scrollY -= moveSpeed;
      if (this.keys.down.isDown) this.camera.scrollY += moveSpeed;
      if (this.keys.left.isDown) this.camera.scrollX -= moveSpeed;
      if (this.keys.right.isDown) this.camera.scrollX += moveSpeed;
    }
  }

  checkPlayerMovement() {
    if (!this.manualControlActive) return;

    // Calculate distance moved since last check
    const dx = Math.abs(this.target.x - this.lastPlayerPosition.x);
    const dy = Math.abs(this.target.y - this.lastPlayerPosition.y);

    // Check if player has moved beyond threshold
    if (dx > this.movementThreshold || dy > this.movementThreshold) {
      this.returnToTarget();
    }
  }
}
