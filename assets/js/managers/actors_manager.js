import ActorController from "../controllers/actor_controller";
export default class ActorsManager {
  constructor(scene) {
    this.scene = scene;
    this.actors = {};
  }

  init(actors) {
    for (const actor of actors) {
      this.spawn(actor);
    }
  }

  spawn(actor) {
    if (this.actors[actor.id]) return;
    if (actor.id == this.scene.player.id) return;

    this.actors[actor.id] = new ActorController(this.scene, actor);
  }

  remove(actorId) {
    this.actors[actorId]?.destroy();
    this.scene.videoPlayersManager.delete(actorId);
    delete this.actors[actorId];
  }

  move(data) {
    const actor = this.actors[data.id];
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
