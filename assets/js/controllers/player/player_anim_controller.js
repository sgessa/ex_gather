import PlayerMovePacket from "../../packets/player/player_move_packet";

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
    // Use the movement controller's isMoving state
    if (this.player.movementController.isMoving) {
      const dx = this.player.movementController.targetPosition.x - this.player.sprite.x;
      const dy = this.player.movementController.targetPosition.y - this.player.sprite.y;

      // Diagonal movement
      if (Math.abs(dx) > 0.1 && Math.abs(dy) > 0.1) {
        this.state = 'walk';
        this.dirX = dx > 0 ? 'right' : 'left';
        this.dirY = dy > 0 ? 'down' : 'up';
      }
      // Horizontal movement
      else if (Math.abs(dx) > 0.1) {
        this.state = 'walk';
        this.dirX = dx > 0 ? 'right' : 'left';
        this.dirY = 'down'; // Default vertical direction
      }
      // Vertical movement
      else if (Math.abs(dy) > 0.1) {
        this.state = 'walk';
        this.dirY = dy > 0 ? 'down' : 'up';
        this.dirX = 'left'; // Default horizontal direction
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

    const packet = (new PlayerMovePacket()).build(
      this.movementController.sTile.x,
      this.movementController.sTile.y,
      this.dirX,
      this.dirY,
      this.state
    );

    this.scene.socketManager.channel.push("player_move", packet);

    this.lastPos = { x: this.sprite.x, y: this.sprite.y, state: this.state };
  }
}
