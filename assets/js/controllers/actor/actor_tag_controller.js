import { TAG_STYLE } from "../../const/actor_const"

export default class ActorTagController {
  constructor(actor) {
    this.actor = actor;
    this.scene = actor.scene;
    this.create();
  }

  create() {
    this.name = this.scene.add.text(0, 0, this.actor.username, {
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

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(2000 - 1);

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
    const xPos = this.actor.sprite.x + (this.actor.sprite.displayWidth * 0.5);
    const yPos = this.actor.sprite.y - this.actor.sprite.displayHeight;

    this.container.setPosition(xPos, yPos);
  }

  destroy() {
    this.name.destroy();
    this.background.destroy();
    this.container.destroy();
  }
}
