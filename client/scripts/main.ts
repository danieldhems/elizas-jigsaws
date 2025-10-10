import Puzzly from "./puzzle-main";
import PuzzlyCreator from "./puzzle-creator";
import Utils from "./utils";

document.body.onload = function () {
  const puzzleId = Utils.getQueryStringValue("id");
  if (puzzleId) {
    fetch("/api/puzzle/" + puzzleId)
      .then((response) => response.json())
      .then((response) => {
        const config = { noDispersal: true };
        window.Puzzly = new Puzzly(response);
      });
  }
};
