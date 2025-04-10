import "phoenix_html"
import JoinController from "./controllers/join_controller";

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("#game-container")) {
    new JoinController();
  }
});