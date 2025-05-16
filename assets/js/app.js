import "phoenix_html"
import JoinController from "./controllers/join_controller";

const csrfToken = document.querySelector("meta[name='csrf-token']");

document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector("#game-container")) {
    new JoinController();
  }
});