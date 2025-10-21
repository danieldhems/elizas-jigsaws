import { nanoid } from "nanoid";
import GroupMovable from "./puzzle-main/GroupMovable";
import { PocketMovable } from "./puzzle-main/PocketMovable";
import { DebugOptions } from "./puzzle-creator";
import SingleMovable from "./puzzle-main/SingleMovable";

declare global {
  interface Window {
    Puzzly: any;
    Zoom: any;
    PuzzlyCreator: any;
    move: any;
  }
}

export enum InstanceTypes {
  SingleMovable = "SingleMovable",
  GroupMovable = "GroupMovable",
  PocketMovable = "PocketMovable",
  PlayBoundaryMovable = "PlayBoundaryMovable",
}

export interface PuzzleData {
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  totalNumberOfPieces: number;
  boardWidth: number;
  boardHeight: number;
  pieces: JigsawPiece[];
  puzzleId: string;
  zIndex?: number;
  puzzleImagePath: string;
  isComplete?: boolean;
  noDispersal?: boolean;
}

export type SingleMovableElement = HTMLDivElement;
export type GroupMovableElement = HTMLDivElement;
export type PocketMovableElement = HTMLDivElement;
export type MovableElement =
  | SingleMovableElement
  | GroupMovableElement
  | PocketMovableElement;

export type MovableInstance = SingleMovable | GroupMovable | PocketMovable;

export interface Connection {
  sourcePiece: SingleMovable;
  targetPiece?: SingleMovable;
  type?: SideNames | undefined;
  // TODO: Restrict number type to values between 1 and 360
  atDegrees?: number;
  adjacentDegrees?: number;
  isSolving: boolean;
}

export enum ConnectorType {
  Plug = 1,
  Socket = -1
};

export type ConnectorChoices = [ConnectorType.Plug, ConnectorType.Socket];

export enum ConnectorNames {
  Plug = "plug",
  Socket = "socket",
}
export type ConnectorControlPoints = {
  cp1: {
    x: number;
    y: number;
  };
  cp2: {
    x: number;
    y: number;
  };
  dest: {
    x: number;
    y: number;
  };
};

// Todo: These won't work for non-four-sided pieces - should be an array of ConnectorTypes instead
export enum SideNames {
  Top = "top",
  Right = "right",
  Bottom = "bottom",
  Left = "left",
  TopRight = "top-right",
  BottomRight = "bottom-right",
  BottomLeft = "bottom-left",
  TopLeft = "top-left",
}
export type CurrentConnections = [SideNames, SideNames, SideNames, SideNames];
export type ConnectsTo = Record<string, number>;


export interface GroupData {
  _id: string;
  id: string;
  puzzleId: string;
  pieces: JigsawPiece[];
  position: {
    top: number;
    left: number;
  };
  isSolved: boolean;
  zIndex: number;
}

export type DomBox = {
  width: number;
  height: number;
};

export type BoundingBox = {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export type DomBoxWithoutDimensions = Omit<DomBox, "width" | "height">;

export enum PuzzleShapes {
  Square = "square",
  Rectangle = "rectangle",
}

export enum MovementAxis {
  X = "x",
  Y = "y"
}

export enum MovementPropertyName {
  Top = "top",
  Left = "left"
}

export interface PuzzleCreatorOptions {
  debugOptions?: DebugOptions;
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  pieces?: any[];
  connectorSize?: number;
  isIntegration: boolean;
}

export type Connector = {
  ownerIndex: number;
  targetPieceIndex: number;
  connectorType: ConnectorType;
  // Where this connector lives on this piece
  // ('degrees' being the orientation of the side this connector is on) 
  atDegrees: number;
  boundingBox?: BoundingBox;
  isConnected: boolean;
};

export interface JigsawPiece {
  index: number; // Unique ID using simple index
  puzzleId: string; // Maps to puzzle's ObjectID
  groupId: string;
  pocketId: string;
  connectors: Connector[];
  connectorSize: number;
  pieceBodySize: number;
  width: number;
  height: number;
  connectorDistanceFromCorner: number;
  // Coordinate for this piece's position in the solved puzzle
  positionInPuzzle: {
    x: number;
    y: number;
  };
  // Current coordinate on the page while in play 
  // (will be ignored when this piece becomes sovled)
  currentPositionInPlay: {
    x: number;
    y: number;
  };
  zIndex: number;
  isInnerPiece: boolean;
  isVisible: boolean;
  isSolved: boolean;
  numPiecesFromTopEdge: number;
  numPiecesFromLeftEdge: number;
}

export interface PuzzleConfig {
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  totalNumberOfPieces: number;
  percentageOfImageUsedHorizontal: number;
  percentageOfImageUsedVertical: number;
  connectorTolerance: number;
  /** 
   * Width and height of the puzzle based on how much of the image it includes
   * (This will almost never match the image's dimensions exactly unless the user
   * uploads a perfectly square image, or one who's dimensions just-so-happen to match
   * a given puzzle config)
   */
  puzzleWidth: number;
  puzzleHeight: number;
  /**
   * True width and height of the uploaded image
   */
  // imageWidth: number;
  // imageHeight: number;
  aspectRatio?: number;
  pieces: JigsawPiece[];
}

export type PuzzleImpression = {
  index: number;
  puzzleConfig: PuzzleConfig;
  impressionWidth?: number;
  impressionHeight?: number;
  pieces: JigsawPiece[];
};

export enum PuzzleAxis {
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

export type PuzzleGenerator = {
  connectorRatio: number;
  piecesPerSideHorizontal: number;
  piecesPerSideVertical: number;
  selectedNumberOfPieces: number;
  pieceSize: number;
  connectorDistanceFromCorner: number;
  connectorSize: number;
  connectorLateralControlPointDistance: number;
  largestPieceSpan: number;
  strokeWidth: number;
  strokeColor: string;
  spriteSpacing: number;
  stageWidth: number;
  stageHeight: number;
  debugOptions?: {
    noDispersal: boolean;
  };
  image: HTMLImageElement;
  shadowColor: string;
  strokeStyle: string;
  generateDataForPuzzlePieces: () => Promise<{
    spriteEncodedString: string;
    pieces: JigsawPiece[];
  }>;
  getJigsawShapeSvgString: (
    piece: JigsawPiece,
    position?: {
      x: number;
      y: number
    }
  ) => string;
  generatePuzzleSprite: (
    imagePath: string,
    pieces: JigsawPiece[]
  ) => Promise<HTMLImageElement>;
  puzzleSizes: PuzzleConfig[];
};

export type PuzzleCreationResponse = PuzzleCreatorOptions & {
  _id: string;
  complete?: boolean;
  zIndex?: number;
  pieceSize: number;
  previewPath: string;
  puzzleImagePath: string;
  connectorDistanceFromCorner: number;
};

export interface SavedProgress {
  pieces: JigsawPiece[];
  groups: GroupData[];
  latestSave: number;
}

export enum LocalStorageKeys {
  Progress = "LOCAL_STORAGE_PUZZLY_PROGRESS_KEY",
  LastSave = "LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY",
}

export interface GroupMovableSaveState {
  id: string;
  zIndex: number;
  instanceType: InstanceTypes;
  integration?: boolean;
  position: {
    x: number;
    y: number;
  };
  pieces: JigsawPiece[];
}

export type SaveStates = JigsawPiece | JigsawPiece[] | GroupMovableSaveState;

export type PathPartHorizontalRelative = `h ${number}`;
export type PathPartVerticalRelative = `v ${number}`;
export type PathPartBezierControlPointRelative = `c ${PathPartControlPoint} ${PathPartControlPoint} ${PathPartControlPoint}`;
export type PathPartControlPoint = `${number} ${number}`;
export type PathParts =
  PathPartHorizontalRelative
  | PathPartVerticalRelative
  | PathPartBezierControlPointRelative
  | "";

export type XYCoordinate = Record<"x" | "y", number>;
export type TopLeftCoordinate = { top: number; left: number; };

export enum Orientation {
  Landscape = "Landscape",
  Portrait = "Portrait",
}

export type PieceSectors = {
  top: number;
  left: number;
  width: number;
  height: number;
}[];

export type PieceConnections = Record<SideNames, number>;

export enum SolvedPuzzlePreviewType {
  AlwaysOn = "AlwaysOn",
  Toggle = "Toggle",
}



export interface SaveOptions {
  isIntegration: boolean;
  isComplete: boolean;
}

export interface SinglePieceSavePayload {
  data: JigsawPiece;
}

export interface MultiplePieceSavePayload {
  data: JigsawPiece[];
}

export interface GroupSavePayload {
  data: GroupMovableSaveState;
}