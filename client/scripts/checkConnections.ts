import BaseMovable from "./BaseMovable";
import SingleMovable from "./SingleMovable";
import {
  BoundingBox,
  MovableElement,
} from "./types";
import Utils from "./utils";

export function checkConnections(
  element: MovableElement,
) {
  const baseMovable = new BaseMovable(window.Puzzly);
  const thisPieceInstance = baseMovable.getSingleInstanceFromElement(element);

  const shouldCompare = (targetPiece: SingleMovable) => {
    const sourceGroupId = thisPieceInstance.groupId;
    const targetGroupId = targetPiece.groupId;
    return (
      sourceGroupId === undefined && targetGroupId === undefined
    ) ||
      sourceGroupId !== targetGroupId;
  }

  const solvedBoundingBoxes = thisPieceInstance.getSolvedBoundingBoxes();

  for (let n = 0, l = thisPieceInstance.connectors.length; n < l; n++) {
    const connector = thisPieceInstance.connectors[n];

    // The degrees location for the connector on the target piece
    // based on the opposing degrees for this connector
    // e.g. If this connector is at 180 deg then the target connector should be at 360deg 
    const boundingBoxForSourceConnector = thisPieceInstance.getCurrentBoundingBoxForConnector(connector.atDegrees) as BoundingBox;
    const adjacentDegrees = Utils.getAdjacentDegrees(connector.atDegrees);

    const targetPiece = baseMovable.getSingleInstanceByIndex(connector.ownerIndex);
    const boundingBoxForTargetConnector = targetPiece.getCurrentBoundingBoxForConnector(adjacentDegrees) as BoundingBox;

    if (connector.boundingBox) {
      if (Utils.hasCollision(boundingBoxForSourceConnector, solvedBoundingBoxes[n])) {
        return {
          sourceElement: element,
          targetElement: targetPiece.element,
          isSolving: true,
        };
      }

      if (shouldCompare(targetPiece) && boundingBoxForTargetConnector) {
        if (Utils.hasCollision(boundingBoxForSourceConnector, boundingBoxForTargetConnector)) {
          console.log('connection detected')
          return {
            sourceElement: element,
            targetElement: targetPiece.element,
            atDegrees: connector.atDegrees,
            adjacentDegrees: adjacentDegrees,
            isSolving: false,
          }
        }
      }
    }
  }
}
