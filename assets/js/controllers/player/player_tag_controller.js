import { TAG_STYLE } from "../../const/player_const";

export default class PlayerTagController {
  constructor(player) {
    this.player = player;
    this.scene = this.player.scene;
    this.name = null;
    this.background = null;

    this.create(player.username);
  }

  create(username) {
    this.name = this.scene.add.text(0, 0, username, {
      ...TAG_STYLE,
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
      padding: { x: 10, y: 5 }
    });

    this.name.setOrigin(0.5, 1 + 0.15);

    // Create a container to hold both elements
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(2000);

    // Create a rounded rectangle background
    const textWidth = this.name.width + 8;
    const textHeight = this.name.height + 6;
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);

    this.background.fillRoundedRect(
      -(textWidth / 2),
      -(textHeight - 8),
      textWidth,
      textHeight - 20,
      5
    );

    this.background.lineStyle(2, 0xffffff, 0.8);

    this.background.strokeRoundedRect(
      -(textWidth / 2),
      -(textHeight - 8),
      textWidth,
      textHeight - 20,
      5
    );

    this.container.add([this.background, this.name]);
  }

  handleUpdate() {
    const xPos = this.player.sprite.x + (this.player.sprite.displayWidth * 0.5);
    const yPos = this.player.sprite.y - this.player.sprite.displayHeight;

    this.container.setPosition(xPos, yPos);
  }

  destroy() {
    this.name.destroy();
    this.background.destroy();
    this.container.destroy();
  }
}
