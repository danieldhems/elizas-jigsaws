import BaseMovable from "./BaseMovable";
import { checkConnections } from "./checkConnections";
import { EVENT_TYPES, HTML_ATTRIBUTE_NAME_SVG_PATH_STRING, SHAPE_TYPES, SHADOW_OFFSET, SHADOW_OFFSET_RATIO } from "./constants";
import GroupMovable from "./GroupMovable";
import GroupOperations from "./GroupOperations";
import Pockets from "./Pockets";
import { getJigsawShapeSvgString, getSvg } from "./svg";
import Puzzly from "./Puzzly";
import PathOperations from "./pathOperations";

import {
  BoundingBox,
  DomBox,
  InstanceTypes,
  JigsawPieceData,
  MovableElement,
  SingleMovableSaveState,
  TopLeftCoordinate,
  XYCoordinate,
} from "./types";
import Utils from "./utils";
import SolvingArea from "./SolvingArea";

export default class SingleMovable extends BaseMovable {
  instanceType = InstanceTypes.SingleMovable;
  shapeType = SHAPE_TYPES.PLAIN;
  pieceData: JigsawPieceData;
  connectors: {
    boundingBox: {
      top: number;
      left: number;
      right: number;
      bottom: number;
    },
    atDegrees: number;
    isConnected: boolean;
  }[];
  connectsTo: number[];
  puzzleId: string;
  _id: string;
  groupId: string;
  groupInstance: GroupMovable;
  GroupOperations: GroupOperations;
  piecesPerSideHorizontal: number;
  piecesPerSideVertical: number;
  totalNumberOfPieces: number;
  isSolved: boolean;
  Puzzly: Puzzly;
  pocketId?: number;
  Pockets: Pockets;
  SolvingArea: SolvingArea;

  constructor({
    puzzleData,
    pieceData,
  }: {
    puzzleData: Puzzly;
    pieceData: JigsawPieceData;
  }) {
    super(puzzleData);
    // console.log("SingleMovable constructor:", pieceData);

    this.GroupOperations = new GroupOperations({
      width: this.Puzzly.boardWidth,
      height: this.Puzzly.boardHeight,
      puzzleImage: this.Puzzly.puzzleImage,
      shadowOffset: this.Puzzly.shadowOffset,
      piecesPerSideHorizontal: this.Puzzly.piecesPerSideHorizontal,
      piecesPerSideVertical: this.Puzzly.piecesPerSideVertical,
    });

    this.Puzzly = puzzleData;
    this.puzzleId = this.Puzzly.puzzleId;
    this._id = pieceData._id;
    this.totalNumberOfPieces = this.Puzzly.selectedNumPieces;

    this.piecesPerSideHorizontal = this.Puzzly.piecesPerSideHorizontal;
    this.shadowOffset = puzzleData.shadowOffset;
    this.connectorDistanceFromCorner = puzzleData.connectorDistanceFromCorner;
    this.pocketId = pieceData.pocketId;
    this.Pockets = this.Puzzly.Pockets;

    this.SolvingArea = puzzleData.SolvingArea;

    if (pieceData.groupId) {
      this.groupId = pieceData.groupId;
    }

    this.setPiece(pieceData);
    this.element = this.createElement();

    this.setLastPosition({ top: pieceData.pageY, left: pieceData.pageX });

    if (!this.Puzzly.complete) {
      this.render();
      this.save();
    }

    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener(
      EVENT_TYPES.PUZZLE_LOADED,
      this.onPuzzleLoaded.bind(this)
    );
    window.addEventListener(
      EVENT_TYPES.MOVE_FINISHED,
      this.onMoveFinished.bind(this)
    );
    window.addEventListener(
      EVENT_TYPES.GROUP_CREATED,
      this.onGroupCreated.bind(this)
    );
    window.addEventListener(
      EVENT_TYPES.PIECE_UPDATED,
      this.onUpdated.bind(this)
    );
  }

  setPiece(pieceData: JigsawPieceData) {
    this.pieceData = pieceData;
    // console.log(" setting piecedata", this.pieceData);
  }

  createElement() {
    const {
      index,
      _id,
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

    const el = document.createElement("div");
    el.classList.add("puzzle-piece");
    el.id = "piece-" + index;

    el.style.position = "absolute";
    el.style.width = width + SHADOW_OFFSET + "px";
    el.style.height = height + SHADOW_OFFSET + "px";

    if (pocketId === undefined || pocketId === null || pocketId === -1) {
      el.style.top = (!!groupId ? solvedY : pageY) + "px";
      el.style.left = (!!groupId ? solvedX : pageX) + "px";
    }
    el.style.pointerEvents = "none";
    el.style.zIndex = (zIndex || 1) + "";

    el.setAttribute("data-jigsaw-type", type.join(","));
    el.setAttribute(
      "data-connector-distance-from-corner",
      connectorDistanceFromCorner + ""
    );
    el.setAttribute("data-connector-tolerance", connectorTolerance + "");
    el.setAttribute("data-connector-size", connectorSize + "");
    el.setAttribute("data-base-piece-size", basePieceSize + "");
    el.setAttribute("data-shadow-offset", this.shadowOffset + "");
    el.setAttribute("data-piece-index", index + "");
    el.setAttribute("data-piece-id-in-persistence", _id);
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
    this.connectsTo = this.getConnectingPieceIds(this.pieceData)
    el.setAttribute(
      "data-connections",
      JSON.stringify(this.GroupOperations.getConnections(el))
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

    const { puzzleImagePath } = this.Puzzly;

    // TODO: svg.ts is already generating and rendering the svg string so this might not be needed, and could be confusing.
    const pathString = getJigsawShapeSvgString(this.pieceData);
    el.setAttribute(HTML_ATTRIBUTE_NAME_SVG_PATH_STRING, pathString);

    const svgWidth = width + SHADOW_OFFSET;
    const svgHeight = height + SHADOW_OFFSET;

    const svgOptions = {
      svgWidth,
      svgHeight,
      imageWidth: this.pieceData.puzzleWidth,
      imageHeight: this.pieceData.puzzleHeight,
      imagePosition: {
        x: puzzleX,
        y: puzzleY,
      },
      shadowOffset: width / 100 * SHADOW_OFFSET_RATIO,
      viewbox: `0 0 ${width + SHADOW_OFFSET} ${height + SHADOW_OFFSET}`,
    }

    el.innerHTML = getSvg(
      `piece-${this.pieceData.index}`,
      [this.pieceData],
      puzzleImagePath,
      svgOptions,
    );

    // el.innerHTML = svgElementTemplate;
    return el;
  }

  render() {
    // console.log("rendering piece", this.pieceData);
    const { isSolved, pocketId } = this.pieceData;

    if (Number.isInteger(pocketId) && pocketId !== -1) {
      const pocketElement = this.pocketsContainer.querySelector(
        `#pocket-${pocketId}`
      );

      this.Pockets.addSingleToPocket(pocketElement as HTMLDivElement, this);
      return;
    }

    if (!isSolved) {
      this.addToStage.call(this);
      this.setConnectorBoundingBoxes()
    }
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

    this.connectors = connectorBoundingBoxes.map((boundingBox: BoundingBox) => {
      // Utils.drawBox(boundingBox, this.element)
      return {
        boundingBox,
        isConnected: false,
      }
    })
  }

  getCurrentBoundingBoxForConnector(atDegrees: number): BoundingBox {
    const position = Utils.getStyleBoundingBox(this.element);
    const stagePosition = Utils.getStyleBoundingBox(this.playBoundary as HTMLDivElement);
    const groupInstance = this.groupId && this.getGroupInstanceFromElement(this.element);

    if (groupInstance) {
      const groupBoundingBox = Utils.getStyleBoundingBox(groupInstance.element);
      position.top += groupBoundingBox.top;
      position.left += groupBoundingBox.left;
    }

    const relativeBoundingBox = this.connectors.find((connector) =>
      connector.atDegrees === atDegrees
    )?.boundingBox as BoundingBox;

    return {
      top: relativeBoundingBox.top + position.top + stagePosition.top,
      left: relativeBoundingBox.left + position.left + stagePosition.left,
      right: position.left + stagePosition.left + relativeBoundingBox.right,
      bottom: position.top + stagePosition.top + relativeBoundingBox.bottom,
    }
  }

  getSolvedBoundingBoxes(): BoundingBox[] {
    const stagePosition = Utils.getStyleBoundingBox(this.playBoundary as HTMLDivElement);
    const solvingAreaPosition = Utils.getStyleBoundingBox(this.SolvingArea.element as HTMLDivElement);
    const relativeBoundingBoxes = this.connectors.map((connector) => connector.boundingBox);

    const anchorTop = stagePosition.top + solvingAreaPosition.top + this.pieceData.puzzleY;
    const anchorLeft = stagePosition.left + solvingAreaPosition.left + this.pieceData.puzzleX;

    return relativeBoundingBoxes.map((box: BoundingBox) => ({
      top: anchorTop + box.top,
      left: anchorLeft + box.left,
      right: box.right,
      bottom: box.bottom,
    }))
  }

  isElementOwned(element: MovableElement) {
    return element.dataset.pieceIdInPersistence === this.pieceData._id;
  }

  hasMouseDown(element: HTMLElement) {
    return element.id === this.element.id;
  }

  addToPocket(pocket: HTMLDivElement) {
    const innerElement = pocket.querySelector(".pocket-inner");
    innerElement?.prepend(this.element);
  }

  addToSolved() {
    this.GroupOperations.addToGroup(this, this.solvedGroupId + "");
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
    if (event.which === 1) {
      const element = Utils.getPuzzlePieceElementFromEvent(
        event
      ) as MovableElement;
      if (
        element &&
        !BaseMovable.isGroupedPiece(element) &&
        this.hasMouseDown(element) &&
        !this.isPocketPiece(element) &&
        !this.isDragAndSelectActive &&
        !this.isSolved
      ) {
        this.active = true;
        this.Puzzly.keepOnTop(this.element);
        super.onPickup(event);
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.active) {
      if (this.isOutOfBounds(event)) {
        this.resetPosition();
      } else if (this.isOverPockets(event)) {
        const pocket = this.getPocketByCollision(Utils.getEventBox(event));
        if (pocket) {
          this.Pockets.addSingleToPocket(pocket, this);
          this.pocketId = parseInt(pocket.id.split("-")[1]);
        }
      } else if (!this.groupId) {
        // If this element is not in a group we can check for a connection with another piece
        // console.log("solving area box", this.getSolvingAreaBoundingBox());
        this.connection = checkConnections(
          this.element,
        );
        console.log("connection", this.connection);
      }

      if (!this.connection) {
        this.save();
      }
    }

    super.onMouseUp(event);
  }

  setLastPosition(position?: TopLeftCoordinate) {
    this.lastPosition = {
      top: position?.top || parseInt(this.element.style.top),
      left: position?.left || parseInt(this.element.style.left),
    };
  }

  onPuzzleLoaded() {
    this.save();
  }

  onMoveFinished() {
    if (this.active) {
      if (!BaseMovable.isGroupedPiece(this.element)) {
        this.setLastPosition({
          left: this.element.offsetLeft,
          top: this.element.offsetTop,
        });

        this.active = false;
      }
    }
  }

  solve() {
    // console.log("SingleInstance", this, "solve()");
    this.setPositionAsGrouped();
    this.hide();
    this.markAsSolved();

    // TODO: Should this be part of the hide() behaviour?
    this.element.style.pointerEvents = "none";

    this.SolvingArea.add([this]);

    this.save(true);
  }

  markAsSolved() {
    this.isSolved = true;
    this.element.dataset.isSolved = "true";
    this.element.classList.add("grouped");
  }

  setGroupIdAcrossInstance(groupId: string) {
    this.groupId = groupId;
    this.element.dataset.groupId = groupId;
    this.pieceData.groupId = groupId;
  }

  onGroupCreated(event: CustomEvent) {
    const { groupId, elementIds } = event.detail;
    if (elementIds.includes(this.element.dataset.pieceIndex)) {
      this.setGroupIdAcrossInstance(groupId);
    }
  }

  setPositionAsGrouped() {
    this.element.style.top = this.pieceData.puzzleY + "px";
    this.element.style.left = this.pieceData.puzzleX + "px";
  }

  hide() {
    this.element.style.visibility = "hidden";
  }

  joinTo(targetInstance: GroupMovable | SingleMovable) {
    // console.log("SingleInstance", this, "joinTo()", targetInstance);
    if (targetInstance.instanceType === InstanceTypes.SingleMovable) {
      const newGroup = new GroupMovable({
        Puzzly: this.Puzzly,
        pieces: [this, targetInstance as SingleMovable],
      });
      this.Puzzly.groupInstances.push(newGroup);
    } else {
      const instance = targetInstance as GroupMovable;
      // console.log("SingleMovable joining to", instance);
      this.setGroupIdAcrossInstance(instance._id + "");
      this.element.classList.add("grouped");
      // TDOD: Encapsulate in single method on target instance?
      instance.addPieces([this]);
      this.setPositionAsGrouped();
      this.hide();
    }
  }

  getDataForSave(): SingleMovableSaveState {
    return {
      index: this.pieceData.index,
      basePieceSize: this.pieceData.basePieceSize,
      connectorSize: this.pieceData.connectorSize,
      connectorTolerance: this.pieceData.connectorTolerance,
      connectorDistanceFromCorner: this.pieceData.connectorDistanceFromCorner,
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
      groupId: this.pieceData.groupId,
      puzzleId: this.puzzleId,
      _id: this.pieceData._id,
      pocketId: this.pocketId as number,
      instanceType: this.instanceType,
    };
  }

  save(force = false) {
    // console.log("Save single piece", this.getDataForSave());
    if (force || (this.active && !this.connection)) {
      window.dispatchEvent(
        new CustomEvent(EVENT_TYPES.SAVE, { detail: this.getDataForSave() })
      );
    }
  }

  onUpdated(event: CustomEvent) {
    // console.log(this.pieceData.index, "Received piece_updated event", event)
    const { index, puzzleX, puzzleY } = this.pieceData;
    const { index: uIndex, puzzleX: uPuzzleX, puzzleY: uPuzzleY, _id: uId } = event.detail;
    if (uId && uIndex === index && uPuzzleX === puzzleX && uPuzzleY === puzzleY) {
      this.setId(uId);
    }
  }

  setId(id: string) {
    // console.log("Setting ID for piece", this.pieceData.index, id)
    this.pieceData._id = id;
    this.element.setAttribute("data-piece-id-in-persistence", id);
    this._id = id;
  }
}
