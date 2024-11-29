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



  // console.log("checkConnections", piece);

  const shouldCompare = (targetPiece: Partial<JigsawPieceData>) =>
    (piece.group === undefined && targetPiece.groupId === undefined) ||
    piece.group !== targetPiece.groupId;

  let connection: Connection | undefined;

  const thisPieceInstance = baseMovable.getSingleInstanceFromElement(element);

  const piece = {
    id: parseInt(element.dataset.pieceId as string),
    group: element.dataset.groupId,
    isSolved: element.dataset.isSolved,
    type: Utils.getPieceType(element),
    connectsTo: thisPieceInstance.connectsTo,
  };

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
          const collisionDetected = thisPieceInstance.connectors.some((connector) => {
            const targetConnectorBoundingBox = targetPieceInstance.getCurrentBoundingBoxForConnector(connector.atDegrees + 180);

            return Utils.hasCollision(connector.boundingBox, targetConnectorBoundingBox)
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
