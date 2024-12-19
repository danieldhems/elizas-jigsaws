import Puzzly from "./Puzzly";
import PuzzlyCreator from "./puzzlyCreator";
import Utils from "./utils";

document.body.onload = function () {
  const puzzleId = Utils.getQueryStringValue("puzzleId");

  if (puzzleId) {
    fetch("/api/puzzle/getPuzzle", {
      method: 'POST',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({ puzzleId }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log("puzzle fetched", response);
        window.Puzzly = new Puzzly(puzzleId, response);
      });
  } else {
    new PuzzlyCreator();
  }
};
