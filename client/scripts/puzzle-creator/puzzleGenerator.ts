import {
   CONNECTOR_SIZE_PERC,
   CONNECTOR_TOLERANCE_AMOUNT,
   MINIMUM_NUMBER_OF_PIECES_PER_SIDE,
   MINIMUM_PIECE_SIZE,
   SHOULDER_SIZE_PERC
} from '../constants';
import JigsawPath from '../puzzle-main/jigsawPath';
import { Connector, ConnectorType, PieceType, Puzzle, PuzzleOrientation, PuzzlePiece } from '../types';
import Utils from '../utils';

export const getConnectorSize = (pieceSize: number) => {
   return (pieceSize / 100) * CONNECTOR_SIZE_PERC;
};

export const getConnectorDistanceFromCorner = (pieceSize: number) => {
   return (pieceSize / 100) * SHOULDER_SIZE_PERC;
};

export const getConnectorTolerance = (connectorSize: number) => {
   return (connectorSize / 100) * CONNECTOR_TOLERANCE_AMOUNT;
};

/**
 * Fn: generatePieces
 *
 * @param puzzle
 * @returns
 */
export const generatePieces = (puzzle: Puzzle): PuzzlePiece[] => {
   let pieces: PuzzlePiece[] = [];

   const { totalNumberOfPieces, numberOfPiecesHorizontal, numberOfPiecesVertical, width, height } = puzzle;

   let currentRow = 0;
   let currentColumn = 0;

   console.log('total number of pieces', totalNumberOfPieces);

   for (let n = 0; n < totalNumberOfPieces; n++) {
      const piece = {} as PuzzlePiece;

      const bodySize = piece.pieceBodySize;

      piece.index = n;

      if (height <= width || width == height) {
         piece.pieceBodySize = width / numberOfPiecesHorizontal;
      } else {
         piece.pieceBodySize = height / numberOfPiecesVertical;
      }

      const connectorSize = getConnectorSize(piece.pieceBodySize);
      const connectorDistanceFromCorner = (piece.pieceBodySize / 100) * SHOULDER_SIZE_PERC;

      let topConnectorType: ConnectorType | null = null;
      let rightConnectorType: ConnectorType | null = null;
      let bottomConnectorType: ConnectorType | null = null;
      let leftConnectorType: ConnectorType | null = null;

      if (currentRow === 0) {
         if (currentColumn === 0) {
            piece.pieceType = PieceType.TopLeftCorner;
         } else if (currentColumn === numberOfPiecesHorizontal - 1) {
            piece.pieceType = PieceType.TopRightCorner;
         } else {
            piece.pieceType = PieceType.TopSide;
         }
      } else if (currentRow > 0 && currentRow < numberOfPiecesVertical - 2) {
         if (currentColumn === 0) {
            piece.pieceType = PieceType.LeftSide;
         } else if (currentColumn === numberOfPiecesHorizontal - 1) {
            piece.pieceType = PieceType.RightSide;
         } else {
            piece.pieceType = PieceType.Inner;
         }
      } else {
         if (currentColumn === 0) {
            piece.pieceType = PieceType.BottomLeftCorner;
         } else if (currentColumn === numberOfPiecesHorizontal - 1) {
            piece.pieceType = PieceType.BottomRightCorner;
         } else {
            piece.pieceType = PieceType.BottomSide;
         }
      }

      if (currentColumn > 0) {
         const pieceBehind = pieces[n - 1];
         leftConnectorType = Utils.getOppositeConnector(pieceBehind.connectors[currentRow === 0 ? 0 : 1].type);
      }

      if (currentColumn < numberOfPiecesHorizontal - 1) {
         rightConnectorType = Utils.getRandomConnector();
      }

      if (currentRow > 0) {
         const pieceAbove = pieces[n - numberOfPiecesHorizontal];
         let pieceAboveBottomConnector;

         if (pieceAbove.pieceType === PieceType.TopLeftCorner || pieceAbove.pieceType === PieceType.TopSide) {
            pieceAboveBottomConnector = Utils.getOppositeConnector(pieceAbove.connectors[1].type);
         } else if (pieceAbove.pieceType === PieceType.TopRightCorner) {
            pieceAboveBottomConnector = Utils.getOppositeConnector(pieceAbove.connectors[0].type);
         } else if (pieceAbove.pieceType === PieceType.LeftSide || pieceAbove.pieceType === PieceType.Inner) {
            console.log('pieceAbove', pieceAbove);
            pieceAboveBottomConnector = Utils.getOppositeConnector(pieceAbove.connectors[2].type);
         } else if (pieceAbove.pieceType === PieceType.RightSide) {
            pieceAboveBottomConnector = Utils.getOppositeConnector(pieceAbove.connectors[2].type);
         }
      }

      if (currentRow < numberOfPiecesVertical - 1) {
         bottomConnectorType = Utils.getRandomConnector();
      }

      piece.numPiecesFromLeftEdge = currentRow;
      piece.numPiecesFromTopEdge = currentColumn;

      piece.connectors = [];

      const path = new JigsawPath(piece.pieceBodySize, connectorSize);

      // Initialise svg path string
      let svgString = '';

      if (topConnectorType !== null) {
         const geometry = topConnectorType === ConnectorType.Plug ? path.getPlugGeometry() : path.getSocketGeometry();

         const connector = {
            ownerIndex: n,
            targetPieceIndex: n - numberOfPiecesHorizontal,
            type: topConnectorType,
            atDegrees: 90,
            isConnected: false,
            connectorSize,
            geometry: JigsawPath.getRotatedCubicBezierCurve(geometry, 0),
            distanceFromCorner: connectorDistanceFromCorner
         } as Connector;

         piece.connectors.push(connector);

         const controlPoints = connector.geometry.controlPoints;
         const destinationPoint = connector.geometry.destinationPoint;

         svgString += `M ${connectorSize} ${connectorSize} `;
         svgString += `h ${connectorDistanceFromCorner} `;
         svgString += `c ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${destinationPoint.x} ${destinationPoint.y} `;
         svgString += `h ${connectorDistanceFromCorner} `;
      } else {
         svgString += `M 0 0 `;
         svgString += `h ${piece.pieceBodySize} `;
      }

      if (rightConnectorType !== null) {
         const geometry = rightConnectorType === ConnectorType.Plug ? path.getPlugGeometry() : path.getSocketGeometry();
         const rotatedGeometry = JigsawPath.getRotatedCubicBezierCurve(geometry, 90);

         const connector = {
            ownerIndex: n,
            targetPieceIndex: n + 1,
            type: rightConnectorType,
            atDegrees: 180,
            isConnected: false,
            geometry: rotatedGeometry,
            distanceFromCorner: connectorDistanceFromCorner
         };

         piece.connectors.push(connector);

         const controlPoints = rotatedGeometry.controlPoints;
         const destinationPoint = rotatedGeometry.destinationPoint;

         svgString += `v ${connectorDistanceFromCorner} `;
         svgString += `c ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${destinationPoint.x} ${destinationPoint.y} `;
         svgString += `v ${connectorDistanceFromCorner} `;
      } else {
         svgString += `v ${piece.pieceBodySize} `;
      }

      if (bottomConnectorType !== null) {
         const geometry =
            bottomConnectorType === ConnectorType.Plug ? path.getPlugGeometry() : path.getSocketGeometry();
         const rotatedGeometry = JigsawPath.getRotatedCubicBezierCurve(geometry, 180);

         const connector = {
            ownerIndex: n,
            targetPieceIndex: n + numberOfPiecesHorizontal,
            type: bottomConnectorType,
            atDegrees: 270,
            isConnected: false,
            geometry: rotatedGeometry,
            distanceFromCorner: connectorDistanceFromCorner
         };

         piece.connectors.push(connector);

         const controlPoints = rotatedGeometry.controlPoints;
         const destinationPoint = rotatedGeometry.destinationPoint;

         svgString += `h -${connectorDistanceFromCorner} `;
         svgString += `c ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${destinationPoint.x} ${destinationPoint.y} `;
         svgString += `h -${connectorDistanceFromCorner}`;
      } else {
         svgString += `h -${piece.pieceBodySize}`;
      }

      if (leftConnectorType !== null) {
         const geometry = leftConnectorType === ConnectorType.Plug ? path.getPlugGeometry() : path.getSocketGeometry();
         const rotatedGeometry = JigsawPath.getRotatedCubicBezierCurve(geometry, 270);

         const connector = {
            ownerIndex: n,
            targetPieceIndex: n - 1,
            type: leftConnectorType,
            atDegrees: 360,
            isConnected: false,
            geometry: rotatedGeometry,
            distanceFromCorner: connectorDistanceFromCorner
         };

         piece.connectors.push(connector);

         const controlPoints = rotatedGeometry.controlPoints;
         const destinationPoint = rotatedGeometry.destinationPoint;

         svgString += `v -${connectorDistanceFromCorner} `;
         svgString += `c ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${destinationPoint.x} ${destinationPoint.y} `;
      }

      svgString += 'z';

      piece.svgString = svgString;

      let pieceWidth = piece.pieceBodySize;
      let pieceHeight = piece.pieceBodySize;

      const hasTopPlug = topConnectorType === ConnectorType.Plug;
      const hasTopSocket = topConnectorType === ConnectorType.Socket;
      const hasRightPlug = rightConnectorType === ConnectorType.Plug;
      const hasRightSocket = rightConnectorType === ConnectorType.Socket;
      const hasBottomPlug = bottomConnectorType === ConnectorType.Plug;
      const hasBottomSocket = bottomConnectorType === ConnectorType.Socket;
      const hasLeftPlug = leftConnectorType === ConnectorType.Plug;
      const hasLeftSocket = leftConnectorType === ConnectorType.Socket;

      if (hasTopPlug) {
         pieceHeight += connectorSize;
      }

      if (hasRightPlug) {
         pieceWidth += connectorSize;
      }

      if (hasBottomPlug) {
         pieceHeight += connectorSize;
      }

      if (hasLeftPlug) {
         pieceWidth += connectorSize;
      }

      piece.width = pieceWidth;
      piece.height = pieceHeight;

      piece.positionInPuzzle = {
         y: currentRow * piece.pieceBodySize,
         x: currentColumn * piece.pieceBodySize
      };

      pieces.push(piece);

      console.log('currentColumn', currentColumn);
      console.log('currentRow', currentRow);
      console.log('numberOfPiecesHorizontal', numberOfPiecesHorizontal);

      if (numberOfPiecesHorizontal - 1 === currentColumn) {
         currentColumn = 0;
         currentRow++;
      } else {
         currentColumn++;
      }

      console.log('current piece', piece);
      console.log('pieces', pieces);
      console.log('done');
   }

   return pieces;
};

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
};

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
export function generatePuzzleConfigsWithinConstraints(constraints: {
   availableWidth: number;
   availableHeight: number;
}): Puzzle[] {
   const { availableWidth, availableHeight } = constraints;

   console.log('generatePuzzlesWithinConstraints');
   console.log('availableWidth', availableWidth);
   console.log('availableHeight', availableHeight);

   const puzzleConfigs: Puzzle[] = [];

   let n: number = MINIMUM_NUMBER_OF_PIECES_PER_SIDE;
   let currentPieceSize: number;

   let puzzle = {} as Puzzle;

   do {
      if (availableWidth < availableHeight) {
         console.log('fn: generatePuzzlesWithinConstraints -> Generating portrait puzzles');

         currentPieceSize = availableWidth / n;
         console.log('currentPieceSize', currentPieceSize);
         console.log('minimum piece size', MINIMUM_PIECE_SIZE);

         const connectorSize = getConnectorSize(currentPieceSize);
         const connectorDistanceFromCorner = getConnectorDistanceFromCorner(currentPieceSize);
         const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

         const numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(availableHeight, pieceSize);

         puzzle.orientation = PuzzleOrientation.Portrait;
         puzzle.numberOfPiecesHorizontal = n;
         puzzle.numberOfPiecesVertical = numberOfPiecesOnLongSide;
         puzzle.totalNumberOfPieces = puzzle.numberOfPiecesHorizontal * puzzle.numberOfPiecesVertical;
         puzzle.width = pieceSize * n;
         puzzle.height = pieceSize * numberOfPiecesOnLongSide;
         puzzle.percentageOfImageUsedHorizontal = (puzzle.width / availableWidth) * 100;
         puzzle.percentageOfImageUsedVertical = (puzzle.height / availableHeight) * 100;
         puzzle.pieces = generatePieces(puzzle);
      } else if (availableHeight < availableWidth) {
         console.log('fn: generatePuzzlesWithinConstraints -> Generating landscape puzzles');

         currentPieceSize = availableHeight / n;

         console.log('currentPieceSize', currentPieceSize);
         console.log('minimum piece size', MINIMUM_PIECE_SIZE);

         const connectorSize = getConnectorSize(currentPieceSize);
         const connectorDistanceFromCorner = getConnectorDistanceFromCorner(currentPieceSize);
         const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

         const numberOfPiecesOnLongSide = getNumberOfPiecesForAdjacentSideByPieceSize(availableHeight, pieceSize);

         puzzle.orientation = PuzzleOrientation.Landscape;
         puzzle.numberOfPiecesHorizontal = numberOfPiecesOnLongSide;
         puzzle.numberOfPiecesVertical = n;
         puzzle.totalNumberOfPieces = puzzle.numberOfPiecesHorizontal * puzzle.numberOfPiecesVertical;
         puzzle.width = pieceSize * numberOfPiecesOnLongSide;
         puzzle.height = pieceSize * n;
         puzzle.percentageOfImageUsedHorizontal = (puzzle.width / availableWidth) * 100;
         puzzle.percentageOfImageUsedVertical = (puzzle.height / availableHeight) * 100;
         puzzle.pieces = generatePieces(puzzle);
      } else {
         console.log('fn: generatePuzzlesWithinConstraints -> Generating a square puzzle ');

         currentPieceSize = availableHeight / n;
         console.log('currentPieceSize', currentPieceSize);
         console.log('minimum piece size', MINIMUM_PIECE_SIZE);

         const connectorSize = getConnectorSize(currentPieceSize);
         const connectorDistanceFromCorner = getConnectorDistanceFromCorner(currentPieceSize);
         const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

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
            pieces: generatePieces(puzzle)
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
};

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
export function getNumberOfPiecesForAdjacentSideByPieceSize(edgeLength: number, pieceSize: number): number {
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
