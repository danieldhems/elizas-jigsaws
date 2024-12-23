import SingleMovable from "./SingleMovable";
import {
  BoundingBox,
} from "./types";
import Utils from "./utils";

export function checkConnections(
  piece: SingleMovable,
) {

  const solvedBoundingBoxes = piece.getSolvedBoundingBoxes();

  for (let n = 0, l = piece.connectors.length; n < l; n++) {
    const connector = piece.connectors[n];

    if (connector.isConnected) continue;

    // The degrees location for the connector on the target piece
    // based on the opposing degrees for this connector
    // e.g. If this connector is at 180 deg then the target connector should be at 360deg 
    const boundingBoxForSourceConnector = piece.getCurrentBoundingBoxForConnector(connector.atDegrees) as BoundingBox;
    const adjacentDegrees = Utils.getAdjacentDegrees(connector.atDegrees);

    const targetPiece = window.Puzzly.getSingleInstanceByIndex(connector.ownerIndex);

    if (piece.groupInstance && targetPiece.groupInstance && piece.groupInstance.id === targetPiece.groupInstance.id) continue;

    const boundingBoxForTargetConnector = targetPiece.getCurrentBoundingBoxForConnector(adjacentDegrees) as BoundingBox;

    if (window.Puzzly.showConnectorBoxes) {
      Utils.drawBox(boundingBoxForSourceConnector, null, 'green');
      Utils.drawBox(boundingBoxForTargetConnector, null, 'red');
    }

    if (!targetPiece.isSolved && Utils.hasCollision(boundingBoxForSourceConnector, boundingBoxForTargetConnector)) {
      connector.isConnected = true;

      // TODO: Separation of concerns
      // This seems to work but I don't think this function should be doing this 
      for (const connector of targetPiece.connectors) {
        if (connector.atDegrees === adjacentDegrees) {
          connector.isConnected = true;
        }
      }

      return {
        sourcePiece: piece,
        targetPiece: targetPiece,
        atDegrees: connector.atDegrees,
        adjacentDegrees: adjacentDegrees,
        isSolving: false,
      }
    }

    if (Utils.hasCollision(boundingBoxForSourceConnector, solvedBoundingBoxes[n])) {
      if (window.Puzzly.showConnectorBoxes) {
        Utils.drawBox(solvedBoundingBoxes[n], null, 'purple');
      }
      for (const connector of piece.connectors) {
        connector.isConnected = true;
      }

      return {
        sourcePiece: piece,
        isSolving: true,
      };
    }
  }
}
