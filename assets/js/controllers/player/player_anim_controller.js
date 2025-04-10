export default class PlayerAnimController {
  constructor(player) {
    this.player = player;
    this.movementController = this.player.movementController;
    this.scene = this.player.scene;
    this.sprite = this.player.sprite;
    this.channel = this.player.channel;

    this.anims = this.scene.anims;

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
      frameRate: 5,
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
    if (this.movementController.path.length > 0) {
      const nextPoint = this.movementController.path[0];
      const dx = nextPoint.x - this.movementController.sTile.x;
      const dy = nextPoint.y - this.movementController.sTile.y;

      // Diagonal movement
      if (dx !== 0 && dy !== 0) {
        this.state = 'walk';
        this.dirX = dx > 0 ? 'right' : 'left';
        this.dirY = dy > 0 ? 'down' : 'up';
        // You might want a special diagonal animation here
      }
      // Existing horizontal/vertical movement
      else if (dx !== 0) {
        this.state = 'walk';
        this.dirX = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        this.state = 'walk';
        this.dirY = dy > 0 ? 'down' : 'up';
      }
    } else {
      this.setIdle();
    }

    this.updateAnimation();
    this.broadcastMovement();
  }

  setIdle() {
    this.state = 'idle';
  }

  updateAnimation() {
    const animKey = `${this.state}_${this.dirY}`;
    this.sprite.play(animKey, true);
    this.sprite.flipX = this.dirX === 'right';
  }

  broadcastMovement() {
    // Only send updates if state or direction changed

    if (this.lastPos.x == this.sprite.x && this.lastPos.y == this.sprite.y && this.lastPos.state == this.state) return;

    console.log('LAST', this.lastPos.x, this.lastPos)
    console.log('moving');

    this.scene.socketManager.channel.push("player_move", {
      x: this.movementController.sTile.x,
      y: this.movementController.sTile.y,
      dir_x: this.dirX,
      dir_y: this.dirY,
      state: this.state
    });

    this.lastPos = { x: this.sprite.x, y: this.sprite.y, state: this.state };
  }
}
