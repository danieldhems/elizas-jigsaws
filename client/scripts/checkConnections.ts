import BaseMovable from "./BaseMovable";
import {
  BoundingBox,
  Connection,
  DomBox,
  JigsawPieceData,
  MovableElement,
  SideNames,
} from "./types";
import Utils from "./utils";

export function checkConnections(
  element: MovableElement,
) {
  // console.log("element", element)
  const baseMovable = new BaseMovable(window.Puzzly);

  const piece = {
    id: parseInt(element.dataset.pieceId as string),
    group: element.dataset.groupId,
    isSolved: element.dataset.isSolved,
    type: Utils.getPieceType(element),
    connectsTo: element.dataset.connectsTo,
  };

  // console.log("checkConnections", piece);

  const shouldCompare = (targetPiece: Partial<JigsawPieceData>) =>
    (piece.group === undefined && targetPiece.groupId === undefined) ||
    piece.group !== targetPiece.groupId;

  let connection: Connection | undefined;

  const thisPieceInstance = baseMovable.getSingleInstanceFromElement(element);
  // console.log("this piece instance", thisPieceInstance)
  const thisPieceConnectorBoundingBoxes = thisPieceInstance.getConnectorBoundingBoxes();

  // Check for solving connection
  const solvedBoundingBoxes = thisPieceInstance.getSolvedBoundingBoxes();

  solvedBoundingBoxes.forEach((solvedBox: BoundingBox, sN: number) => {
    if (Utils.hasCollision(solvedBox, thisPieceConnectorBoundingBoxes[sN])) {
      connection = {
        sourceElement: element,
        isSolving: true,
      }
    }
  })

  if (connection) {
    return connection;
  }

  // Check for connection with adjacent pieces
  const connectsTo = JSON.parse(element.dataset.connectsTo as string);
  Object.keys(connectsTo).some((key: SideNames) => {
    // console.log("key", key);
    const targetElement = Utils.getElementByPieceId(connectsTo[key]);
    // console.log("target element", targetElement)

    if (targetElement) {
      const { pieceId, groupId, isSolved } = targetElement.dataset;
      const targetPiece = {
        pieceId: parseInt(pieceId as string),
        groupId: groupId,
        isSolved: isSolved === "true",
      };

      if (shouldCompare(targetPiece)) {
        const targetPieceInstance = baseMovable.getSingleInstanceFromElement(targetElement);
        // console.log("target piece instance", targetPieceInstance)

        if (targetPieceInstance) {
          const targetPieceConnectorBoundingBoxes = targetPieceInstance.getConnectorBoundingBoxes();

          let collisionDetected = false;

          // console.log("source bounding boxes", thisPieceConnectorBoundingBoxes.length)
          // console.log("target bounding boxes", targetPieceConnectorBoundingBoxes.length)

          // TODO: Nested 'some' loops bad for performance?
          collisionDetected = thisPieceConnectorBoundingBoxes.some(sourceBox => {
            Utils.drawBox(sourceBox, null, 'red')
            return targetPieceConnectorBoundingBoxes.some(targetBox => {
              Utils.drawBox(targetBox, null, "blue")
              // console.log("compare", sourceBox, targetBox)
              if (Utils.hasCollision(sourceBox, targetBox)) {
                // console.log("collision detected")
                return true;
              }
            })
          })

          if (collisionDetected) {
            connection = {
              type: key,
              sourceElement: element,
              targetElement,
              isSolving: targetElement.dataset.isSolved === "true",
            };
          }
        }
      }
    }
  });

  return connection;
}
