import ActorController from "../controllers/actor_controller";

export default class ActorsManager {
  constructor(scene) {
    this.scene = scene;
    this.actors = {};
  }

  init(actors) {
    for (const [id, actor] of Object.entries(actors)) {
      console.log("Spawning actor:", actor);
      this.spawn(actor);
    }
  }

  spawn(actor) {
    const { id, username, x, y, dir, state } = actor;

    // Create sprite (if not exists)
    if (!this.actors[id]) {
      this.actors[id] = new ActorController(this.scene, username, x, y, dir, state);
    }

    // Update position
    actor = this.actors[id];
    actor.sprite.setPosition(x, y);
    actor.name.setPosition(x, y - 20);
  }

  remove(actor) {
    this.actors[actor.id]?.destroy();
    delete this.actors[actor.id];
  }

  move(actorId, data) {
    const actor = this.actors[actorId];
    actor?.move(data);
  }

  update() {
    for (const actor of Object.values(this.actors)) {
      actor?.update();
    }
  }
}