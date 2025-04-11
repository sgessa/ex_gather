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
    this.minZoom = 0.3;
    this.maxZoom = 3.0;
    this.zoomStep = 0.1;
    this.lastZoomTime = 0;
    this.zoomDebounce = 50; // ms between zoom actions

    // Initialize camera to follow player
    this.camera.startFollow(this.target);
    this.camera.setFollowOffset(
      this.originalFollowOffset.x,
      this.originalFollowOffset.y
    );

    this.initControls();
  }

  initControls() {
    // Replace the keyboard.addKeys approach with event listeners
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Track key states without preventing default behavior
    const onKey = (isDown) => (event) => {
      // Only process if we're not in a text input
      const activeElement = document.activeElement;
      const inputFocused = activeElement &&
                         (activeElement.tagName === 'INPUT' ||
                          activeElement.tagName === 'TEXTAREA');

      switch(event.key.toLowerCase()) {
        case 'w':
          this.keys.up = isDown && !inputFocused;
          if (isDown && !inputFocused) event.preventDefault();
          break;
        case 's':
          this.keys.down = isDown && !inputFocused;
          if (isDown && !inputFocused) event.preventDefault();
          break;
        case 'a':
          this.keys.left = isDown && !inputFocused;
          if (isDown && !inputFocused) event.preventDefault();
          break;
        case 'd':
          this.keys.right = isDown && !inputFocused;
          if (isDown && !inputFocused) event.preventDefault();
          break;
      }
    };

    // Use window events instead of Phaser's keyboard system
    window.addEventListener('keydown', onKey(true));
    window.addEventListener('keyup', onKey(false));

    // Clean up on scene destruction
    this.scene.events.once('destroy', () => {
      window.removeEventListener('keydown', onKey(true));
      window.removeEventListener('keyup', onKey(false));
    });

    // Wheel event with debouncing
    this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const now = Date.now();
      if (now - this.lastZoomTime < this.zoomDebounce) return;
      this.lastZoomTime = now;

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
    // Robust direction detection with fallback
    let zoomDirection;

    if (typeof deltaY === 'number') {
      zoomDirection = deltaY > 0 ? -1 : 1;
    } else {
      // Fallback for unusual cases
      zoomDirection = deltaY.deltaY > 0 ? -1 : 1;
    }

    // Calculate new zoom level with bounds checking
    const newZoom = Phaser.Math.Clamp(
      this.zoomLevel + (this.zoomStep * zoomDirection),
      this.minZoom,
      this.maxZoom
    );

    // Only update if zoom actually changed
    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;

      // Use zoomTo for smoother transitions (optional)
      this.camera.zoomTo(this.zoomLevel, 100);
    }
  }

  update(delta) {
    this.handleCameraMovement(delta);
    this.checkPlayerMovement();
  }

  handleCameraMovement(delta) {
    if (this.keys.up || this.keys.down || this.keys.left || this.keys.right) {
      this.activateManualControl();

      const moveSpeed = this.moveSpeed * (delta / 16);

      if (this.keys.up) this.camera.scrollY -= moveSpeed;
      if (this.keys.down) this.camera.scrollY += moveSpeed;
      if (this.keys.left) this.camera.scrollX -= moveSpeed;
      if (this.keys.right) this.camera.scrollX += moveSpeed;
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
