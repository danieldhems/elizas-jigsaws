import GroupOperations from "./GroupOperations";
import { checkConnections } from "./checkConnections";
import { EVENT_TYPES, SHADOW_OFFSET, SHADOW_OFFSET_RATIO } from "./constants";
import Utils from "./utils";
import BaseMovable from "./BaseMovable";
import SingleMovable from "./SingleMovable";
import PersistenceOperations from "./persistence";
import {
  DomBox,
  InstanceTypes,
  JigsawPieceData,
  MovableElement,
  GroupMovableSaveState,
  BoundingBox,
  TopLeftCoordinate,
  ConnectorType,
} from "./types";
import Puzzly from "./Puzzly";
import { getSvg } from "./svg";
import SolvingArea from "./SolvingArea";

export default class GroupMovable extends BaseMovable {
  instanceType = InstanceTypes.GroupMovable;
  _id?: string;
  svg: HTMLOrSVGElement;
  puzzleWidth: number;
  puzzleHeight: number;
  piecesInGroup: SingleMovable[];
  elementsInGroup: MovableElement[];
  position: {
    top: number;
    left: number;
  };
  zIndex: number;
  width: number;
  height: number;
  zoomLevel: number;
  isSolved: boolean;
  totalNumberOfPieces: number;

  constructor({
    Puzzly,
    pieces,
    _id,
    position,
    zIndex,
    isSolved,
  }: {
    Puzzly: Puzzly;
    pieces: SingleMovable[];
    _id?: string;
    position?: {
      top: number;
      left: number;
    };
    zIndex?: number;
    isSolved?: boolean;
  }) {
    super(Puzzly);

    console.log("GroupMovable constructor _id", _id);
    console.log("GroupMovable constructor pieces", pieces);

    if (_id) {
      this._id = _id;
    }

    if (position) {
      this.position = position;
    }

    this.piecesInGroup = [];
    this.totalNumberOfPieces = Puzzly.selectedNumPieces;

    this.puzzleId = Puzzly.puzzleId;
    this.puzzleImage = Puzzly.puzzleImage;
    this.puzzleWidth = Puzzly.boardWidth;
    this.puzzleHeight = Puzzly.boardHeight;

    this.width = Puzzly.boardWidth;
    this.height = Puzzly.boardHeight;
    this.shadowOffset = Puzzly.shadowOffset;

    this.zoomLevel = Puzzly.zoomLevel;

    // console.log("GroupMovable zIndex", zIndex);

    if (isSolved) {
      this.isSolved = isSolved;
    }

    if (!_id) {
      this.initiateGroup(pieces);
    } else {
      if (this.isSolved) {
        this.solve();
      } else {
        const container = window.Puzzly.GroupOperations.createGroupContainer(position, this._id);
        GroupOperations.setIdForGroupElements(container, this._id as string);

        this.element = container;

        this.addPieces(pieces);
        this.addToStage(this.element);
      }
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener(
      EVENT_TYPES.MOVE_FINISHED,
      this.onMoveFinished.bind(this)
    );
    window.addEventListener(
      EVENT_TYPES.SAVE_SUCCESSFUL,
      this.onSaveResponse.bind(this)
    );
  }

  isElementOwned(element: MovableElement) {
    return this.piecesInGroup.some(
      (piece) => piece.pieceData.groupId === element.dataset.groupId
    );
  }

  initiateGroup(pieces: SingleMovable[]) {
    // console.log("initiating group")
    const sourcePiece = pieces[0];
    const targetPiece = pieces[1];

    const targetPiecePuzzleX = targetPiece.pieceData.puzzleX;
    const targetPiecePuzzleY = targetPiece.pieceData.puzzleY;

    const targetPieceCurrentPosition = Utils.getStyleBoundingBox(targetPiece.element);

    const groupInitialPosition = {
      top: targetPieceCurrentPosition.top - targetPiecePuzzleY,
      left: targetPieceCurrentPosition.left - targetPiecePuzzleX,
    };

    const groupContainer = window.Puzzly.GroupOperations.createGroupContainer(groupInitialPosition);

    sourcePiece.setPositionAsGrouped();
    targetPiece.setPositionAsGrouped();

    groupContainer.appendChild(sourcePiece.element);
    groupContainer.appendChild(targetPiece.element);
    sourcePiece.hide();
    targetPiece.hide();

    this.element = groupContainer;

    this.setLastPosition(groupInitialPosition);
    this.addPieces(pieces)
    this.addToStage(this.element);
    this.save();
  }

  async joinTo(movableInstance: SingleMovable | GroupMovable) {
    // console.log("GroupMovable joining to", movableInstance);

    let instance: SingleMovable | GroupMovable;
    if (movableInstance.instanceType === InstanceTypes.SingleMovable) {
      instance = movableInstance as SingleMovable;
      this.alignWith(instance);
      this.addPieces([instance]);
      this.render();
    } else if (movableInstance.instanceType === InstanceTypes.GroupMovable) {
      instance = movableInstance as GroupMovable;
      instance.addPieces(this.piecesInGroup);
      this.destroy();
      instance.save();
    }
  }

  alignWith(movableInstance: SingleMovable | GroupMovable) {
    // console.log("group alignwith", movableInstance)
    const position = { top: 0, left: 0 };

    if (movableInstance instanceof SingleMovable) {
      const { top, left } = movableInstance.getPosition();
      const { puzzleX, puzzleY } = movableInstance.pieceData;

      // console.log(top, solvedY, left, solvedX);
      position.top = top - puzzleY;
      position.left = left - puzzleX;
    } else if (movableInstance instanceof GroupMovable) {
    }

    this.element.style.top = position.top + "px";
    this.element.style.left = position.left + "px";
  }

  addPieces(pieceInstances: SingleMovable[]) {
    this.piecesInGroup.push(...pieceInstances);
    this.piecesInGroup.forEach((instance) => {
      instance.hide();
      instance.setGroupIdAcrossInstance(this._id + "");
      instance.setPositionAsGrouped();
    });
    this.attachElements();
    this.render();
  }

  attachElements() {
    // console.log("attachElements", this.piecesInGroup);
    Array.from(this.piecesInGroup).forEach((piece) => {
      // console.log("attaching piece", piece);
      if (piece.element.parentNode !== this.element) {
        this.element.appendChild(piece.element);
      } else {
        // console.info(`Piece ${piece.pieceData.index} already attached to group`);
      }
    });
  }

  render() {
    const pieces = this.piecesInGroup.map(piece => piece.pieceData);
    console.log('render', pieces)

    const puzzleWidth = window.Puzzly.boardWidth;
    const puzzleHeight = window.Puzzly.boardHeight;

    const svgWidth = puzzleWidth + SHADOW_OFFSET;
    const svgHeight = puzzleHeight + SHADOW_OFFSET;

    const shadowOffset = this.piecesInGroup[0].pieceData.width / 100 * SHADOW_OFFSET_RATIO;

    const svgOptions = {
      svgWidth: svgWidth,
      svgHeight: svgHeight,
      imageWidth: this.puzzleWidth,
      imageHeight: this.puzzleHeight,
      viewbox: `0 0 ${svgWidth} ${svgHeight}`,
      isGroup: true,
      shadowOffset,
    }

    // TODO: Enforce sequential order for piece rendering to prevent overlap issues
    // i.e. render in order 1, 2, 3, 4

    const orderedPieces: JigsawPieceData[] = pieces.sort((a, b) => a.index - b.index);

    const svgElementTemplate = getSvg(
      `${Date.now()}`,
      orderedPieces,
      this.puzzleImage.src,
      svgOptions,
    );

    const existingSvgElement = this.element.querySelector(".group-svg-container");
    if (existingSvgElement) {
      existingSvgElement.remove();
    }

    const svgContainer = document.createElement("div");
    svgContainer.classList.add("group-svg-container");
    svgContainer.innerHTML = svgElementTemplate;
    this.element.appendChild(svgContainer);
  }

  isPuzzlePieceInThisGroup(element: MovableElement) {
    return element.dataset.groupId === this._id + "";
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      const element = Utils.getPuzzlePieceElementFromEvent(
        event
      ) as MovableElement;
      if (
        element &&
        this.isPuzzlePieceInThisGroup(element) &&
        !Utils.isSolved(element) &&
        !this.isSolved &&
        !this.dragAndSelectActive
      ) {
        this.element = element.parentNode as MovableElement;
        // console.log("group movable: element", this.element);
        this.active = true;
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

        this.element.addEventListener('mousemove', this.onMouseMove)
        this.element.addEventListener('mouseup', this.onMouseUp)
      }
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

  getConnection() {
    if (this.piecesInGroup.length === this.totalNumberOfPieces) {
      return checkConnections(window.Puzzly.getSingleInstanceByIndex(0));
    } else {
      const collisionCandidates = this.getCollisionCandidatesInGroup();

      let i = 0;

      while (i < collisionCandidates.length) {
        const connection = checkConnections(
          collisionCandidates[i],
        );
        if (connection) return connection;
        i++;
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    console.log(event.currentTarget)
    if (this.isOutOfBounds()) {
      this.resetPosition();
    } else {
      const connection = this.getConnection();

      if (connection) {
        console.log("connection", connection);

        const { sourceElement, targetElement, isSolving } = connection;

        if (isSolving) {
          this.solve();
        } else if (targetElement) {
          const targetInstance = this.getMovableInstanceFromElement(
            targetElement
          ) as SingleMovable | GroupMovable;

          this.joinTo(targetInstance);
        }

        window.dispatchEvent(
          new CustomEvent(EVENT_TYPES.CONNECTION_MADE, {
            detail: this.connection,
          })
        );
      }

      window.dispatchEvent(
        new CustomEvent(EVENT_TYPES.MOVE_FINISHED, { detail: event })
      );
    }

    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);
  }

  onMoveFinished() {
    // console.log("GroupMovable onMoveFinished", this);
    if (this.active && !this.connection) {
      this.setLastPosition();
      this.save();
    }
  }

  getCollisionCandidatesInGroup(): SingleMovable[] {
    const candidates: SingleMovable[] = [];


    this.piecesInGroup.forEach((piece: SingleMovable) => {
      const element = piece.element;
      const connections = window.Puzzly.GroupOperations.getConnections(element);
      const pieceType = (element.dataset.jigsawType as string)
        .split(",")
        .map((n) => parseInt(n)) as ConnectorType[];
      const isSolved = element.dataset.isSolved === "true";
      if (Utils.isInnerPiece(pieceType) && connections.length < 4) {
        candidates.push(piece);
      }
      if (Utils.isSidePiece(pieceType) && connections.length < 3) {
        candidates.push(piece);
      }
      if (Utils.isCornerPiece(pieceType) && !isSolved) {
        candidates.push(piece);
      }
    });
    return candidates;
  }

  isOutOfBounds() {
    const playAreaBox = (
      window.Puzzly.piecesContainer as HTMLDivElement
    ).getBoundingClientRect();
    return this.piecesInGroup.some(
      (instance) =>
        !Utils.isInside(instance.element.getBoundingClientRect(), playAreaBox)
    );
    // return !this.isInsidePlayArea() && !this.isOverPockets(event);
  }

  solve() {
    console.log('solving group', this)
    window.Puzzly.SolvingArea.add(this.piecesInGroup);

    this.isSolved = true;
    this.save();
  }

  getPieceIdsFromServerResponse(pieceData: JigsawPieceData[]) {
    const ids: string[] = [];
    pieceData.forEach((data) => ids.push(data.id + ""));
    return ids;
  }

  arePieceIdsInThisGroup(pieceIds: string[]) {
    return this.piecesInGroup.every((piece) => {
      return pieceIds.includes(piece.pieceData.id + "");
    });
  }

  isServerResponseForThisGroup(data: {
    _id: string;
    pieces: JigsawPieceData[];
  }) {
    if (!data) return;
    const pieceIds: string[] = this.getPieceIdsFromServerResponse(data.pieces);
    return data._id === this._id || this.arePieceIdsInThisGroup(pieceIds);
  }

  setGroupIdAcrossInstance(id: string) {
    this._id = id;
    this.element.id = `group-container-${this._id}`;

    this.element.dataset.groupId = this._id + "";

    this.piecesInGroup.forEach((pieceInstance) => {
      // We may not need to update ALL pieces with the group id.
      // This depends on whether the group is new or being merged with another
      if (pieceInstance.groupId !== id + "") {
        pieceInstance.setGroupIdAcrossInstance(this._id + "");
      }
    });
  }

  onSaveResponse(event: CustomEvent) {
    const response = event.detail;
    // console.log("GroupMovable save response", response);
    if (this.isServerResponseForThisGroup(response.data)) {
      if (!this._id) {
        this.setGroupIdAcrossInstance(response.data._id);
        window.dispatchEvent(
          new CustomEvent(EVENT_TYPES.GROUP_CREATED, {
            detail: {
              groupId: this._id,
              elementIds: this.piecesInGroup.map((piece) => piece.pieceData.id),
            },
          })
        );
      }

      this.setLastPosition();
    }
  }

  getAllPieceData() {
    return this.piecesInGroup.map((piece) => piece.getDataForSave());
  }

  getDataForSave(): GroupMovableSaveState {
    const elementPosition = {
      top: parseInt(this.element.style.top),
      left: parseInt(this.element.style.left),
    };
    return {
      _id: this._id || undefined,
      pieces: this.getAllPieceData(),
      puzzleId: this.puzzleId,
      puzzleWidth: this.puzzleWidth,
      puzzleHeight: this.puzzleHeight,
      position: elementPosition,
      zIndex: parseInt(this.element.style.zIndex),
      instanceType: this.instanceType,
      isSolved: this.isSolved,
    };
  }

  setLastPosition(position?: TopLeftCoordinate) {
    this.lastPosition = {
      top: position?.top || parseInt(this.element.style.top),
      left: position?.left || parseInt(this.element.style.left),
    };
  }

  async save(force = false) {
    // TODO: Still seeing duplicate saves
    // console.log("group save called", this);

    const { solvedCount, totalNumberOfPieces } = window.Puzzly;
    let isComplete;
    if (solvedCount === totalNumberOfPieces) {
      isComplete = true;
    }

    const saveResult = await window.Puzzly.PersistenceOperations.saveGroup(this.getDataForSave());
    console.log('saveResult', saveResult)
  }

  onSaveSuccess(event: CustomEvent) {
    const data = event.detail;
    // console.log("group saved", data)
  }

  delete() {
    console.log('destroy', this)
    window.dispatchEvent(
      new CustomEvent(EVENT_TYPES.SAVE, {
        detail: {
          _id: this._id,
          instanceType: this.instanceType,
          remove: true,
        },
      })
    );
  }

  clean() {
    if (this.active) {
      this.active = false;
    }
  }

  destroy() {
    if (!this.isSolved) {
      window.Puzzly.removeGroupInstance(this);
    }

    if (typeof this.onMouseDown === "function") {
      window.removeEventListener("mousedown", this.onMouseDown);
    }
    if (typeof this.onMouseMove === "function") {
      window.removeEventListener("mousemove", this.onMouseMove);
    }
    if (typeof this.onMouseUp === "function") {
      window.removeEventListener("mouseup", this.onMouseUp);
    }

    this.element.remove();
    this.delete();
  }
}
