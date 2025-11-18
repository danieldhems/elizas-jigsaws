import GroupMovable from "./puzzle-main/GroupMovable";
import { PocketMovable } from "./puzzle-main/PocketMovable";
import { DebugOptions } from "./puzzle-creator/PuzzlyCreator";
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
  pieces: PuzzlePiece[];
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
  pieces: PuzzlePiece[];
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
  // Index for the puzzle piece this connector belongs to
  ownerIndex: number;
  // Index for the puzzle piece this connector connects to
  targetPieceIndex: number;
  type: ConnectorType;
  // Where this connector lives on this piece
  // ('degrees' being the orientation of the side this connector is on) 
  atDegrees: number;
  // Bounding box relative to the puzzle piece
  boundingBox?: BoundingBox;
  isConnected: boolean;
  geometry: CubicBezierConnectorGeometry;
  distanceFromCorner: number;
};

export interface Point {
  x: number;
  y: number;
}

export interface QuadraticConnectorGeometry {
  // An array of x,y coords should allow quadratic and cubic bezier curves
  controlPoints: Point;
  destinationPoint: Point;
}

export interface CubicBezierConnectorGeometry {
  // An array of x,y coords should allow quadratic and cubic bezier curves
  controlPoints: [Point, Point];
  destinationPoint: Point;
}

export interface PuzzlePiece {
  index: number; // Unique ID using simple index
  puzzleId: string; // Maps to puzzle's ObjectID
  groupId?: string;
  pocketId?: number;
  pieceBodySize: number;
  connectorSize: number;
  connectorDistanceFromCorner: number;
  connectors: Connector[];
  connections: SideNames[];
  connectsTo: number[];
  svgString: string;
  width: number;
  height: number;
  // Coordinate for this piece's position in the solved puzzle
  positionInPuzzle: {
    x: number;
    y: number;
  };
  svgPath: string;
  // Current coordinate on the page while in play 
  // (will be ignored when this piece becomes sovled)
  currentPositionInPlay: {
    x: number;
    y: number;
  };
  zIndex: number;
  pieceType: PieceType;
  isVisible: boolean;
  isSolved: boolean;
  numPiecesFromTopEdge: number;
  numPiecesFromLeftEdge: number;
}

export interface PuzzlePieceSaveData {
  currentPositionInPlay: PuzzlePiece['currentPositionInPlay'];
  zIndex: PuzzlePiece['zIndex'];
  pocketId: PuzzlePiece['pocketId'];
  groupId: PuzzlePiece['groupId'];
  isSolved: PuzzlePiece['isSolved'];
}

export enum PieceType {
  TopLeftCorner = 'Top-left-corner',
  TopSide = 'Top-side',
  TopRightCorner = 'Top-right-corner',
  RightSide = 'Right-side',
  BottomRightCorner = 'Bottom-right-corner',
  BottomSide = 'Bottom-side',
  BottomLeftCorner = 'Bottom-left-corner',
  LeftSide = 'Left-side',
  Inner = 'Inner'
}
export interface Puzzle {
  numberOfPiecesHorizontal: number;
  numberOfPiecesVertical: number;
  totalNumberOfPieces: number;
  percentageOfImageUsedHorizontal: number;
  percentageOfImageUsedVertical: number;
  /** 
   * Width and height of the puzzle based on how much of the image it includes
   * (This will almost never match the image's dimensions exactly unless the user
   * uploads a perfectly square image, or one who's dimensions just-so-happen to match
   * a given puzzle config)
   */
  width: number;
  height: number;
  /**
   * True width and height of the uploaded image
   */
  // imageWidth: number;
  // imageHeight: number;
  pieces: PuzzlePiece[];
  orientation: PuzzleOrientation;
}

export enum PuzzleOrientation {
  Landscape = "Landscape",
  Portrait = "Portrait",
  Square = "Square"
};

export enum PuzzleAxis {
  Horizontal = "Horizontal",
  Vertical = "Vertical",
}

export type PuzzleCreationResponse = PuzzleCreatorOptions & {
  _id: string;
  complete?: boolean;
  zIndex?: number;
  previewPath: string;
  puzzleImagePath: string;
};

export interface SavedProgress {
  pieces: PuzzlePiece[];
  groups: GroupData[];
  latestSave: number;
}

export enum LocalStorageKeys {
  Progress = "LOCAL_STORAGE_PUZZLY_PROGRESS_KEY",
  LastSave = "LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY",
}

export interface GroupMovableSaveState {
  id: string;
  puzzleId: string;
  zIndex: number;
  integration?: boolean;
  currentPositionInPlay: {
    x: number;
    y: number;
  };
  pieces: PuzzlePieceSaveData[];
  // TODO: Do we need this?
  // Groups should be automatically deleted when solved,
  // so I'm not sure whether we'd need to hold on to this state locally.
  isSolved?: boolean;
}

export type SaveStates = PuzzlePiece | PuzzlePiece[] | GroupMovableSaveState;

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
  Square = "Square",
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
  data: PuzzlePiece;
}

export interface MultiplePieceSavePayload {
  data: PuzzlePiece[];
}

export interface GroupSavePayload {
  data: GroupMovableSaveState;
}