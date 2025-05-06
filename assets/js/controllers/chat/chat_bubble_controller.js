export default class ChatBubbleController {
  constructor(chatManager, actor, message) {
    this.chatManager = chatManager;
    this.scene = this.chatManager.scene;

    this.actor = actor;
    this.message = message;
    this.container = this.create();
  }

  create() {
    if (!this.actor || !this.message) return;

    // Create container
    const bubble = this.scene.add.container(0, 0);
    bubble.setDepth(9999);

    // Create text first to measure it
    const text = this.scene.add.text(0, 0, this.message, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#000000',
      wordWrap: { width: 200 },
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 1);

    // Calculate bubble dimensions
    const padding = 4;
    const bubbleWidth = Math.max(text.width, 60) + (padding - 8) * 2;
    const bubbleHeight = text.height + padding * 2;

    // Create bubble background
    const bg = this.scene.add.graphics()
      .fillStyle(0xFFFFFF, 0.9)
      .fillRoundedRect(
        -bubbleWidth / 2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      )
      .lineStyle(1, 0xCCCCCC)
      .strokeRoundedRect(
        -bubbleWidth / 2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      );

    text.setPosition(0, -padding);
    bubble.add([bg, text]);

    const existingBubbles = this.chatManager.bubbles.get(this.actor.id) || [];
    const yOffset = existingBubbles.length * (bubbleHeight + 5);

    const xPos = this.actor.sprite.x;
    const yPos = this.actor.sprite.y - this.actor.sprite.displayHeight - 50;
    bubble.setPosition(xPos + 30, yPos - yOffset);

    this.scene.time.delayedCall(3000, () => {
      this.remove();
    });

    return bubble;
  }

  remove() {
    const bubbles = this.chatManager.bubbles.get(this.actor.id);
    const index = bubbles.indexOf(this);

    if (index > -1) {
      this.container.destroy();
      bubbles.splice(index, 1);
    }

    if (bubbles.length === 0) {
      this.chatManager.bubbles.delete(this.actor.id);
    } else {
      for (const bubble of bubbles) {
        bubble.container.setPosition(bubble.container.x, bubble.container.y + 50);
      }
    }
  }
}