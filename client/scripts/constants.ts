/**
 * MISC
 */
export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const SquareShapedPuzzleDefinitions = [
  { numPieces: 9, piecesPerSide: 3 },
  { numPieces: 16, piecesPerSide: 4 },
  { numPieces: 25, piecesPerSide: 5 },
  { numPieces: 36, piecesPerSide: 6 },
  { numPieces: 49, piecesPerSide: 7 },
  { numPieces: 64, piecesPerSide: 8 },
  { numPieces: 81, piecesPerSide: 9 },
  { numPieces: 100, piecesPerSide: 10 },
  { numPieces: 121, piecesPerSide: 11 },
  { numPieces: 144, piecesPerSide: 12 },
  { numPieces: 169, piecesPerSide: 13 },
  { numPieces: 196, piecesPerSide: 14 },
  { numPieces: 256, piecesPerSide: 16 },
  { numPieces: 324, piecesPerSide: 18 },
  { numPieces: 484, piecesPerSide: 22 },
  { numPieces: 576, piecesPerSide: 24 },
  { numPieces: 676, piecesPerSide: 26 },
];

/**
 * MINIMUMS
 */

export const MINIMUM_PIECE_SIZE = 40;
export const MINIMUM_PIECE_SIZE_AS_PERCENTAGE_OF_VIEWPORT = 5;
export const MINIMUM_NUMBER_OF_PIECES_PER_SIDE = 5;

export const MINIMUM_VIEWPORT_LENGTH_FOR_OUTOFBOUNDS_TO_BE_USED = 1024;

export const PUZZLE_SIZE_LANDSCAPE_VIEWPORT_LANDSCAPE_IMAGE = 40;
export const PUZZLE_SIZE_LANDSCAPE_VIEWPORT_PORTRAIT_IMAGE = 50;
export const PUZZLE_SIZE_PORTRAIT_VIEWPORT_PORTRAIT_IMAGE = 40;
export const PUZZLE_SIZE_PORTRAIT_VIEWPORT_LANDSCAPE_IMAGE = 50;
export const PUZZLE_SIZE_SQUARE_IMAGE = 40;

/**
 * LAYOUT
 */

export const INITIAL_ZINDEX_FOR_PIECES = 3;

// How much of the viewport a given element occupies, expressed as a percentage of the shorter side
// (Depending on the viewport size, this value will be a percentage of either window.innerWidth or window.innerHeight)
export const PLAY_BOUNDARY_SIZE_IN_VIEWPORT_PERCENTAGE = 60;

// Percentage of viewport size to use as spacing between pieces when they are neatened
export const LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_PERCENTAGE = 5;
export const LAYOUTS_NEATEN_SPACE_BETWEEN_PIECES_AMOUNT = 5;

/**
 * Puzzle pieces
 */

// How big the connectors should be (how far they stick of from the piece's body), expressed as a percentage of the body of the piece
// This may need to be re-addressed when we approach wild shapes as we may prefer to randomise this.
export const CONNECTOR_SIZE_PERC = 30;
// How far in from the corner the connector should be.
export const SHOULDER_SIZE_PERC = 35;

export const SVG_SHADOW_COLOR = "#252525";
export const SVG_STROKE_WIDTH = 1;
export const SVG_STROKE_COLOR = "#252525";

export const CONNECTOR_TOLERANCE_AMOUNT = 50;

export const CONNECTOR_DIVISOR_FOR_CONTROL_POINT_HANDLE = 2;
export const CONNECTOR_MULTIPLIER_FOR_HUMP_SIZE = 1.2;

export const PIECE_SCALE_INSIDE_POCKETS = .8;

export const LOCAL_STORAGE_PUZZLY_PROGRESS_KEY =
  "LOCAL_STORAGE_PUZZLY_PROGRESS_KEY";
export const LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY =
  "LOCAL_STORAGE_PUZZLY_LAST_SAVE_KEY";

/**
 * Query string params
 */

export const QUERY_STRING_PARAM_SHOW_CONNECTOR_BOXES = "showConnectorBoxes";

// HTML classes
// TODO: Check whether array is still necessary for this
export const PUZZLE_PIECE_CLASSES = ["puzzle-piece"];

export const ZOOM_INTERVALS = [1, 1.5, 2.5];
export const ZOOM_AMOUNT = .1;

/**
 * HTML Elements
 */

export const ELEMENT_IDS = {
  SOLVED_PUZZLE_AREA: "solved-puzzle-area",
  SOLVED_CONTAINER: "group-container-1111",
  SOLVED_CANVAS: "group-canvas-1111",
  PLAY_BOUNDARY: "play-boundary",
  STAGE: "stage",
  PIECES_CONTAINER: "pieces-container",
  BRIDGE: "bridge",
  POCKETS: "pockets",
  DRAGANDSELECT_CONTAINER: "selected-pieces-container",
  POCKET_DRAG_CONTAINER: "active-pieces-container",
};

export const EVENT_TYPES = {
  PIECE_PICKUP: "PIECE_PICKUP",
  PIECE_DROP: "PIECE_DROP",
  CHANGE_SCALE: "CHANGE_SCALE",
  PUZZLE_LOADED: "PUZZLE_LOADED",
  RESIZE: "RESIZE",
  CLEAR_BRIDGE: "CLEAR_BRIDGE",
  DRAGANDSELECT_ACTIVE: "DRAGANDSELECT_ACTIVE",
  DRAGANDSELECT_PIECES_SELECTED: "DRAGANDSELECT_PIECES_SELECTED",
  ADD_TO_POCKET: "ADD_TO_POCKET",
  POCKET_PICKUP: "POCKET_PICKUP",
  POCKET_PUTDOWN: "POCKET_PUTDOWN",
  RETURN_TO_CANVAS: "RETURN_TO_CANVAS",
  MOVE_FINISHED: "MOVE_FINISHED",
  CONNECTION_MADE: "CONNECTION_MADE",
  SAVE: "SAVE",
  SAVE_IN_PROGRESS: "SAVE_IN_PROGRESS",
  SAVE_SUCCESSFUL: "SAVE_SUCCESSFUL",
  NEW_GROUP: "NEW_GROUP",
  GROUP_CREATED: "GROUP_CREATED",
  PIECE_UPDATED: "PIECE_UPDATED",
  PUZZLY_PIECES_SOLVED: "PUZZLY_PIECES_SOLVED",
};

export const SIDES = {
  TOP: "TOP",
  RIGHT: "RIGHT",
  BOTTOM: "BOTTOM",
  LEFT: "LEFT",
};

export const SHAPE_TYPES = {
  PLAIN: 1,
  NATURAL: 2,
};

export const SHADOW_OFFSET_RATIO = 3;
export const FLOAT_TOLERANCE_AMOUNT = 20;

export const SCREEN_MARGIN = 10;

export const SVGNS = "http://www.w3.org/2000/svg";

export const HTML_ATTRIBUTE_NAME_SVG_PATH_STRING = "data-svg-path-string";

export const DEFAULT_ANIMATION_MS = 200;