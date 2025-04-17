import BaseMovable from "./BaseMovable";
import { checkConnections } from "./checkConnections";
import { EVENT_TYPES, HTML_ATTRIBUTE_NAME_SVG_PATH_STRING, SHAPE_TYPES } from "./constants";
import GroupMovable from "./GroupMovable";
import PathOperations from "./pathOperations";
import Puzzly from "./Puzzly";
import { getJigsawShapeSvgString, getSvg } from "./svg";

import { nanoid } from "nanoid";
import {
  BoundingBox,
  Connection,
  Connector,
  ConnectorType,
  InstanceTypes,
  JigsawPieceData,
  SingleMovableSaveState,
  XYCoordinate
} from "./types";
import Utils from "./utils";

export default class SingleMovable extends BaseMovable {
  instanceType = InstanceTypes.SingleMovable;
  shapeType = SHAPE_TYPES.PLAIN;
  pieceData: JigsawPieceData;
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
    pieceData: JigsawPieceData;
  }) {
    super(puzzleData);

    this.connectsTo = this.getConnectingPieceIds(pieceData) as number[];
    this.connections = [];
    this.jigsawType = pieceData.type;

    this.puzzleId = window.Puzzly.puzzleId;
    this.id = pieceData.id;
    this.index = pieceData.index;
    this.totalNumberOfPieces = window.Puzzly.selectedNumPieces;
    this.isSolved = pieceData.isSolved;

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

  setPiece(pieceData: JigsawPieceData) {
    this.pieceData = pieceData;
    // console.log(" setting piecedata", this.pieceData);
  }

  createElement() {
    const {
      id,
      index,
      groupId,
      width,
      height,
      basePieceSize,
      connectorDistanceFromCorner,
      connectorSize,
      connectorTolerance,
      pageY,
      pageX,
      solvedY,
      solvedX,
      zIndex,
      puzzleX,
      puzzleY,
      isInnerPiece,
      isSolved,
      numPiecesFromTopEdge,
      numPiecesFromLeftEdge,
      numberOfPiecesHorizontal,
      numberOfPiecesVertical,
      pocketId,
      type,
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
      el.style.top = (!!groupId ? solvedY : pageY) + "px";
      el.style.left = (!!groupId ? solvedX : pageX) + "px";
    }
    el.style.pointerEvents = "none";
    el.style.zIndex = (zIndex || 1) + "";

    el.setAttribute("data-jigsaw-type", type.join(","));
    el.setAttribute("data-id", id);
    el.setAttribute(
      "data-connector-distance-from-corner",
      connectorDistanceFromCorner + ""
    );
    el.setAttribute("data-connector-tolerance", connectorTolerance + "");
    el.setAttribute("data-connector-size", connectorSize + "");
    el.setAttribute("data-base-piece-size", basePieceSize + "");
    el.setAttribute("data-shadow-offset", this.shadowOffset + "");
    el.setAttribute("data-piece-index", index + "");
    el.setAttribute("data-puzzle-id", this.puzzleId);
    el.setAttribute("data-puzzle-x", puzzleX + "");
    el.setAttribute("data-puzzle-y", puzzleY + "");
    el.setAttribute("data-pageX", pageX + "");
    el.setAttribute("data-pageY", pageY + "");
    el.setAttribute("data-svgPath", svgPath);
    el.setAttribute("data-is-inner-piece", isInnerPiece + "");
    el.setAttribute(
      "data-pieces-per-side-horizontal",
      numberOfPiecesHorizontal + ""
    );
    el.setAttribute(
      "data-pieces-per-side-vertical",
      numberOfPiecesVertical + ""
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
      imageWidth: this.pieceData.puzzleWidth,
      imageHeight: this.pieceData.puzzleHeight,
      imagePosition: {
        x: puzzleX,
        y: puzzleY,
      },
      shadowOffset: window.Puzzly.shadowOffset,
      viewbox: `0 0 ${width + shadowOffset} ${height + shadowOffset}`,
    }

    el.innerHTML = getSvg(
      `piece-${this.pieceData.index}`,
      "",
      [this.pieceData],
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
      top = stagePosition.top + groupBoundingBox.top + this.pieceData.puzzleY;
      left = stagePosition.left + groupBoundingBox.left + this.pieceData.puzzleX;
    } else if (this.isSolved) {
      const solvingAreaPosition = Utils.getStyleBoundingBox(window.Puzzly.SolvingArea.element as HTMLDivElement);
      top = stagePosition.top + solvingAreaPosition.top + this.pieceData.puzzleY;
      left = stagePosition.left + solvingAreaPosition.left + this.pieceData.puzzleX;
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

    const anchorTop = stagePosition.top + solvingAreaPosition.top + this.pieceData.puzzleY;
    const anchorLeft = stagePosition.left + solvingAreaPosition.left + this.pieceData.puzzleX;

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
    data: Pick<JigsawPieceData, "index" | "numberOfPiecesHorizontal" | "type">
  ) {
    const id = data.index;
    const pieceAboveId = id - data.numberOfPiecesHorizontal;
    const pieceBelowId = id + data.numberOfPiecesHorizontal;

    if (Utils.isTopLeftCorner(data.type)) {
      return [
        id + 1,
        pieceBelowId,
      ];
    }
    if (Utils.isTopSide(data.type)) {
      return [
        id - 1,
        id + 1,
        pieceBelowId,
      ];
    }
    if (Utils.isTopRightCorner(data.type)) {
      return [
        id - 1,
        pieceBelowId,
      ];
    }
    if (Utils.isLeftSide(data.type)) {
      return [
        pieceAboveId,
        id + 1,
        pieceBelowId,
      ];
    }
    if (Utils.isInnerPiece(data.type)) {
      return [
        pieceAboveId,
        id + 1,
        pieceBelowId,
        id - 1,
      ];
    }
    if (Utils.isRightSide(data.type)) {
      return [
        pieceAboveId,
        id - 1,
        pieceBelowId,
      ];
    }
    if (Utils.isBottomLeftCorner(data.type)) {
      return [
        pieceAboveId,
        id + 1,
      ];
    }
    if (Utils.isBottomSide(data.type)) {
      return [
        pieceAboveId,
        id - 1,
        id + 1,
      ];
    }
    if (Utils.isBottomRightCorner(data.type)) {
      return [
        pieceAboveId,
        id - 1,
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
    }
  }

  onMouseOut(event: MouseEvent) {
    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);
    this.element.removeEventListener('mouseout', this.onMouseOut);

    if (this.isOutOfBounds(event)) {
      this.resetPosition();
    } else {
      this.setLastPosition();
      this.save();
    }

    window.dispatchEvent(
      new CustomEvent(EVENT_TYPES.MOVE_FINISHED, { detail: event })
    );
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
        pieceId: this.id,
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
    this.element.style.top = this.pieceData.puzzleY + "px";
    this.element.style.left = this.pieceData.puzzleX + "px";
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

  getDataForSave(): SingleMovableSaveState {
    return {
      id: this.pieceData.id,
      index: this.pieceData.index,
      basePieceSize: this.pieceData.basePieceSize,
      connectorSize: this.pieceData.connectorSize,
      connectorTolerance: this.pieceData.connectorTolerance,
      connectorDistanceFromCorner: this.pieceData.connectorDistanceFromCorner,
      connectors: this.connectors,
      width: this.pieceData.width,
      height: this.pieceData.height,
      pageX: this.element.offsetLeft,
      pageY: this.element.offsetTop,
      numberOfPiecesHorizontal: this.pieceData.numberOfPiecesHorizontal,
      numberOfPiecesVertical: this.pieceData.numberOfPiecesVertical,
      puzzleX: this.pieceData.puzzleX,
      puzzleY: this.pieceData.puzzleY,
      puzzleWidth: this.pieceData.puzzleWidth,
      puzzleHeight: this.pieceData.puzzleHeight,
      type: this.pieceData.type,
      zIndex: parseInt(this.element.style.zIndex),
      isSolved: this.isSolved,
      groupId: this.groupInstance?.id,
      puzzleId: this.puzzleId,
      pocketId: this.pocketId as number,
      instanceType: this.instanceType,
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
