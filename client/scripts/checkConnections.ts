import SingleMovable from "./SingleMovable";
import {
  BoundingBox,
} from "./types";
import Utils from "./utils";

export function checkConnections(
  piece: SingleMovable,
) {

  const shouldCompare = (sourcePiece: SingleMovable, targetPiece: SingleMovable) => {
    return (
      sourcePiece.groupId === undefined && targetPiece.groupId === undefined
    ) ||
      sourcePiece.groupId !== targetPiece.groupId;
  }

  const solvedBoundingBoxes = piece.getSolvedBoundingBoxes();

  for (let n = 0, l = piece.connectors.length; n < l; n++) {
    const connector = piece.connectors[n];

    // The degrees location for the connector on the target piece
    // based on the opposing degrees for this connector
    // e.g. If this connector is at 180 deg then the target connector should be at 360deg 
    const boundingBoxForSourceConnector = piece.getCurrentBoundingBoxForConnector(connector.atDegrees) as BoundingBox;
    const adjacentDegrees = Utils.getAdjacentDegrees(connector.atDegrees);

    const targetPiece = window.Puzzly.getSingleInstanceByIndex(connector.ownerIndex);

    if (targetPiece) {
      const boundingBoxForTargetConnector = targetPiece.getCurrentBoundingBoxForConnector(adjacentDegrees) as BoundingBox;
      Utils.drawBox(boundingBoxForSourceConnector, null, 'green')
      Utils.drawBox(boundingBoxForTargetConnector, null, 'red')
      if (shouldCompare(piece, targetPiece) && boundingBoxForTargetConnector) {
        if (Utils.hasCollision(boundingBoxForSourceConnector, boundingBoxForTargetConnector)) {
          return {
            sourcePiece: piece,
            targetPiece: targetPiece,
            atDegrees: connector.atDegrees,
            adjacentDegrees: adjacentDegrees,
            isSolving: false,
          }
        }
      }
    }

    if (connector.boundingBox) {
      if (Utils.hasCollision(boundingBoxForSourceConnector, solvedBoundingBoxes[n])) {
        return {
          sourcePiece: piece,
          isSolving: true,
        };
      }
    }
  }
}
