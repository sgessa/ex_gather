import ActorController from "../controllers/actor_controller";
export default class ActorsManager {
  constructor(scene) {
    this.scene = scene;
    this.actors = {};
  }

  init(actors) {
    for (const [id, actor] of Object.entries(actors)) {
      this.spawn(actor);
    }
  }

  spawn(actor) {
    // Create sprite (if not exists)
    if (this.actors[actor.id]) return;
    this.actors[actor.id] = new ActorController(this.scene, actor);
  }

  remove(actor) {
    this.actors[actor.id]?.destroy();
    this.scene.videoPlayersManager.delete(actor.id);
    delete this.actors[actor.id];
  }

  move(actorId, data) {
    const actor = this.actors[actorId];
    actor?.move(data);
  }

  getActor(actorId) {
    return this.actors[actorId];
  }

  update() {
    for (const actor of Object.values(this.actors)) {
      actor?.update();
    }
  }
}
