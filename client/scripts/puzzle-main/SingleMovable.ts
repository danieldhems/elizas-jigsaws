import BaseMovable from "./BaseMovable";
import { checkConnections } from "./checkConnections";
import { EVENT_TYPES, HTML_ATTRIBUTE_NAME_SVG_PATH_STRING, SHAPE_TYPES } from "../constants";
import GroupMovable from "./GroupMovable";
import PathOperations from "./pathOperations";
import Puzzly from ".";
import { getJigsawShapeSvgString, getSvg } from "../puzzle-creator/svg";

import { nanoid } from "nanoid";
import {
  BoundingBox,
  Connection,
  Connector,
  ConnectorType,
  PieceType,
  InstanceTypes,
  PuzzlePiece,
  XYCoordinate,
  PuzzlePieceSaveData
} from "../types";
import Utils from "../utils";

export default class SingleMovable extends BaseMovable {
  instanceType = InstanceTypes.SingleMovable;
  shapeType = SHAPE_TYPES.PLAIN;
  pieceData: PuzzlePiece;
  connectors: Connector[];
  puzzleId: string;
  index: number;
  id: string;
  groupId: string | null;
  groupInstance: GroupMovable | null;
  piecesPerSideHorizontal: number;
  piecesPerSideVertical: number;
  totalNumberOfPieces: number;
  isSolved: boolean;
  pieceType: PieceType;
  pocketId?: number | null;
  // Currently using piece index to minimise changes, for now
  connectsTo: number[];
  // Currently using piece index to minimise changes, for now
  connections: number[];
  jigsawType: ConnectorType[];

  constructor({
    puzzleData,
    pieceData,
  }: {
    puzzleData: Puzzly;
    pieceData: PuzzlePiece;
  }) {
    super(puzzleData);

    this.connectsTo = this.getConnectingPieceIds(pieceData) as number[];
    this.connections = [];

    this.puzzleId = window.Puzzly.puzzleId;
    this.index = pieceData.index;
    this.totalNumberOfPieces = window.Puzzly.selectedNumPieces;
    this.isSolved = pieceData.isSolved;
    this.pieceType = pieceData.pieceType;

    this.piecesPerSideHorizontal = window.Puzzly.piecesPerSideHorizontal;
    this.shadowOffset = puzzleData.shadowOffset;
    this.connectorDistanceFromCorner = puzzleData.connectorDistanceFromCorner;
    this.pocketId = pieceData.pocketId;

    if (pieceData.groupId) {
      this.groupId = pieceData.groupId;
    }

    this.connectors = pieceData.connectors;

    this.setPiece(pieceData);
    this.element = this.createElement();

    if (!window.Puzzly.complete && !pieceData.groupId && !pieceData.isSolved) {
      this.render();
      this.setLastPosition();

      this.element.addEventListener("mousedown", this.onMouseDown.bind(this));

      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onMouseOut = this.onMouseOut.bind(this);
    }
  }

  setPiece(pieceData: PuzzlePiece) {
    this.pieceData = pieceData;
    // console.log(" setting piecedata", this.pieceData);
  }

  createElement() {
    const {
      index,
      groupId,
      width,
      height,
      pieceBodySize,
      zIndex,
      pieceType,
      isSolved,
      numPiecesFromTopEdge,
      numPiecesFromLeftEdge,
      pocketId,
      positionInPuzzle,
      currentPositionInPlay,
      svgPath,
    } = this.pieceData;

    // console.log("SingleMovable", this.pieceData)

    const shadowOffset = window.Puzzly.shadowOffset;

    const el = document.createElement("div");
    el.classList.add("puzzle-piece");
    el.id = "piece-" + index;

    el.style.position = "absolute";
    el.style.width = width + shadowOffset + "px";
    el.style.height = height + shadowOffset + "px";

    if (pocketId === undefined || pocketId === null || pocketId === -1) {
      el.style.top = (!!groupId ? positionInPuzzle.y : currentPositionInPlay.y) + "px";
      el.style.left = (!!groupId ? positionInPuzzle.x : currentPositionInPlay.x) + "px";
    }

    el.style.pointerEvents = "none";
    el.setAttribute("data-piece-body-size", pieceBodySize + "");
    el.setAttribute("data-shadow-offset", this.shadowOffset + "");
    el.setAttribute("data-piece-index", index + "");
    el.setAttribute("data-puzzle-id", this.puzzleId);
    el.setAttribute("data-position-in-puzzle-x", positionInPuzzle.x + "");
    el.setAttribute("data-position-in-puzzle-y", positionInPuzzle.y + "");
    el.setAttribute("data-current-position-in-play-x", currentPositionInPlay.x + "");
    el.setAttribute("data-current-position-in-play-y", currentPositionInPlay.y + "");
    el.setAttribute("data-svgPath", svgPath);
    el.setAttribute("data-piece-type", pieceType + "");
    el.setAttribute(
      "data-pieces-per-side-horizontal",
      window.window.Puzzly.numberOfPiecesHorizontal + ""
    );
    el.setAttribute(
      "data-pieces-per-side-vertical",
      window.Puzzly.numberOfPiecesVertical + ""
    );
    el.setAttribute('data-connects-to', JSON.stringify(this.getConnectingPieceIds(this.pieceData)));
    el.setAttribute(
      "data-connections",
      JSON.stringify(window.Puzzly.GroupOperations.getConnections(el))
    );


    el.setAttribute("data-num-pieces-from-top-edge", numPiecesFromTopEdge + "");
    el.setAttribute(
      "data-num-pieces-from-left-edge",
      numPiecesFromLeftEdge + ""
    );
    el.setAttribute("data-total-number-of-pieces", this.totalNumberOfPieces + "");
    el.setAttribute("data-is-solved", isSolved + "");

    this.element = el;

    if (groupId) {
      el.dataset.groupId = groupId;
      el.classList.add("grouped");
    }

    if (pocketId) {
      el.setAttribute("data-pocket-id", pocketId + "");
    }

    const { puzzleImagePath } = window.Puzzly;

    // TODO: svg.ts is already generating and rendering the svg string so this might not be needed, and could be confusing.
    const pathString = getJigsawShapeSvgString(this.pieceData);
    el.setAttribute(HTML_ATTRIBUTE_NAME_SVG_PATH_STRING, pathString);

    const svgWidth = width + shadowOffset;
    const svgHeight = height + shadowOffset;

    const svgOptions = {
      svgWidth,
      svgHeight,
      imageWidth: window.Puzzly.puzzleWidth,
      imageHeight: window.Puzzly.puzzleHeight,
      imagePosition: positionInPuzzle,
      shadowOffset: window.Puzzly.shadowOffset,
      viewbox: `0 0 ${width + shadowOffset} ${height + shadowOffset}`,
    }

    el.innerHTML = getSvg(
      `piece-${this.pieceData.index}`,
      [],
      puzzleImagePath,
      svgOptions,
    );

    // el.innerHTML = svgElementTemplate;
    return el;
  }

  render() {
    const { isSolved, pocketId } = this.pieceData;

    if (!isSolved) {
      this.setConnectorBoundingBoxes()
    }

    if (Number.isInteger(pocketId) && pocketId !== -1) {
      const pocketElement = window.Puzzly.Pockets.container.querySelector(
        `#pocket-${pocketId}`
      );

      window.Puzzly.Pockets.addSingleToPocket(pocketElement as HTMLDivElement, this);
    } else {
      this.addToStage();
    }
  }

  addToStage() {
    (window.Puzzly.piecesContainer as HTMLDivElement).prepend(this.element);
  }

  /**
   * TODO: Abstract connector logic to own class
   */

  getConnectorByDegrees(atDegrees: number): Connector {
    return this.connectors.find((connector: Connector) => connector.atDegrees = atDegrees) as Connector;
  }

  /**
   * Calculate the bounding boxes for this piece's connectors relative to the piece's 
   * perimeter.
   * 
   * These boxes can be added to the piece's position to determine the true bounding box 
   * for the connectors on the stage. Calculating these values and setting them as a 
   * data-attribute is an attempt to improve performance during collision detection as
   * there should be less math to do.
   * 
   */
  setConnectorBoundingBoxes() {
    const pathString = this.element.getAttribute(HTML_ATTRIBUTE_NAME_SVG_PATH_STRING) as string;
    const result = PathOperations.extractPathParts(pathString);
    const connectors = PathOperations.getCurveControlPointsFromPathParts(result) as XYCoordinate[][];

    const connectorBoundingBoxes: BoundingBox[] = connectors.map((connector) => {
      const [...points] = connector;

      const allXValues = points.map(p => p.x);
      const allYValues = points.map(p => p.y);
      const lowestY = Math.min(...allYValues);
      const highestY = Math.max(...allYValues);
      const lowestX = Math.min(...allXValues);
      const highestX = Math.max(...allXValues);

      return {
        top: lowestY,
        left: lowestX,
        right: highestX,
        bottom: highestY,
      };
    });

    connectorBoundingBoxes.forEach((boundingBox: BoundingBox, n: number) => {
      // Utils.drawBox(boundingBox, this.element)
      this.connectors[n].boundingBox = boundingBox;
    })
  }

  getCurrentBoundingBoxForConnector(atDegrees: number): BoundingBox | undefined {
    const stagePosition = Utils.getStyleBoundingBox(window.Puzzly.playBoundary as HTMLDivElement);

    let top, left;

    if (this.groupInstance) {
      const groupBoundingBox = Utils.getStyleBoundingBox(this.groupInstance.element);
      top = stagePosition.top + groupBoundingBox.top + this.pieceData.positionInPuzzle.y;
      left = stagePosition.left + groupBoundingBox.left + this.pieceData.positionInPuzzle.x;
    } else if (this.isSolved) {
      const solvingAreaPosition = Utils.getStyleBoundingBox(window.Puzzly.SolvingArea.element as HTMLDivElement);
      top = stagePosition.top + solvingAreaPosition.top + this.pieceData.positionInPuzzle.y;
      left = stagePosition.left + solvingAreaPosition.left + this.pieceData.positionInPuzzle.x;
    } else {
      const boundingBox = Utils.getStyleBoundingBox(this.element);
      top = stagePosition.top + boundingBox.top;
      left = stagePosition.left + boundingBox.left;
    }

    const connector = this.connectors.find((connector) => {
      return connector.atDegrees === atDegrees
    });

    if (connector && connector.boundingBox) {
      return {
        top: top + connector.boundingBox.top,
        left: left + connector.boundingBox.left,
        right: left + connector.boundingBox.right,
        bottom: top + connector.boundingBox.bottom,
      }
    }
  }

  getSolvedBoundingBoxes(): BoundingBox[] {
    const stagePosition = Utils.getStyleBoundingBox(window.Puzzly.playBoundary as HTMLDivElement);
    const solvingAreaPosition = Utils.getStyleBoundingBox(window.Puzzly.SolvingArea.element as HTMLDivElement);
    const relativeBoundingBoxes = this.connectors.map((connector) => connector.boundingBox);

    const anchorTop = stagePosition.top + solvingAreaPosition.top + this.pieceData.positionInPuzzle.y;
    const anchorLeft = stagePosition.left + solvingAreaPosition.left + this.pieceData.positionInPuzzle.x;

    return relativeBoundingBoxes.map((box: BoundingBox) => ({
      top: anchorTop + box.top,
      left: anchorLeft + box.left,
      right: anchorLeft + box.right,
      bottom: anchorTop + box.bottom,
    }))
  }

  hasMouseDown(element: HTMLElement) {
    return element.id === this.element.id;
  }

  isOutOfBounds(event: MouseEvent) {
    return !this.isInsidePlayArea() && !this.isOverPockets(event);
  }

  getConnectingPieceIds(
    data: Pick<PuzzlePiece, "index" | "pieceType">
  ) {
    const { index, pieceType } = data
    const pieceAboveId = index - window.Puzzly.numberOfPiecesHorizontal;
    const pieceBelowId = index + window.Puzzly.numberOfPiecesHorizontal;

    switch (pieceType) {
      case PieceType.TopLeftCorner:
        return [
          index + 1,
          pieceBelowId,
        ];
      case PieceType.TopSide:
        return [
          index - 1,
          index + 1,
          pieceBelowId,
        ];
      case PieceType.TopRightCorner:
        return [
          index - 1,
          pieceBelowId,
        ];

      case PieceType.LeftSide:
        return [
          pieceAboveId,
          index + 1,
          pieceBelowId,
        ];
      case PieceType.Inner:
        return [
          pieceAboveId,
          index + 1,
          pieceBelowId,
          index - 1,
        ];
      case PieceType.RightSide:
        return [
          pieceAboveId,
          index - 1,
          pieceBelowId,
        ];
      case PieceType.BottomLeftCorner:
        return [
          pieceAboveId,
          index + 1,
        ];
      case PieceType.BottomSide:
        return [
          pieceAboveId,
          index - 1,
          index + 1,
        ];
      case PieceType.BottomRightCorner:
        return [
          pieceAboveId,
          index - 1,
        ];
    }
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      if (!this.element || this.isSolved || this.groupId || this.isDragAndSelectActive || this.pocketId !== undefined && this.pocketId !== null && !Number.isNaN(this.pocketId)) {
        return;
      }

      if (window.Puzzly.showConnectorBoxes) {
        Utils.removeAllBoundingBoxIndicators();
      }

      window.Puzzly.keepOnTop(this.element);

      const mousePosition = {
        top: event.clientY,
        left: event.clientX,
      };

      // Apply the zoomLevel to everything except for the play boundary (all other movables are children of this)
      // TODO: Shouldn't be accessing the zoomLevel on a global like this.
      this.diffX =
        mousePosition.left -
        parseInt(this.element.style.left) * window.Zoom.zoomLevel;
      this.diffY =
        mousePosition.top -
        parseInt(this.element.style.top) * window.Zoom.zoomLevel;

      this.element.addEventListener('mousemove', this.onMouseMove);
      this.element.addEventListener('mouseup', this.onMouseUp);
      this.element.addEventListener('mouseout', this.onMouseOut);

      this.active = true;
    }
  }

  onMouseOut(event: MouseEvent) {
    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);
    this.element.removeEventListener('mouseout', this.onMouseOut);

    if (this.active) {
      if (this.isOutOfBounds(event)) {
        this.resetPosition();
      } else {
        this.setLastPosition();
        this.save();
      }

      this.active = false;
    }
  }

  onMouseMove(event: MouseEvent) {
    let newPosTop, newPosLeft;

    newPosTop =
      event.clientY / window.Zoom.zoomLevel -
      this.diffY / window.Zoom.zoomLevel;
    newPosLeft =
      event.clientX / window.Zoom.zoomLevel -
      this.diffX / window.Zoom.zoomLevel;

    this.element.style.top = newPosTop + "px";
    this.element.style.left = newPosLeft + "px";
  }

  onMouseUp(event: MouseEvent) {
    // console.log('SingleMovable mouseup', this)
    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);

    if (this.isOutOfBounds(event)) {
      this.resetPosition();
    } else if (this.isOverPockets(event)) {
      const pocket = this.getPocketByCollision(Utils.getEventBox(event));
      if (pocket) {
        window.Puzzly.Pockets.addSingleToPocket(pocket, this);
        this.pocketId = parseInt(pocket.id.split("-")[1]);
        this.save();
        this.stopListening();
      }
    } else {
      // If this element is not in a group we can check for a connection with another piece
      // console.log("solving area box", this.getSolvingAreaBoundingBox());
      const connection = checkConnections(this);
      console.log("connection", connection);

      if (connection) {
        const { targetPiece, isSolving } = connection;

        if (isSolving) {
          this.solve();
        } else {
          if (targetPiece.groupInstance) {
            this.connectWithGroup(targetPiece.groupInstance, connection);
          } else if (targetPiece.isSolved) {
            this.solve();
          } else {
            this.connectWithPiece(targetPiece, connection);
          }
        }

        window.dispatchEvent(
          new CustomEvent(EVENT_TYPES.CONNECTION_MADE, {
            detail: this.connection,
          })
        );

      } else if (!this.isDragAndSelectActive) {
        this.setLastPosition();
        this.save();
      }
    }

    this.active = false;
  }

  setLastPosition() {
    const position = Utils.getStyleBoundingBox(this.element);
    this.lastPosition = {
      top: position.top,
      left: position.left,
    };
  }

  solve() {
    // console.log("SingleInstance", this, "solve()");
    this.hide();
    this.stopListening();
    this.markAsSolved();

    // TODO: Should this be part of the hide() behaviour?
    this.element.style.pointerEvents = "none";

    window.Puzzly.SolvingArea.addPiece(this);
    console.log('solved pieces', window.Puzzly.SolvingArea.pieces.length)

    fetch('/api/puzzle/solvePiece', {
      method: 'PUT',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        pieceIndex: this.index,
        puzzleId: this.puzzleId,
        isComplete: window.Puzzly.SolvingArea.pieces.length === window.Puzzly.selectedNumPieces,
      }),
    })

    this.destroy();
  }

  markAsSolved() {
    this.isSolved = true;
    this.groupId = null;
    this.groupInstance = null;
    this.element.dataset.isSolved = "true";
    this.element.classList.add("grouped");
  }

  setGroupIdAcrossInstance(groupId: string) {
    this.groupId = groupId;
    this.element.dataset.groupId = groupId;
    this.pieceData.groupId = groupId;
  }

  setPositionAsGrouped() {
    this.element.style.top = this.pieceData.positionInPuzzle.y + "px";
    this.element.style.left = this.pieceData.positionInPuzzle.x + "px";
  }

  hide() {
    this.element.style.visibility = "hidden";
  }

  markConnectorUsed(atDegrees: number) {
    this.connectors = this.connectors.map((connector: Connector) => {
      if (connector.atDegrees === atDegrees) {
        connector.isConnected = true;
      }
      return connector;
    });
  }

  connectWithPiece(piece: SingleMovable, connection: Connection) {
    if (connection.atDegrees && connection.adjacentDegrees) {
      const newGroup = new GroupMovable({
        id: `group-${nanoid()}`,
        pieceInstances: [this, piece],
        isNew: true,
        zIndex: window.Puzzly.currentZIndex + 1,
      });
      window.Puzzly.groupInstances.push(newGroup);
      this.groupInstance = newGroup;
      this.markConnectorUsed(connection.atDegrees);
      piece.markConnectorUsed(connection.adjacentDegrees)
      this.setPositionAsGrouped();
      this.hide();
      this.stopListening();
    }
  }

  connectWithGroup(group: GroupMovable, connection: Connection) {
    // console.log("SingleMovable connectWithGroup", group)

    const { atDegrees, adjacentDegrees, targetPiece } = connection;

    if (atDegrees && adjacentDegrees && targetPiece) {
      if (this.groupInstance) {
        group.addPieces(this.groupInstance.piecesInGroup);
        // Fix: Shouldn't need to call this from here
        group.save();
      } else {
        group.addPiece(this);
        group.save();
        this.groupInstance = group;
        this.setGroupIdAcrossInstance(group.id);
        // TDOD: Encapsulate in single method on target instance?
        this.setPositionAsGrouped();
        this.hide();
        this.stopListening();
      }
    }
  }

  getDataForSave(): PuzzlePieceSaveData {
    return {
      currentPositionInPlay: {
        x: this.element.offsetLeft,
        y: this.element.offsetTop,
      },
      zIndex: parseInt(this.element.style.zIndex),
      isSolved: this.isSolved,
      groupId: this.groupInstance?.id,
      pocketId: this.pocketId || undefined,
    };
  }

  save() {
    // console.log("Save single piece", this.getDataForSave());
    window.Puzzly.PersistenceOperations.saveSinglePiece(this.getDataForSave());
  }

  resetPosition() {
    this.element.style.top = this.lastPosition.top + "px";
    this.element.style.left = this.lastPosition.left + "px";
  }

  stopListening() {
    this.element.removeEventListener('mousedown', this.onMouseDown);
  }

  startListening() {
    this.element.addEventListener('mousedown', this.onMouseDown);
  }

  destroy() {
    // Question: Do we need this?
    // window.Puzzly.removeSingleInstance(this);

    this.element.remove();
  }
}
