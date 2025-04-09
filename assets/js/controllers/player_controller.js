import AnimController from "./anim_controller.js"
import TALK_RADIUS from "../const/rtc";

export default class PlayerController {
  constructor(scene, channel, userInfo) {
    this.id = userInfo.id;
    this.scene = scene;
    this.channel = channel;
    this.username = userInfo.username;

    this.mapManager = this.scene.mapManager;

    this.sTile = this.scene.mapManager.bottomLayer.getTileAt(4, 16);
    this.dTile = null;

    this.marker = this.scene.add.sprite(100, 100, "marker");
    this.marker.setOrigin(0, 1);

    this.sprite = this.scene.physics.add.sprite(
      this.sTile.pixelX,
      this.sTile.pixelY + this.mapManager.getDepth(this.sTile),
      "player_front"
    );

    this.sprite.setOrigin(0, 1);
    this.sprite.setScale(0.182, 0.137);

    // Set the body size smaller than the sprite for better collision detection
    this.sprite.body.setSize(130, 320);

    this.proximityCollider = this.scene.add.zone(this.sprite.x, this.sprite.y);
    this.proximityCollider.player = this;
    this.scene.physics.world.enable(this.proximityCollider);
    this.proximityCollider.body.setCircle(TALK_RADIUS);
    this.proximityCollider.setOrigin(TALK_RADIUS, TALK_RADIUS);
    this.proximityCollider.body.setAllowGravity(false);

    // Visual debug
    this.scene.physics.world.createDebugGraphic();

    this.setName(userInfo.username);
    this.animator = new AnimController(this.scene, this);

    this.scene.cameras.main.startFollow(this.sprite);

    // this.animator.handleCreate();

    this.path = [];
    this.frameTime = 0;
    this.UPDATE_DELTA = 130;

    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp);
  }

  update(time, delta) {
    this.proximityCollider.setPosition(this.sprite.x, this.sprite.y);

    // Sync movements
    // this.animator.handleUpdate();
    this.handleMovement(time, delta);

    // For isometric depth sorting
    const depthValue = this.sprite.y + this.mapManager.getDepth(this.sTile);
    this.sprite.setDepth(depthValue);
    this.name.setDepth(depthValue + 1);
    this.updateNamePosition();
  }

  handleMovement(time, delta) {
    this.frameTime += delta;

    if (this.frameTime > this.UPDATE_DELTA) {
      this.frameTime = 0;

      if (this.path.length > 0) {
        const point = this.path.shift();

        const tile = this.mapManager.getTileAt(point.x, point.y, [
          this.mapManager.bottomLayer,
          this.mapManager.midLayer,
          this.mapManager.topLayer,
        ]);

        if (tile) {
          this.sTile = tile;
          this.sprite.setPosition(tile.pixelX, tile.pixelY + this.mapManager.getDepth(tile));
        }
      }
    }
  }

  setName(userName) {
    // Create a text object to display the player's name
    this.name = this.scene.add.text(
      0, 0,
      userName,
      {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 2,
      }
    );

    // Make the text follow the player
    this.name.setOrigin(0.5, 1);
    this.name.setDepth(this.sprite.depth);
    this.updateNamePosition();
  }

  updateNamePosition() {
    this.name.setPosition(
      this.sprite.x + (this.sprite.displayWidth * 0.5),
      this.sprite.y - this.sprite.displayHeight
    );
  }

  onPointerMove = (e) => {
    const px = this.scene.cameras.main.worldView.x + e.x;
    const py = this.scene.cameras.main.worldView.y + e.y + 42;

    const tile = this.mapManager.getTile(
      px,
      py,
      [
        this.mapManager.bottomLayer,
        this.mapManager.midLayer,
        this.mapManager.topLayer,
      ]
    );

    if (tile && tile.properties.walkable) {
      this.marker.setPosition(
        tile.pixelX,
        tile.pixelY + this.mapManager.getDepth(tile)
      );

      this.marker.setDepth(tile.pixelY + this.mapManager.getDepth(tile) + 1);

      this.marker.visible = true;
      this.dTile = tile;
    } else {
      this.marker.visible = false;
    }
  };

  onPointerUp = (e) => {
    if (this.marker.visible) {
      this.mapManager.aStar.findPath(
        this.sTile.x,
        this.sTile.y,
        this.dTile.x,
        this.dTile.y,
        (path) => {
          if (path === null) {
            console.warn("Path was not found.");
          } else {
            this.path = path;
          }
        }
      );
      this.mapManager.aStar.calculate();
    }
  };
}
