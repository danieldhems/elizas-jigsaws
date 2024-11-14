import { LargeNumberLike } from "crypto";
import { CONNECTOR_SIZE_PERC, CONNECTOR_TOLERANCE_AMOUNT, PLAY_BOUNDARY_SIZE_IN_VIEWPORT_PERCENTAGE, SCREEN_MARGIN, SHADOW_COLOR, SHADOW_OFFSET_RATIO, SHOULDER_SIZE_PERC, STROKE_COLOR, STROKE_WIDTH, SVG_NAMESPACE } from "./constants";
import jigsawPath from "./jigsawPath";
import { getJigsawShapeSvgString } from "./svg";
import { ConnectorNames, ConnectorType, JigsawPieceData, PuzzleAxis, PuzzleCreatorOptions, PuzzleGenerator, PuzzleConfig, SideNames, SkeletonPiece, PuzzleImpression } from "./types";
import Utils from "./utils";



const Generator = {} as PuzzleGenerator;

const puzzleGenerator = async function (
  imagePath: string,
  puzzleConfig: PuzzleCreatorOptions
): Promise<PuzzleGenerator> {
  console.log("puzzle config", puzzleConfig);
  Generator.image = await loadImage(imagePath);
  Generator.debugOptions = puzzleConfig.debugOptions;
  Generator.piecesPerSideHorizontal = Math.sqrt(puzzleConfig.numberOfPiecesHorizontal);
  Generator.piecesPerSideVertical = Math.sqrt(puzzleConfig.numberOfPiecesVertical);
  // Generator.selectedNumberOfPieces = puzzleConfig.totalNumberOfPieces;

  Generator.strokeWidth = STROKE_WIDTH;
  Generator.strokeColor = STROKE_COLOR;
  Generator.shadowColor = SHADOW_COLOR;

  // TODO: Deprecated?
  Generator.connectorDistanceFromCorner =
    (Generator.pieceSize / 100) * SHOULDER_SIZE_PERC;

  Generator.connectorSize = Math.floor(
    (Generator.pieceSize / 100) * CONNECTOR_SIZE_PERC
  );

  Generator.largestPieceSpan =
    Generator.pieceSize + Generator.connectorSize * 2;

  Generator.spriteSpacing =
    Generator.piecesPerSideVertical * Generator.largestPieceSpan * 1.1;

  // console.log("Generator", Generator);

  return {
    ...Generator,
    generateDataForPuzzlePieces,
  };
};

export const getConnectorSize = (pieceSize: number) => {
  return pieceSize / 100 * CONNECTOR_SIZE_PERC;
}

export const getConnectorDistanceFromCorner = (pieceSize: number) => {
  return pieceSize / 100 * SHOULDER_SIZE_PERC;
}

export const getConnectorTolerance = (connectorSize: number) => {
  return connectorSize / 100 * CONNECTOR_TOLERANCE_AMOUNT;
}

const loadImage = (path: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // to avoid CORS if used with Canvas
    img.src = path;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
  });
};

// Deprecated?
const generateDataForPuzzlePieces = async () => {
  const pieces: JigsawPieceData[] = [];

  var curImgX = 0;
  var curImgY = 0;
  var numPiecesFromLeftEdge = 0;
  var numPiecesFromTopEdge = 0;

  let done = false;
  let i = 0;

  let adjacentPieceBehind = null;
  let adjacentPieceAbove = null;
  let endOfRow = false;
  let rowCount = 1;
  let finalRow = false;

  const cnv = createCanvas(
    Generator.spriteSpacing,
    Generator.spriteSpacing * 2
  );
  const ctx = cnv.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
  }

  while (!done) {
    let currentPiece = {} as JigsawPieceData;
    // All pieces not on top row
    if (pieces.length >= Generator.piecesPerSideHorizontal) {
      adjacentPieceAbove =
        pieces[pieces.length - Generator.piecesPerSideHorizontal];
    }

    // Last piece in row, next piece should be a corner or right side
    if (
      pieces.length > 1 &&
      pieces.length % (Generator.piecesPerSideHorizontal - 1) === 0
    ) {
      endOfRow = true;
    } else {
      endOfRow = false;
    }

    if (rowCount === Generator.piecesPerSideVertical) {
      finalRow = true;
    }

    const previousPiece = pieces[pieces.length - 1];
    const previewPieceRightSideConnector = parseInt(
      previousPiece?.type.join(",")[1]
    );
    if (pieces.length > 0 && previewPieceRightSideConnector !== 0) {
      adjacentPieceBehind = pieces[i - 1];
    }

    if (previousPiece?.type[1] === 0) {
      adjacentPieceBehind = null;
    }

    currentPiece.type = getConnectors(
      adjacentPieceBehind,
      adjacentPieceAbove,
      endOfRow,
      finalRow
    ) as ConnectorType[];

    currentPiece = assignInitialPieceData(
      curImgX,
      curImgY,
      currentPiece,
      numPiecesFromLeftEdge,
      numPiecesFromTopEdge,
      i
    );

    const svgPath = getJigsawShapeSvgString(currentPiece);
    currentPiece.svgPath = svgPath;

    // console.log("generated piece", currentPiece);

    pieces.push(currentPiece);

    if (ctx) {
      // await createPuzzlePiece(currentPiece, ctx);
    }

    // reached last piece, start next row
    if (pieces.length % Generator.piecesPerSideHorizontal === 0) {
      curImgX = 0;

      const firstPieceOnRowAbove =
        pieces[pieces.length - Generator.piecesPerSideHorizontal];

      curImgY =
        firstPieceOnRowAbove.imgY +
        firstPieceOnRowAbove.imgH -
        Generator.connectorSize;

      numPiecesFromLeftEdge = 0;
      numPiecesFromTopEdge++;

      rowCount++;
    } else {
      curImgX += currentPiece.imgW - Generator.connectorSize;

      if (rowCount > 1) {
        const nextPieceAbove =
          pieces[pieces.length - Generator.piecesPerSideHorizontal];

        const thisPieceHasTopPlug = currentPiece.type[0] === 1;
        const nextPieceAboveHasBottomPlug = nextPieceAbove.type[2] === 1;
        const thisPieceHasTopSocket = currentPiece.type[0] === -1;
        const nextPieceAboveHasBottomSocket = nextPieceAbove.type[2] === -1;

        if (thisPieceHasTopPlug && nextPieceAboveHasBottomPlug) {
          curImgY += Generator.connectorSize;
        } else if (thisPieceHasTopSocket && nextPieceAboveHasBottomSocket) {
          curImgY -= Generator.connectorSize;
        }
      }

      numPiecesFromLeftEdge++;
    }

    i++;

    if (i >= Generator.selectedNumberOfPieces) {
      done = true;
    }
  }

  return {
    spriteEncodedString: cnv.toDataURL(),
    pieces,
  };
};

export const generatePieces = (puzzleConfig: PuzzleConfig): SkeletonPiece[] => {
  const pieces: SkeletonPiece[] = [];
  let n = 0;

  let pieceAbove = {} as Pick<JigsawPieceData, "type">;
  let previousPiece = {} as Pick<JigsawPieceData, "type">;

  let rightConnector: ConnectorType;
  let bottomConnector: ConnectorType;
  let leftConnector: ConnectorType;
  let topConnector: ConnectorType;

  const { totalNumberOfPieces, numberOfPiecesHorizontal, numberOfPiecesVertical } = puzzleConfig;
  const connectorChoices = [-1, 1];

  const connectorSize = getConnectorSize(puzzleConfig.pieceSize);
  const connectorTolerance = getConnectorTolerance(connectorSize);
  const connectorDistanceFromCorner = getConnectorDistanceFromCorner(puzzleConfig.pieceSize);

  let currentIndexFromLeftEdge = 0;
  let currentIndexFromTopEdge = 0;

  while (n < puzzleConfig.totalNumberOfPieces) {
    const piece = {
      connectorSize,
      connectorDistanceFromCorner,
      connectorTolerance,
      basePieceSize: puzzleConfig.pieceSize,
      numberOfPiecesHorizontal,
      numberOfPiecesVertical,
    } as SkeletonPiece;

    if (n === 0) {
      // First piece
      topConnector = 0 as ConnectorType;
      rightConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType;
      bottomConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType;
      leftConnector = 0 as ConnectorType;

      piece.type = [topConnector, rightConnector, bottomConnector, leftConnector];
      piece.numPiecesFromTopEdge = 0;
      piece.numPiecesFromLeftEdge = 0;
    } else {
      // All other pieces
      pieceAbove = pieces[n - puzzleConfig.numberOfPiecesHorizontal];
      previousPiece = pieces[n - 1];

      piece.pieceAbove = pieceAbove;
      if (previousPiece.type[1] !== 0) {
        piece.pieceBehind = previousPiece;

        currentIndexFromLeftEdge++;
      } else {
        currentIndexFromLeftEdge = 0;
        currentIndexFromTopEdge++;
      }

      piece.numPiecesFromLeftEdge = currentIndexFromLeftEdge;
      piece.numPiecesFromTopEdge = currentIndexFromTopEdge;

      if (pieceAbove) {
        topConnector = Utils.getOppositeConnector(pieceAbove.type[2]) as ConnectorType;
      } else {
        topConnector = 0 as ConnectorType;
      }

      if (previousPiece.type[1] === 0) {
        // Previous piece was a right edge so make current piece a left edge
        leftConnector = 0 as ConnectorType;
      } else {
        leftConnector = Utils.getOppositeConnector(previousPiece.type[1]) as ConnectorType;
      }

      if ((n + 1) % puzzleConfig.numberOfPiecesHorizontal === 0) {
        // Right edge pieces
        rightConnector = 0 as ConnectorType;
      } else {
        rightConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType
      }

      if (n >= totalNumberOfPieces - numberOfPiecesHorizontal) {
        // Last row
        bottomConnector = 0 as ConnectorType;
      } else {
        bottomConnector = connectorChoices[Utils.getRandomInt(0, 1)] as ConnectorType;
      }

      piece.type = [topConnector, rightConnector, bottomConnector, leftConnector];
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
) => {
  const {
    pieceSize,
    connectorSize,
    connectorDistanceFromCorner,
    connectorTolerance,
    shadowOffset,
    puzzleWidth,
    puzzleHeight,
  } = puzzleConfig;

  return pieces.map((piece, index) => {
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
      shadowOffset,
      pageX,
      pageY,
      width,
      height,
    }
  })
}

const createCanvas = (width: number, height: number, id?: string) => {
  const el = document.createElement("canvas");
  if (id) {
    el.id = id;
  }
  el.width = width;
  el.height = height;
  return el;
};

export async function generatePuzzleSprite(imagePath: string, pieces: SkeletonPiece[]) {
  const image = await loadImage(imagePath);
  const referencePiece = pieces[0];
  const { puzzleWidth, puzzleHeight } = referencePiece;

  const puzzleCanvas = createCanvas(puzzleWidth, puzzleHeight, "puzzle-canvas");
  const puzzleCtx = puzzleCanvas.getContext("2d");

  if (puzzleCtx) {
    pieces.forEach(async (piece) => {
      await createPuzzlePiece(piece, puzzleCtx, image);
    })
  }

  return await loadImage(puzzleCanvas.toDataURL());
}

const createPuzzlePiece = async (
  data: SkeletonPiece,
  ctxForSprite: CanvasRenderingContext2D,
  puzzleImage: HTMLImageElement,
) => {
  /**
   * TODO: What if we don't need to use the canvas to create pieces?
   * 
   * Can we instead create an SVG element and set the puzzle image as its background,
   * then use clipPath with viewBox to produce the shape and position the image to get the
   * part we need for the piece?
   * 
   * Could this make the pieces look better AND speed up puzzle generation?
   */

  const pieceWidth = data.width as number;
  const pieceHeight = data.height as number;
  const puzzleX = data.puzzleX as number;
  const puzzleY = data.puzzleY as number;
  const numPiecesFromLeftEdge = data.numPiecesFromLeftEdge;
  const numPiecesFromTopEdge = data.numPiecesFromTopEdge;

  const shadowCnv = createCanvas(pieceWidth as number, pieceHeight as number);
  const shdCtx = shadowCnv.getContext("2d");
  shadowCnv.width = pieceWidth;
  shadowCnv.height = pieceHeight;

  const quarterWidth = pieceWidth / 4;
  const quarterHeight = pieceHeight / 4;

  // Using 'imgW' property for piece size assuming pieces are square-shaped
  // meaning we width and height are equal.
  const svgPath = getJigsawShapeSvgString(data);

  if (shdCtx) {
    shdCtx.fillStyle = Generator.shadowColor;
    const path = new Path2D(svgPath);
    shdCtx.fill(path);

    const shadowPosX = puzzleX === 0 ? 0 : numPiecesFromLeftEdge + quarterWidth + pieceWidth;
    const shadowPosY = puzzleY === 0 ? pieceHeight + quarterHeight : numPiecesFromTopEdge + pieceHeight + quarterHeight;

    const shadowImgData = shdCtx.getImageData(0, 0, pieceWidth, pieceHeight);
    // ctxForSprite.putImageData(
    //   shadowImgData,
    //   shadowPosX,
    //   shadowPosY
    // );
  }

  const tmpCnv = createCanvas(pieceWidth, pieceHeight);
  const tmpCtx = tmpCnv.getContext("2d");

  if (tmpCtx) {
    tmpCtx.strokeStyle = STROKE_COLOR;
    tmpCtx.lineWidth = STROKE_WIDTH;
    tmpCnv.width = pieceWidth;
    tmpCnv.height = pieceHeight;

    const p = new Path2D(svgPath);
    tmpCtx.clip(p);
    tmpCtx.drawImage(
      puzzleImage,
      puzzleX,
      puzzleY,
      pieceWidth,
      pieceHeight,
      0,
      0,
      pieceWidth,
      pieceHeight
    );
    tmpCtx.stroke(p);
  }

  document.body.prepend(tmpCnv);

  const img = await loadImage(tmpCnv.toDataURL());

  const posX = puzzleX === 0 ? 0 : numPiecesFromLeftEdge + quarterWidth;
  const posY = puzzleY === 0 ? 0 : numPiecesFromTopEdge + quarterHeight;

  ctxForSprite.drawImage(img, posX, posY);
};

const widthAndHeightWithConnectors = (piece: JigsawPieceData) => {
  let width = Generator.pieceSize;
  let height = Generator.pieceSize;

  if (piece.type[3] === 1) {
    width += Generator.connectorSize;
  }
  if (piece.type[1] === 1) {
    width += Generator.connectorSize;
  }
  if (piece.type[0] === 1) {
    height += Generator.connectorSize;
  }
  if (piece.type[2] === 1) {
    height += Generator.connectorSize;
  }

  return {
    width,
    height,
  };
};

const getConnectors = (
  adjacentPieceBehind: JigsawPieceData | null,
  adjacentPieceAbove: JigsawPieceData | null,
  endOfRow: boolean,
  finalRow: boolean
) => {
  let pieceAboveIsTopRightCorner,
    pieceAboveIsRightSide,
    pieceAboveIsTopLeftCorner,
    pieceAboveIsLeftSide,
    pieceAboveIsTopSide,
    pieceAboveIsInnerPiece,
    pieceBehindIsBottomLeftCorner,
    pieceBehindIsBottomSide,
    pieceAboveHasBottomPlug,
    pieceBehindHasRightPlug;

  if (adjacentPieceAbove) {
    pieceAboveIsTopRightCorner =
      adjacentPieceAbove.type[0] === 0 && adjacentPieceAbove.type[1] === 0;
    pieceAboveIsRightSide = adjacentPieceAbove?.type[1] === 0;
    pieceAboveIsTopLeftCorner =
      adjacentPieceAbove.type[3] === 0 && adjacentPieceAbove.type[0] === 0;
    pieceAboveIsLeftSide = adjacentPieceAbove.type[3] === 0;
    pieceAboveIsTopSide = adjacentPieceAbove.type[0] === 0;
    pieceAboveIsInnerPiece = !adjacentPieceAbove.type.includes(0);
    pieceAboveHasBottomPlug = adjacentPieceAbove.type[2] === 1;
  }

  if (adjacentPieceBehind) {
    pieceBehindIsBottomLeftCorner =
      adjacentPieceBehind.type[2] === 0 && adjacentPieceBehind.type[3] === 0;
    pieceBehindIsBottomSide = adjacentPieceBehind.type[2] === 0;
    pieceBehindHasRightPlug = adjacentPieceBehind.type[1] === 1;
  }

  const connectorChoices = [-1, 1] as ConnectorType[];

  // Top left corner piece
  if (!adjacentPieceBehind && !adjacentPieceAbove) {
    const rightConnector = connectorChoices[Math.floor(Math.random() * 2)];
    const bottomConnector = connectorChoices[Math.floor(Math.random() * 2)];
    return [0, rightConnector, bottomConnector, 0];
  }

  // First row pieces
  if (!adjacentPieceAbove) {
    const rightConnector = endOfRow
      ? 0
      : connectorChoices[Math.floor(Math.random() * 2)];
    const bottomConnector = connectorChoices[Math.floor(Math.random() * 2)];
    // piece behind has right plug?
    const leftConnector = pieceBehindHasRightPlug ? -1 : 1;
    return [0, rightConnector, bottomConnector, leftConnector];
  }
  // All pieces after top row
  else {
    // Last piece of each row, should be right side
    if (pieceAboveIsTopRightCorner || (!finalRow && pieceAboveIsRightSide)) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        0,
        connectorChoices[Math.floor(Math.random() * 2)],
        pieceBehindHasRightPlug ? -1 : 1,
      ] as ConnectorType[];
    }

    // First piece of each row, should be left side
    if (pieceAboveIsTopLeftCorner || (!finalRow && pieceAboveIsLeftSide)) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        connectorChoices[Math.floor(Math.random() * 2)],
        connectorChoices[Math.floor(Math.random() * 2)],
        0,
      ] as ConnectorType[];
    }

    // All middle pieces
    if ((!finalRow && pieceAboveIsInnerPiece) || pieceAboveIsTopSide) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        connectorChoices[Math.floor(Math.random() * 2)],
        connectorChoices[Math.floor(Math.random() * 2)],
        pieceBehindHasRightPlug ? -1 : 1,
      ] as ConnectorType[];
    }

    if (finalRow && pieceAboveIsLeftSide) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        connectorChoices[Math.floor(Math.random() * 2)],
        0,
        0,
      ] as ConnectorType[];
    }

    if (
      finalRow &&
      pieceAboveIsInnerPiece &&
      (pieceBehindIsBottomLeftCorner || pieceBehindIsBottomSide)
    ) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        connectorChoices[Math.floor(Math.random() * 2)],
        0,
        pieceBehindHasRightPlug ? -1 : 1,
      ] as ConnectorType[];
    }

    // Very last piece, should be corner bottom right
    if (pieceAboveIsRightSide && pieceBehindIsBottomSide) {
      return [
        pieceAboveHasBottomPlug ? -1 : 1,
        0,
        0,
        pieceBehindHasRightPlug ? -1 : 1,
      ] as ConnectorType[];
    }
  }
};

const getRandomInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const assignInitialPieceData = (
  imgX: number,
  imgY: number,
  piece: JigsawPieceData,
  numPiecesFromLeftEdge: number,
  numPiecesFromTopEdge: number,
  i: number
) => {
  let { width, height } = widthAndHeightWithConnectors(piece);

  const piecePositionOnSprite = {
    x: Math.floor(Generator.largestPieceSpan * 1.1 * numPiecesFromLeftEdge),
    y: Math.floor(Generator.largestPieceSpan * 1.1 * numPiecesFromTopEdge),
  };

  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  const rightLimit =
    stageWidth -
    Generator.largestPieceSpan -
    stageWidth / 100;
  const bottomLimit =
    stageHeight -
    Generator.largestPieceSpan -
    stageHeight / 100;

  const randPos = {
    x: getRandomInt(1, rightLimit),
    y: getRandomInt(1, bottomLimit),
  };

  return Object.assign(
    {
      id: i,
      imgX: imgX,
      imgY: imgY,
      // Width and height that will be used to draw from the source image
      imgW: Math.floor(width),
      imgH: Math.floor(height),
      spriteX: piecePositionOnSprite.x,
      spriteY: piecePositionOnSprite.y,
      spriteShadowX: piecePositionOnSprite.x,
      spriteShadowY: piecePositionOnSprite.y + Generator.spriteSpacing,
      pageX: Generator.debugOptions?.noDispersal
        ? piecePositionOnSprite.x
        : randPos.x,
      pageY: Generator.debugOptions?.noDispersal
        ? piecePositionOnSprite.y
        : randPos.y,
      solvedX: imgX,
      solvedY: imgY,
      isInnerPiece: piece.type.join(",").indexOf("0") === -1,
      isVisible: true,
      connections: [],
      numPiecesFromLeftEdge,
      numPiecesFromTopEdge,
    },
    piece
  );
};

export function getPuzzleConfigs(
  availableWidth: number,
  availableHeight: number,
  minimumPieceSize: number,
  minimumNumberOfPieces: number
): {
  rectangularPuzzleConfigs: PuzzleConfig[];
  squarePuzzleConfigs: PuzzleConfig[];
} {
  console.log("getPuzzleConfigs: availableWidth", availableWidth)
  console.log("getPuzzleConfigs: availableHeight", availableHeight)

  const shortSide: PuzzleAxis | null =
    availableWidth < availableHeight
      ? PuzzleAxis.Horizontal
      : availableHeight < availableWidth
        ? PuzzleAxis.Vertical
        : null;

  console.log("getPuzzleConfigs: short side", shortSide)

  let n: number = Math.sqrt(minimumNumberOfPieces);

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
    const shadowOffset = (divisionResult / 100 * SHADOW_OFFSET_RATIO);

    const connectorSize = getConnectorSize(divisionResult);
    const connectorDistanceFromCorner = getConnectorDistanceFromCorner(divisionResult);

    const pieceSize = connectorDistanceFromCorner * 2 + connectorSize;

    const puzzleConfig = {} as PuzzleConfig;



    if (shortSide) {
      puzzleConfig.pieceSize = pieceSize;
      puzzleConfig.connectorSize = connectorSize;
      puzzleConfig.connectorTolerance = connectorTolerance;
      puzzleConfig.shadowOffset = shadowOffset;
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
      shadowOffset,
      connectorDistanceFromCorner,
      availableWidth,
      availableHeight,
      puzzleWidth: pieceSize * n,
      puzzleHeight: pieceSize * n,
      percentageOfImageUsedHorizontal: (pieceSize * n) / availableWidth * 100,
      percentageOfImageUsedVertical: (pieceSize * n) / availableHeight * 100,
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

export const getPiecePositionBasedOnAdjacentPieces = (
  piece: SkeletonPiece,
  currentPosition: { x: number, y: number },
  connectorSize: number
): { x: number; y: number } => {
  return {
    x: piece.pieceBehind?.type[1] === -1 ? currentPosition.x - connectorSize : currentPosition.x,
    y: piece.pieceAbove?.type[2] === -1 ? currentPosition.y - connectorSize : currentPosition.y,
  }
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
    const piecePosition = {
      x: 0,
      y: 0,
    }
    const currentConfig = puzzleConfigs[nConf];
    const pieces = generatePieces(currentConfig);

    const element = document.createElement("div");
    element.dataset.impressionIndex = nConf + '';
    element.id = "puzzle-" + currentConfig.totalNumberOfPieces;
    // element.classList.add("js-hidden");

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

    for (let n = 0, l = pieces.length; n < l; n++) {
      const currentPiece = pieces[n];

      const pathElement = document.createElementNS(SVG_NAMESPACE, "path");
      pathElement.setAttribute("id", "piece-" + n);
      svgElement.appendChild(pathElement);

      const shape = getJigsawShapeSvgString(
        currentPiece,
        getPiecePositionBasedOnAdjacentPieces(
          currentPiece,
          piecePosition,
          currentConfig.connectorSize
        ),
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
