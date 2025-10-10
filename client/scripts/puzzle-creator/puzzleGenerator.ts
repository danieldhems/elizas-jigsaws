import { CONNECTOR_SIZE_PERC, CONNECTOR_TOLERANCE_AMOUNT, SHOULDER_SIZE_PERC, SVG_NAMESPACE } from "../constants";
import { getJigsawShapeSvgString } from "./svg";
import { ConnectorType, JigsawPieceData, PuzzleAxis, PuzzleCreatorOptions, PuzzleGenerator, PuzzleConfig, SkeletonPiece, PuzzleImpression, Connector, JigsawPiece } from "../types";
import Utils from "../utils";

export const getConnectorSize = (pieceSize: number) => {
  return pieceSize / 100 * CONNECTOR_SIZE_PERC;
}

export const getConnectorDistanceFromCorner = (pieceSize: number) => {
  return pieceSize / 100 * SHOULDER_SIZE_PERC;
}

export const getConnectorTolerance = (connectorSize: number) => {
  return connectorSize / 100 * CONNECTOR_TOLERANCE_AMOUNT;
}

export const generatePieces = (puzzleConfig: PuzzleConfig): JigsawPiece[] => {
  let pieces: JigsawPiece[] = [];
  let n = 0;

  let pieceAbove = {} as Pick<JigsawPieceData, "type">;
  let previousPiece = {} as Pick<JigsawPieceData, "type">;

  let rightConnector: ConnectorType | null;
  let bottomConnector: ConnectorType | null;
  let leftConnector: ConnectorType | null;
  let topConnector: ConnectorType | null;

  const { totalNumberOfPieces, numberOfPiecesHorizontal, numberOfPiecesVertical } = puzzleConfig;
  const connectorChoices = [-1, 1];

  const connectorSize = getConnectorSize(puzzleConfig.pieceSize);
  const connectorTolerance = getConnectorTolerance(connectorSize);
  const connectorDistanceFromCorner = getConnectorDistanceFromCorner(puzzleConfig.pieceSize);

  let currentIndexFromLeftEdge = 0;
  let currentIndexFromTopEdge = 0;

  const allConnectors: Connector[] = [];

  while (n < puzzleConfig.totalNumberOfPieces) {
    // Using Partial generic to start with an object literal
    // that we can populate as we go
    // Fix: anti-pattern?
    const piece = {} as JigsawPiece;

    piece.index = n;

    piece.connectors = [];

    if (n === 0) {
      // TODO: top-right-bottom-left won't work for wild pieces
      // expect to revisit this

      // First piece
      topConnector = null;
      rightConnector = Utils.getRandomConnector();

      const rightAdjacentPieceIndex = n + 1;
      const bottomAdjacentPieceIndex = n + numberOfPiecesHorizontal;

      bottomConnector = Utils.getRandomConnector();
      leftConnector = null;

      const connectors = [
        {
          ownerIndex: n,
          targetPieceIndex: rightAdjacentPieceIndex,
          connectorType: rightConnector,
          isConnected: false,
          atDegrees: 180,
        },
        {
          ownerIndex: n,
          connectorType: bottomConnector,
          targetPieceIndex: bottomAdjacentPieceIndex,
          isConnected: false,
          atDegrees: 270,
        },
      ];
      piece.connectors = connectors;
      allConnectors.push(...connectors);

      piece.numPiecesFromTopEdge = 0;
      piece.numPiecesFromLeftEdge = 0;
    } else {
      // All other pieces
      const pieceAbove = pieces[n - puzzleConfig.numberOfPiecesHorizontal];
      const previousPiece = pieces[n - 1];

      // If we've reached the end of the current row of pieces
      // start the next row
      if (currentIndexFromLeftEdge + 1 === puzzleConfig.numberOfPiecesHorizontal) {
        currentIndexFromLeftEdge++;
      } else {
        currentIndexFromLeftEdge = 0;
        currentIndexFromTopEdge++;
      }

      piece.numPiecesFromLeftEdge = currentIndexFromLeftEdge;
      piece.numPiecesFromTopEdge = currentIndexFromTopEdge;

      if (pieceAbove) {
        topConnector = Utils.getOppositeConnector(
          pieceAbove.connectors[2].connectorType
        );
      } else {
        topConnector = null;
      }

      if (currentIndexFromLeftEdge === 0) {
        leftConnector = null;
      } else {
        leftConnector = Utils.getOppositeConnector(
          previousPiece.connectors[1].connectorType
        );
      }

      if ((n + 1) % puzzleConfig.numberOfPiecesHorizontal === 0) {
        // Right edge pieces
        rightConnector = null;
      } else {
        rightConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType
      }

      if (n >= totalNumberOfPieces - numberOfPiecesHorizontal) {
        // Last row
        bottomConnector = null;
      } else {
        bottomConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType;
      }

      if (topConnector !== null) {
        const connector = {
          ownerIndex: n,
          targetPieceIndex: n - numberOfPiecesHorizontal,
          connectorType: topConnector,
          atDegrees: 90,
          isConnected: false,
        }
        piece.connectors.push(connector);
      }

      if (rightConnector !== null) {
        const connector = {
          ownerIndex: n,
          targetPieceIndex: n + 1,
          connectorType: rightConnector,
          atDegrees: 180,
          isConnected: false
        };
        piece.connectors.push(connector);
      }

      if (bottomConnector !== null) {
        const connector = {
          ownerIndex: n,
          targetPieceIndex: n + numberOfPiecesHorizontal,
          connectorType: bottomConnector,
          atDegrees: 270,
          isConnected: false
        };
        piece.connectors.push(connector);
      }

      if (leftConnector !== null) {
        const connector = {
          ownerIndex: n,
          targetPieceIndex: n - 1,
          connectorType: leftConnector,
          atDegrees: 360,
          isConnected: false
        };
        piece.connectors.push(connector);
      }
    }

    pieces.push(piece);

    n++;
  }

  return pieces;
}

export const getPieceSize = (puzzleDimensions: { width: number; height: number }, puzzleConfig: PuzzleConfig): number => {
  const { numberOfPiecesHorizontal, numberOfPiecesVertical } = puzzleConfig;
  const { width: puzzleWidth, height: puzzleHeight } = puzzleDimensions;

  let pieceSize: number;

  if (numberOfPiecesHorizontal < numberOfPiecesVertical) {
    pieceSize = puzzleWidth / numberOfPiecesHorizontal;
  } else {
    pieceSize = puzzleHeight / numberOfPiecesVertical;
  }

  return pieceSize;
}

export const addPuzzleDataToPieces = (
  pieces: SkeletonPiece[],
  puzzleConfig: PuzzleConfig,
): SkeletonPiece[] => {
  const {
    pieceSize,
    connectorSize,
    connectorDistanceFromCorner,
    connectorTolerance,
    puzzleWidth,
    puzzleHeight,
  } = puzzleConfig;

  pieces = pieces.map((piece, index) => {
    let width = pieceSize;
    let height = pieceSize;

    let xPos = pieceSize * piece.numPiecesFromLeftEdge;
    let yPos = pieceSize * piece.numPiecesFromTopEdge;

    if (piece.type[0] === 1) {
      yPos -= connectorSize;
      height += connectorSize;
    }

    if (piece.type[1] === 1) {
      width += connectorSize;
    }

    if (piece.type[2] === 1) {
      height += connectorSize;
    }
    if (piece.type[3] === 1) {
      xPos -= connectorSize;
      width += connectorSize;
    }

    const pageX = xPos * 2 + pieceSize;
    const pageY = yPos * 2 + pieceSize;

    return {
      ...piece,
      index,
      basePieceSize: pieceSize,
      connectorSize,
      connectorTolerance,
      connectorDistanceFromCorner,
      puzzleX: xPos,
      puzzleY: yPos,
      puzzleWidth,
      puzzleHeight,
      pageX,
      pageY,
      width,
      height,
    }
  })

  /**
   * Now all pieces and connectors have been generated, and all have unique IDs,
   * let's marry up each connector pair by finding their collisions and assigning their opposing IDs.
   * NB: This should work for any puzzle configuration including 'wild' pieces
   * because, given each piece's collision with its adjacent pieces,
   * and each connector's orientation in degrees i.e. connector A at 30deg belongs to
   * connector B at 310deg.
   */

  // for (const thisPiece of pieces) {
  //   console.log('current piece', thisPiece)
  //   // Get adjacent pieces by collision
  //   const thisPieceBoundingBox = {
  //     top: thisPiece.puzzleX as number,
  //     left: thisPiece.puzzleY as number,
  //     right: (thisPiece.puzzleX as number) + (thisPiece.width as number),
  //     bottom: (thisPiece.puzzleY as number) + (thisPiece.height as number),
  //   };

  //   // console.log('this piece bounding box', thisPieceBoundingBox)

  //   const adjacentPieces = pieces.filter((targetPiece) => {
  //     // console.log('filtering piece', targetPiece)
  //     if (thisPiece.id === targetPiece.id) return;
  //     // Get adjacent pieces by collision
  //     const targetPieceBoundingBox = {
  //       top: targetPiece.puzzleX as number,
  //       left: targetPiece.puzzleY as number,
  //       right: (targetPiece.puzzleX as number) + (targetPiece.width as number),
  //       bottom: (targetPiece.puzzleY as number) + (targetPiece.height as number),
  //     };
  //     // console.log('filtered piece bounding box', targetPieceBoundingBox)

  //     return Utils.hasCollision(thisPieceBoundingBox, targetPieceBoundingBox);
  //   });

  //   console.log('adjacent pieces', adjacentPieces)

  //   // Marry up connectors by their adjacent degrees
  //   thisPiece.connectors = thisPiece.connectors.map((thisPieceConnector) => {
  //     const adjacentDegrees = Utils.getAdjacentDegrees(thisPieceConnector.atDegrees);
  //     for (const adjacentPiece of adjacentPieces) {
  //       for (const adjacentPieceConnector of adjacentPiece.connectors) {
  //         if (adjacentPieceConnector.atDegrees === adjacentDegrees) {
  //           thisPieceConnector.targetConnectorID = adjacentPieceConnector.id;
  //           return thisPieceConnector;
  //         }
  //       }
  //     }

  //     return thisPieceConnector;
  //   })
  // };

  return pieces;
}

export function getPuzzleConfigs(
  availableWidth: number,
  availableHeight: number,
  minimumPieceSize: number,
  minimumNumberOfPiecesPerSide: number
): {
  rectangularPuzzleConfigs: PuzzleConfig[];
  squarePuzzleConfigs: PuzzleConfig[];
} {
  let shortSide: PuzzleAxis | null;

  if (availableWidth < availableHeight) {
    shortSide = PuzzleAxis.Horizontal;
  } else if (availableHeight < availableWidth) {
    shortSide = PuzzleAxis.Vertical;
  } else {
    shortSide = null;
  }

  let n: number = minimumNumberOfPiecesPerSide;

  const length = shortSide === PuzzleAxis.Horizontal
    ? availableWidth
    : availableHeight;

  const rectangularPuzzleConfigs: PuzzleConfig[] = [];
  const squarePuzzleConfigs: PuzzleConfig[] = [];

  let divisionResult: number;

  do {
    divisionResult = length / n;

    if (divisionResult < minimumPieceSize) break;

    const connectorTolerance = (divisionResult / 100 * CONNECTOR_TOLERANCE_AMOUNT);

    const connectorSize = getConnectorSize(divisionResult);
    const connectorDistanceFromCorner = getConnectorDistanceFromCorner(divisionResult);

    const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

    const puzzleConfig = {} as PuzzleConfig;

    if (shortSide) {
      puzzleConfig.pieceSize = pieceSize;
      puzzleConfig.connectorSize = connectorSize;
      puzzleConfig.connectorTolerance = connectorTolerance;
      puzzleConfig.connectorDistanceFromCorner = connectorDistanceFromCorner;

      let numberOfPiecesOnLongSide: number;

      switch (shortSide) {
        case PuzzleAxis.Horizontal:
          // Portrait puzzle
          numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(
            availableHeight,
            pieceSize
          );

          puzzleConfig.numberOfPiecesHorizontal = n;
          puzzleConfig.numberOfPiecesVertical = numberOfPiecesOnLongSide;
          puzzleConfig.puzzleWidth = pieceSize * n;
          puzzleConfig.puzzleHeight = pieceSize * numberOfPiecesOnLongSide;
          puzzleConfig.percentageOfImageUsedHorizontal = puzzleConfig.puzzleWidth / availableWidth * 100;
          puzzleConfig.percentageOfImageUsedVertical = puzzleConfig.puzzleHeight / availableHeight * 100;

          break;

        case PuzzleAxis.Vertical:
          // Landscape puzzle
          numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(
            availableWidth,
            pieceSize
          );

          puzzleConfig.numberOfPiecesHorizontal = numberOfPiecesOnLongSide;
          puzzleConfig.numberOfPiecesVertical = n;
          puzzleConfig.puzzleWidth = pieceSize * numberOfPiecesOnLongSide;
          puzzleConfig.puzzleHeight = pieceSize * n;
          puzzleConfig.percentageOfImageUsedHorizontal = puzzleConfig.puzzleWidth / availableWidth * 100;
          puzzleConfig.percentageOfImageUsedVertical = puzzleConfig.puzzleHeight / availableHeight * 100;

          break;
      }

      puzzleConfig.aspectRatio = puzzleConfig.puzzleWidth / puzzleConfig.puzzleHeight;
      puzzleConfig.totalNumberOfPieces = puzzleConfig.numberOfPiecesHorizontal * puzzleConfig.numberOfPiecesVertical;

      rectangularPuzzleConfigs.push(puzzleConfig);
    }

    // Square puzzles
    const config = {
      numberOfPiecesHorizontal: n,
      numberOfPiecesVertical: n,
      totalNumberOfPieces: n * n,
      pieceSize,
      connectorSize,
      connectorTolerance,
      connectorDistanceFromCorner,
      availableWidth,
      availableHeight,
      puzzleWidth: pieceSize * n,
      puzzleHeight: pieceSize * n,
      percentageOfImageUsedHorizontal: 100,
      percentageOfImageUsedVertical: 100,
    };

    squarePuzzleConfigs.push(config);

    n = n + 1;

  } while (divisionResult >= minimumPieceSize);

  return {
    rectangularPuzzleConfigs,
    squarePuzzleConfigs,
  };
}

export type ImageInfo = {
  width: number;
  height: number;
  aspectRatio: number;
}

export const getPuzzleImpressions = (puzzleConfigs: PuzzleConfig[]): {
  container: HTMLDivElement;
  impressions: PuzzleImpression[];
} => {
  const container = document.createElement("div");

  const impressions = [];

  // Assuming config set consists of either all rectangular or all square puzzles
  const sampleConfig = puzzleConfigs[0];

  // TODO: Could simplify this by just adding a property to each config that explicitly names it as either rectangular or square
  // TODO: Impression id/label should be an enum
  const configName = sampleConfig.numberOfPiecesHorizontal !== sampleConfig.numberOfPiecesVertical ? "rectangular-impressions" : "square-impressions";

  container.id = configName;

  for (let nConf = 0, lConf = puzzleConfigs.length; nConf < lConf; nConf++) {

    const currentConfig = puzzleConfigs[nConf];
    let pieces = generatePieces(currentConfig);

    const element = document.createElement("div");
    element.dataset.impressionIndex = nConf + '';
    element.id = "puzzle-" + currentConfig.totalNumberOfPieces;

    const svgElement = document.createElementNS(SVG_NAMESPACE, "svg");
    svgElement.setAttribute("xmlns", SVG_NAMESPACE);
    // svgElement.setAttribute("width", currentConfig.puzzleWidth + "");
    // svgElement.setAttribute("height", currentConfig.puzzleHeight + "");
    svgElement.setAttribute("fill", "none");
    svgElement.setAttribute("stroke", "#000")
    // svgElement.setAttribute("stroke-alignment", "inner")
    svgElement.setAttribute("viewBox", "0 0 " + currentConfig.puzzleWidth + " " + currentConfig.puzzleHeight);

    element.appendChild(svgElement)
    container.appendChild(element)

    // const groupElement = document.createElementNS(SVG_NAMESPACE, "symbol");
    // groupElement.setAttribute("width", currentConfig.puzzleWidth + "");
    // groupElement.setAttribute("height", currentConfig.puzzleHeight + "");

    const piecePosition = {
      x: 0,
      y: 0,
    }

    for (let n = 0, l = pieces.length; n < l; n++) {
      const currentPiece = pieces[n];

      const pathElement = document.createElementNS(SVG_NAMESPACE, "path");
      pathElement.setAttribute("id", "piece-" + n);
      svgElement.appendChild(pathElement);

      const shape = getJigsawShapeSvgString(
        currentPiece,
        currentConfig
      );
      pathElement.setAttribute("d", shape);

      if (currentPiece.numPiecesFromLeftEdge === currentConfig.numberOfPiecesHorizontal - 1) {
        piecePosition.y += currentConfig.pieceSize;
        piecePosition.x = 0;
      } else {
        piecePosition.x += currentConfig.pieceSize;
      }
    }

    impressions.push({
      index: nConf,
      puzzleConfig: currentConfig,
      pieces,
    })
  }

  return {
    container,
    impressions,
  }
}

/**
   * Calculate the maximum number of pieces we can have along a given edge
   * by simple addition based on a known size.
   *
   * i.e. keep adding the known piece size while it still fits within the length
   *
   * Use this to get the number of pieces for the longer edge once we know
   * the number of pieces and their sizes for the shorter egde.
   *
   * @param edgeLength number
   * @param interval number
   * @returns { numberOfPieces: number, totalLength: number }
   */
export function getNumberOfPiecesForAdjacentSideByPieceSize(
  edgeLength: number,
  pieceSize: number
): number {
  let n: number = 0;
  let sum: number = 0;
  let done = false;

  while (!done) {
    const newValue = sum + pieceSize;
    if (newValue < edgeLength) {
      sum = newValue;
      n++;
    } else {
      done = true;
    }
  }

  return n;
}

// exports.drawJigsawShape = drawJigsawShape;
// exports.default = PuzzleGenerator;

export default puzzleGenerator;
