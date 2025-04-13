export default class ChatBubbleManager {
  constructor(scene) {
    this.scene = scene;
    this.player = scene.player;
    this.actorsManager = scene.actorsManager;
    this.bubbleVerticalOffset = 40; // pixels above name tag
    this.bubbleSpacing = 10; // space between stacked bubbles
    this.activeBubbles = new Map();
  }

  showBubble(actorId, message) {
    const actor = actorId === 0 ? this.player : this.actorsManager.getActor(actorId);
    if (!actor || !message) return;

    // Create container
    const bubble = this.scene.add.container(0, 0);
    bubble.setDepth(9999);

    // Create text first to measure it
    const text = this.scene.add.text(0, 0, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      wordWrap: { width: 200 },
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5, 1);

    // Calculate bubble dimensions
    const padding = 8;
    const bubbleWidth = Math.max(text.width, 60) + padding * 2;
    const bubbleHeight = text.height + padding * 2;

    // Create bubble background
    const bg = this.scene.add.graphics()
      .fillStyle(0xFFFFFF, 0.9)
      .fillRoundedRect(
        -bubbleWidth/2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      )
      .lineStyle(1, 0xCCCCCC)
      .strokeRoundedRect(
        -bubbleWidth/2,
        -bubbleHeight,
        bubbleWidth,
        bubbleHeight,
        12
      );

    text.setPosition(0, -padding);

    bubble.add([bg, text]);

    const existingBubbles = this.getBubbles(actorId);
    const yOffset = existingBubbles.length * (bubbleHeight + 5);

    const xPos = actor.sprite.x;
    const yPos = actor.sprite.y - actor.sprite.displayHeight - 50;
    bubble.setPosition(xPos + 30, yPos - yOffset);

    this.addBubble(actorId, bubble);

    this.scene.time.delayedCall(3000, () => {
      this.removeBubble(actorId, bubble);
    });
  }

  addBubble(actorId, bubble) {
    if (!this.activeBubbles.has(actorId)) {
      this.activeBubbles.set(actorId, []);
    }
    this.activeBubbles.get(actorId).push(bubble);
  }

  getBubbles(actorId) {
    return this.activeBubbles.get(actorId) || [];
  }

  removeBubble(actorId, bubble) {
    const bubbles = this.getBubbles(actorId);
    const index = bubbles.indexOf(bubble);
    if (index > -1) {
      bubble.destroy();
      bubbles.splice(index, 1);
    }

    if (bubbles.length === 0) {
      this.activeBubbles.delete(actorId);
    } else {
      this.recalculateBubblePositions(bubbles);
    }
  }

  recalculateBubblePositions(bubbles) {
    for (const bubble of bubbles) {
      bubble.setPosition(bubble.x, bubble.y + 50);
    }
  }
}
