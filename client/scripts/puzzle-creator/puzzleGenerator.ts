import {
  CONNECTOR_SIZE_PERC,
  CONNECTOR_TOLERANCE_AMOUNT,
  MINIMUM_NUMBER_OF_PIECES_PER_SIDE,
  MINIMUM_PIECE_SIZE,
  SHOULDER_SIZE_PERC,
} from "../constants";
import {
  ConnectorType,
  Puzzle,
  Connector,
  PuzzlePiece,
  ConnectorChoices,
  PuzzleOrientation,
  PieceType,
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

/**
 * Fn: generatePieces
 * 
 * NB: PUZZLE PIECES ARE GENERATED HERE!
 * @param puzzle 
 * @returns 
 */
export const generatePieces = (puzzle: Puzzle): PuzzlePiece[] => {
  let pieces: PuzzlePiece[] = [];

  const {
    totalNumberOfPieces,
    numberOfPiecesHorizontal,
    numberOfPiecesVertical,
    width,
    height
  } = puzzle;

  let currentRow = 0;
  let currentColumn = 0;

  for (let n = 0; n < totalNumberOfPieces; n++) {
    const piece = {} as PuzzlePiece;

    piece.index = n;

    if (height <= width || width == height) {
      piece.pieceBodySize = width / numberOfPiecesHorizontal;
    } else {
      piece.pieceBodySize = height / numberOfPiecesVertical;
    }

    const connectorSize = getConnectorSize(piece.pieceBodySize);

    let topConnectorType: ConnectorType | null = null;
    let rightConnectorType: ConnectorType | null = null;
    let bottomConnectorType: ConnectorType | null = null;
    let leftConnectorType: ConnectorType | null = null;

    if (currentColumn === 0 && currentRow === 0) {
      // TODO: What was my plan here?
    }

    if (currentRow === 0) {
      if (currentColumn === 0) {
        piece.pieceType = PieceType.TopLeftCorner;
      } else if (currentColumn < numberOfPiecesHorizontal - 1) {
        piece.pieceType = PieceType.TopSide;
      } else {
        piece.pieceType = PieceType.TopRightCorner;
      }
    } else if (currentRow < numberOfPiecesVertical - 1) {
      if (currentColumn === 0) {
        piece.pieceType = PieceType.LeftSide;
      } else if (currentColumn < numberOfPiecesHorizontal - 1) {
        piece.pieceType = PieceType.Inner;
      } else {
        piece.pieceType = PieceType.RightSide;
      }
    } else {
      if (currentColumn === 0) {
        piece.pieceType = PieceType.BottomLeftCorner;
      } else if (currentColumn < numberOfPiecesHorizontal - 1) {
        piece.pieceType = PieceType.BottomSide;
      } else {
        piece.pieceType = PieceType.BottomRightCorner;
      }
    }

    if (currentColumn > 0) {
      const pieceBehind = pieces[n - 1];
      leftConnectorType = Utils.getOppositeConnector(pieceBehind.connectors[1].type);
    }

    if (currentColumn < numberOfPiecesHorizontal - 1) {
      rightConnectorType = Utils.getRandomConnector();
    }

    if (currentRow > 0) {
      const pieceAbove = pieces[n - numberOfPiecesHorizontal];
      topConnectorType = Utils.getOppositeConnector(pieceAbove.connectors[2].type);
    }

    if (currentRow < numberOfPiecesVertical - 1) {
      bottomConnectorType = Utils.getRandomConnector();
    }


    piece.numPiecesFromLeftEdge = currentRow;
    piece.numPiecesFromTopEdge = currentColumn;

    if (topConnectorType !== null) {
      const connector = {
        ownerIndex: n,
        targetPieceIndex: n - numberOfPiecesHorizontal,
        type: topConnectorType,
        atDegrees: 90,
        isConnected: false,
      }
      piece.connectors.push(connector);
    }

    if (rightConnectorType !== null) {
      const connector = {
        ownerIndex: n,
        targetPieceIndex: n + 1,
        type: rightConnectorType,
        atDegrees: 180,
        isConnected: false
      };
      piece.connectors.push(connector);
    }

    if (bottomConnectorType !== null) {
      const connector = {
        ownerIndex: n,
        targetPieceIndex: n + numberOfPiecesHorizontal,
        type: bottomConnectorType,
        atDegrees: 270,
        isConnected: false
      };
      piece.connectors.push(connector);
    }

    if (leftConnectorType !== null) {
      const connector = {
        ownerIndex: n,
        targetPieceIndex: n - 1,
        type: leftConnectorType,
        atDegrees: 360,
        isConnected: false
      };
      piece.connectors.push(connector);
    }

    let pieceWidth = piece.pieceBodySize;
    let pieceHeight = piece.pieceBodySize;

    let xPos = pieceWidth * piece.numPiecesFromLeftEdge;
    let yPos = pieceHeight * piece.numPiecesFromTopEdge;

    const hasTopPlug = topConnectorType === ConnectorType.Plug;
    const hasRightPlug = rightConnectorType === ConnectorType.Plug;
    const hasBottomPlug = bottomConnectorType === ConnectorType.Plug;
    const hasLeftPlug = leftConnectorType === ConnectorType.Plug;

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

    if (currentColumn === numberOfPiecesHorizontal - 1) {
      currentColumn = 0;
      currentRow++;
    } else {
      currentColumn++;
    }
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
 * NB: ALL PUZZLES AND THEIR RESPECTIVE PIECES ARE GENERATED HERE!
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
