import {
  CONNECTOR_SIZE_PERC,
  CONNECTOR_TOLERANCE_AMOUNT,
  MINIMUM_NUMBER_OF_PIECES_PER_SIDE,
  MINIMUM_PIECE_SIZE,
  SHOULDER_SIZE_PERC,
  SVG_NAMESPACE
} from "../constants";
import { getJigsawShapeSvgString } from "./svg";
import {
  ConnectorType,
  Puzzle,
  Connector,
  PuzzlePiece,
  ConnectorChoices,
  PuzzleOrientation,
} from "../types";
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

export const generatePieces = (puzzle: Puzzle): PuzzlePiece[] => {
  let pieces: PuzzlePiece[] = [];
  let n = 0;

  let rightConnector: ConnectorType | null;
  let bottomConnector: ConnectorType | null;
  let leftConnector: ConnectorType | null;
  let topConnector: ConnectorType | null;

  const {
    totalNumberOfPieces,
    numberOfPiecesHorizontal,
    numberOfPiecesVertical,
    width,
    height
  } = puzzle;

  let currentIndexFromLeftEdge = 0;
  let currentIndexFromTopEdge = 0;

  const connectorChoices: ConnectorChoices = [
    ConnectorType.Plug,
    ConnectorType.Socket
  ];

  const allConnectors: Connector[] = [];

  while (n < puzzle.totalNumberOfPieces) {
    const piece = {} as PuzzlePiece;

    piece.index = n;

    let pieceBodySize: number;

    if (height <= width || width == height) {
      pieceBodySize = width / numberOfPiecesHorizontal;
    } else {
      pieceBodySize = height / numberOfPiecesVertical;
    }

    piece.pieceBodySize = pieceBodySize;

    const connectorSize = getConnectorSize(pieceBodySize);

    if (n === 0) {
      // First piece

      // TODO: top-right-bottom-left won't work for wild pieces
      // expect to revisit this
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
          targetPieceIndex: bottomAdjacentPieceIndex,
          connectorType: bottomConnector,
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
      const pieceAbove = pieces[n - puzzle.numberOfPiecesHorizontal];
      const previousPiece = pieces[n - 1];

      // If we've reached the end of the current row of pieces
      // start the next row
      if (currentIndexFromLeftEdge + 1 === puzzle.numberOfPiecesHorizontal) {
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

      if ((n + 1) % puzzle.numberOfPiecesHorizontal === 0) {
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

    let pieceWidth = piece.pieceBodySize;
    let pieceHeight = piece.pieceBodySize;

    let xPos = pieceWidth * piece.numPiecesFromLeftEdge;
    let yPos = pieceHeight * piece.numPiecesFromTopEdge;

    const hasTopPlug = piece.connectors[0].connectorType === ConnectorType.Plug;
    const hasRightPlug = piece.connectors[1].connectorType === ConnectorType.Plug;
    const hasBottomPlug = piece.connectors[2].connectorType === ConnectorType.Plug;
    const hasLeftPlug = piece.connectors[3].connectorType === ConnectorType.Plug;

    if (hasTopPlug) {
      yPos -= connectorSize;
      pieceHeight += connectorSize;
    }

    if (hasRightPlug) {
      pieceWidth += connectorSize;
    }

    if (hasBottomPlug) {
      pieceHeight += connectorSize;
    }
    if (hasLeftPlug) {
      xPos -= connectorSize;
      pieceWidth += connectorSize;
    }

    piece.width = pieceWidth;
    piece.height = pieceHeight;

    pieces.push(piece);

    n++;
  }

  return pieces;
}

export const getPieceSize = (puzzleDimensions: { width: number; height: number }, puzzleConfig: Puzzle): number => {
  const { numberOfPiecesHorizontal, numberOfPiecesVertical } = puzzleConfig;
  const { width: width, height: height } = puzzleDimensions;

  let pieceSize: number;

  if (numberOfPiecesHorizontal < numberOfPiecesVertical) {
    pieceSize = width / numberOfPiecesHorizontal;
  } else {
    pieceSize = height / numberOfPiecesVertical;
  }

  return pieceSize;
}

/**
 * Generate configs for all possible puzzles that can be made 
 * given the available width and weight
 * 
 * @param availableWidth The maximum available width
 * @param availableHeight The maximum available height
 * @requires
 *  @constant MINIMUM_PIECE_SIZE
 *  @constant MINIMUM_NUMBER_OF_PIECES_PER_SIDE
 */
export function generatePuzzlesWithinConstraints(constraints: {
  availableWidth: number,
  availableHeight: number,
}): Puzzle[] {
  const {
    availableWidth,
    availableHeight,
  } = constraints;

  const puzzleConfigs: Puzzle[] = [];

  let n: number = MINIMUM_NUMBER_OF_PIECES_PER_SIDE;
  let currentPieceSize: number;

  do {
    let puzzle = {} as Puzzle;

    currentPieceSize = length / n;

    const connectorSize = getConnectorSize(currentPieceSize);
    const connectorDistanceFromCorner = getConnectorDistanceFromCorner(currentPieceSize);
    const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

    let numberOfPiecesOnLongSide: number;

    if (availableWidth < availableHeight) {
      // Portrait puzzle
      numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(
        availableHeight,
        pieceSize
      );

      puzzle.orientation = PuzzleOrientation.Portrait;
      puzzle.numberOfPiecesHorizontal = n;
      puzzle.numberOfPiecesVertical = numberOfPiecesOnLongSide;
      puzzle.width = pieceSize * n;
      puzzle.height = pieceSize * numberOfPiecesOnLongSide;
      puzzle.percentageOfImageUsedHorizontal = puzzle.width / availableWidth * 100;
      puzzle.percentageOfImageUsedVertical = puzzle.height / availableHeight * 100;
      puzzle.pieces = generatePieces(puzzle);
    } else if (availableHeight < availableWidth) {
      // Landscape puzzle
      numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(
        availableWidth,
        pieceSize
      );

      puzzle.orientation = PuzzleOrientation.Landscape;
      puzzle.numberOfPiecesHorizontal = numberOfPiecesOnLongSide;
      puzzle.numberOfPiecesVertical = n;
      puzzle.width = pieceSize * numberOfPiecesOnLongSide;
      puzzle.height = pieceSize * n;
      puzzle.percentageOfImageUsedHorizontal = puzzle.width / availableWidth * 100;
      puzzle.percentageOfImageUsedVertical = puzzle.height / availableHeight * 100;
      puzzle.pieces = generatePieces(puzzle);
    } else {
      puzzle.totalNumberOfPieces = puzzle.numberOfPiecesHorizontal * puzzle.numberOfPiecesVertical;

      // Square puzzles
      puzzle = {
        orientation: PuzzleOrientation.Square,
        numberOfPiecesHorizontal: n,
        numberOfPiecesVertical: n,
        totalNumberOfPieces: n * n,
        width: pieceSize * n,
        height: pieceSize * n,
        percentageOfImageUsedHorizontal: 100,
        percentageOfImageUsedVertical: 100,
        pieces: generatePieces(puzzle),
      };
    }


    puzzleConfigs.push(puzzle);

    n = n + 1;
  } while (currentPieceSize > MINIMUM_PIECE_SIZE);

  return puzzleConfigs;
}

export type ImageInfo = {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Fix: This is where the puzzle piece HTML elements are created?
 * Should rename this and invoke it somewhere more logical, for example
 * in the same function that creates the puzzles.
 * 
 * The name 'impression' is semantically irrelevant to what this function
 * is actually doing; The ImpressionsOverlay merely displays the puzzles
 * as a small-scale preview, so it shouldn't be confused with this function's
 * purpose.
 */
export const getPuzzlesForImpressionsOverlay = (puzzleConfigs: Puzzle[]): {
  container: HTMLDivElement;
  impressions: Puzzle[];
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
    // svgElement.setAttribute("width", currentConfig.width + "");
    // svgElement.setAttribute("height", currentConfig.height + "");
    svgElement.setAttribute("fill", "none");
    svgElement.setAttribute("stroke", "#000")
    // svgElement.setAttribute("stroke-alignment", "inner")
    svgElement.setAttribute("viewBox", "0 0 " + currentConfig.width + " " + currentConfig.height);

    element.appendChild(svgElement)
    container.appendChild(element)

    const piecePosition = {
      x: 0,
      y: 0,
    }

    for (let n = 0, l = pieces.length; n < l; n++) {
      const currentPiece = pieces[n];

      const pathElement = document.createElementNS(SVG_NAMESPACE, "path");
      pathElement.setAttribute("id", "piece-" + n);
      svgElement.appendChild(pathElement);

      const shape = getJigsawShapeSvgString(currentPiece);
      pathElement.setAttribute("d", shape);

      if (currentPiece.numPiecesFromLeftEdge === currentConfig.numberOfPiecesHorizontal - 1) {
        // TODO: We can use the pieceBodySize from the current piece
        // because the pieces all have the same size in a normal puzzle.
        // 
        // But, this won't work for wild pieces
        piecePosition.y += currentPiece.pieceBodySize;
        piecePosition.x = 0;
      } else {
        piecePosition.x += currentPiece.pieceBodySize;
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
