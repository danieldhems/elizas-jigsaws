import Puzzly from "./Puzzly";
import PuzzlyCreator from "./puzzlyCreator";
import Utils from "./utils";

document.body.onload = function () {
  const puzzleId = Utils.getQueryStringValue("id");
  if (puzzleId) {
    fetch("/api/puzzle/" + puzzleId)
      .then((response) => response.json())
      .then((response) => {
        window.Puzzly = new Puzzly(puzzleId, response);
      });
  } else {
    new PuzzlyCreator();
  }
};
