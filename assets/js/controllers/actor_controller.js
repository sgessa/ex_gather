import TALK_RADIUS from "../const/rtc";
export default class ActorController {
  constructor(scene, id, username, x, y, dirX, dirY, state) {
    this.scene = scene;

    let preset = dirY == "up" ? "player_back" : "player_front";
    this.sprite = this.scene.physics.add.sprite(x, y, preset);
    this.sprite.body.setImmovable(true);
    this.sprite.setScale(0.182, 0.137);
    this.sprite.body.setSize(130, 320);
    this.sprite.setPosition(x, y);

    this.dirX = dirX;
    this.dirY = dirY;
    this.id = id;
    this.username = username;
    this.state = state;

    // Initialize collisions with player
    this.inProximity = false;
    this.proximityCollider = this.scene.add.zone(x, y);
    this.proximityCollider.actor = this;
    this.scene.physics.world.enable(this.proximityCollider);
    this.proximityCollider.body.setCircle(TALK_RADIUS);
    this.proximityCollider.setOrigin(TALK_RADIUS, TALK_RADIUS);
    this.proximityCollider.body.setAllowGravity(false);

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
    this.proximityCollider.setPosition(this.sprite.x, this.sprite.y);
    this.updateProximityState();

    // Sync the label's position with the player
    this.name.setPosition(this.sprite.x, this.sprite.y - 20);
  }

  onProximityEnter() {
    this.inProximity = true;
    this.scene.rtcManager.videoPlayersManager.toggle(this);
  }

  onProximityExit() {
    this.inProximity = false;
    this.scene.rtcManager.videoPlayersManager.toggle(this);
  }

  updateProximityState() {
    const wasInProximity = this.inProximity;
    let inProximity = this.scene.physics.world.overlap(
      this.scene.player.proximityCollider,
      this.proximityCollider
    );

    if (wasInProximity && !inProximity) {
      this.onProximityExit();
    } else if (!wasInProximity && inProximity) {
      this.onProximityEnter();
    }
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
    this.proximityCollider.destroy();
    this.name.destroy();
  }
}
