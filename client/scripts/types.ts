import { nanoid } from "nanoid";
import GroupMovable from "./GroupMovable";
import { PocketMovable } from "./PocketMovable";
import { DebugOptions } from "./puzzlyCreator";
import SingleMovable from "./SingleMovable";

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

export type SingleMovableElement = HTMLDivElement;
export type GroupMovableElement = HTMLDivElement;
export type PocketMovableElement = HTMLDivElement;
export type MovableElement =
  | SingleMovableElement
  | GroupMovableElement
  | PocketMovableElement;

export type MovableInstance = SingleMovable | GroupMovable | PocketMovable;

export interface Connection {
  sourceElement: HTMLDivElement;
  type?: SideNames | undefined;
  targetElement?: HTMLDivElement;
  // TODO: Restrict number type to values between 1 and 360
  atDegrees?: number;
  adjacentDegrees?: number;
  isSolving: boolean;
}

export type ConnectorType = -1 | 0 | 1;
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
export interface JigsawPieceData {
  // This is actually the index of the piece
  id: number;
  index: number;
  // This is the true ID for the piece in the database
  _id: string;
  puzzleId: string;
  groupId: string;
  pocketId: number;
  imgX: number;
  imgY: number;
  puzzleX: number;
  puzzleY: number,
  width: number;
  height: number;
  basePieceSize: number;
  connectorDistanceFromCorner: number;
  connectorSize: number;
  connectorTolerance: number;
  connectors: Connector[];
  shadowOffset: number;
  puzzleWidth: number;
  puzzleHeight: number;
  imgW: number;
  imgH: number;
  pageX: number;
  pageY: number;
  size: number;
  zIndex: number;
  type: ConnectorType[];
  spriteX: number;
  spriteY: number;
  spritePath: string;
  spriteShadowX: number;
  spriteShadowY: number;
  solvedX: number;
  solvedY: number;
  isInnerPiece: boolean;
  isVisible: boolean;
  isSolved: boolean;
  connections: SideNames[];
  connectsTo: ConnectsTo;
  numPiecesFromTopEdge: number;
  numPiecesFromLeftEdge: number;
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  selectedNumPieces: number;
  svgPath: string;
  scale: number;
}

export interface GroupData {
  _id: string;
  puzzleId: string;
  piecesInGroup: JigsawPieceData;
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
  id: ReturnType<typeof nanoid>;
  ownerIndex: number;
  // The unique ID for the connector on the adjacecnt piece that connects to this one
  targetConnectorID?: ReturnType<typeof nanoid>;
  targetPieceIndex: number;
  type: ConnectorType,
  // Where this connector lives on this piece
  // ('degrees' being the orientation of the side this connector is on) 
  atDegrees: number,
  boundingBox?: BoundingBox,
  isConnected: boolean;
};

// Using 'pieceAbove' and 'pieceBehind' won't scale for wild piece shapes:
// adjacentPieces[] would be more flexible...
export type SkeletonPiece = Pick<
  JigsawPieceData,
  "type" | "numPiecesFromLeftEdge" | "numPiecesFromTopEdge"
> & {
  connectorDistanceFromCorner: number;
  connectorSize: number;
  connectorTolerance: number;
  connectors: Connector[];
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  pieceAbove: {
    type: ConnectorType[],
  };
  pieceBehind: {
    type: ConnectorType[],
  };
  puzzleWidth: number;
  puzzleHeight: number;
  // Need this for generating the SVG path to the correct proportions
  basePieceSize?: number;
  width?: number;
  height?: number;
  puzzleX?: number;
  puzzleY?: number;
  pageX?: number;
  pageY?: number;
};

export interface PuzzleConfig {
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  totalNumberOfPieces: number;
  pieceSize: number;
  percentageOfImageUsedHorizontal: number;
  percentageOfImageUsedVertical: number;
  connectorDistanceFromCorner: number;
  connectorSize: number;
  connectorTolerance: number;
  shadowOffset: number;
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
}

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
    pieces: JigsawPieceData[];
  }>;
  getJigsawShapeSvgString: (
    piece: SkeletonPiece,
    position?: {
      x: number;
      y: number
    }
  ) => string;
  generatePuzzleSprite: (
    imagePath: string,
    pieces: JigsawPieceData[]
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
  pieces: JigsawPieceData[];
  groups: GroupData[];
  latestSave: number;
}

export enum LocalStorageKeys {
  Progress = "LOCAL_STORAGE_PUZZLY_PROGRESS_KEY",
  LastSave = "LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY",
}

export interface SingleMovableSaveState {
  _id?: string;
  index: number;
  width: number;
  height: number;
  basePieceSize: number;
  connectorSize: number;
  connectorTolerance: number;
  connectorDistanceFromCorner: number;
  connectors: Connector[];
  groupId?: string;
  pageX: number;
  pageY: number;
  puzzleX: number;
  puzzleY: number;
  puzzleWidth: number;
  puzzleHeight: number;
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  type: ConnectorType[];
  zIndex: number;
  isSolved: boolean;
  puzzleId: string;
  pocketId: number | null;
  instanceType: InstanceTypes;
  integration?: boolean;
}

export interface GroupMovableSaveState {
  _id?: string;
  puzzleId: string;
  puzzleWidth: number;
  puzzleHeight: number;
  zIndex: number;
  instanceType: InstanceTypes;
  integration?: boolean;
  isSolved?: boolean;
  position: {
    top: number;
    left: number;
  };
  remove?: boolean;
  pieces: SingleMovableSaveState[];
}

export type SaveStates = SingleMovableSaveState | SingleMovableSaveState[] | GroupMovableSaveState;

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

export type PuzzleImpression = {
  index: number;
  puzzleConfig: PuzzleConfig;
  impressionWidth?: number;
  impressionHeight?: number;
  pieces: SkeletonPiece[]
};

export interface SaveOptions {
  isIntegration: boolean;
  isComplete: boolean;
}

export interface SinglePieceSavePayload {
  data: SingleMovableSaveState;
}

export interface MultiplePieceSavePayload {
  data: SingleMovableSaveState[];
}

export interface GroupSavePayload {
  data: GroupMovableSaveState;
}