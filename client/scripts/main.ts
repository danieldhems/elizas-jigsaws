import Puzzly from "./Puzzly";
import PuzzlyCreator from "./puzzlyCreator";
import Utils from "./utils";

document.body.onload = function () {
  /*
  fetch("https://lzdxrerlld.execute-api.eu-west-2.amazonaws.com/health", {
    method: 'GET',
    headers: {
      "Content-Type": "Application/json",
    },
  })
  .then(res => res.json())
  .then(data => console.log("health response", data))
  .catch((e) => console.error(e))

  fetch("https://lzdxrerlld.execute-api.eu-west-2.amazonaws.com/createPuzzle", {
    method: 'POST',
    headers: {
      "Content-Type": "Application/json",
    },
    body: JSON.stringify({"pieceSize":47.52,"connectorSize":14.256,"connectorTolerance":23.76,"connectorDistanceFromCorner":16.632,"numberOfPiecesHorizontal":8,"numberOfPiecesVertical":5,"puzzleWidth":380.16,"puzzleHeight":237.60000000000002,"percentageOfImageUsedHorizontal":98.9010989010989,"percentageOfImageUsedVertical":100,"aspectRatio":1.5999999999999999,"totalNumberOfPieces":40,"id":"3Fxbzeka9wzH5cYVEuSyc","boardWidth":380.16,"boardHeight":237.60000000000002,"imageName":"anime-my-hero-academia-blush-boku-no-hero-academia-wallpaper-preview.jpg","puzzleImagePath":"./uploads/puzzle_anime-my-hero-academia-blush-boku-no-hero-academia-wallpaper-preview.jpg","debugOptions":{"noDispersal":true,"highlightConnectingPieces":false},"isIntegration":false})
  })
  .then(res => res.json())
  .then(data => console.log("createPuzzle", data))
  .catch((e) => console.error(e))
  */

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
