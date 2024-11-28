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
  Puzzly: Puzzly;
  GroupOperations: GroupOperations;
  PersistenceOperations: PersistenceOperations;
  SolvingArea: SolvingArea;
  position: {
    top: number;
    left: number;
  };
  zIndex: number;
  width: number;
  height: number;
  zoomLevel: number;
  isSolved: boolean;

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

    this.Puzzly = Puzzly;

    // console.log("GroupMovable constructor _id", _id);
    // console.log("GroupMovable constructor pieces", pieces);
    // console.log("new group", position)

    if (_id) {
      this._id = _id;
    }

    if (position) {
      this.position = position;
    }

    this.piecesInGroup = pieces;

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

    this.PersistenceOperations = new PersistenceOperations(this);
    this.GroupOperations = new GroupOperations({
      width: this.Puzzly.boardWidth,
      height: this.Puzzly.boardHeight,
      puzzleImage: this.puzzleImage,
      shadowOffset: this.shadowOffset,
      piecesPerSideHorizontal: Puzzly.piecesPerSideHorizontal,
      piecesPerSideVertical: Puzzly.piecesPerSideVertical,
      zIndex: this.zIndex,
      position: this.position,
    });

    this.SolvingArea = this.Puzzly.SolvingArea;

    if (!_id) {
      this.initiateGroup();
    } else {
      if (this.isSolved) {
        this.solve();
      } else {
        this.restoreFromPersistence();
      }
    }

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

  initiateGroup() {
    // console.log("initiating group")
    const sourcePiece = this.piecesInGroup[0];
    const targetPiece = this.piecesInGroup[1];

    const targetPiecePuzzleX = targetPiece.pieceData.puzzleX;
    const targetPiecePuzzleY = targetPiece.pieceData.puzzleY;

    const targetPieceCurrentPosition = Utils.getStyleBoundingBox(targetPiece.element);

    const groupInitialPosition = {
      top: targetPieceCurrentPosition.top - targetPiecePuzzleY,
      left: targetPieceCurrentPosition.left - targetPiecePuzzleX,
    };

    const groupContainer = this.GroupOperations.createGroupContainer(groupInitialPosition);

    sourcePiece.setPositionAsGrouped();
    targetPiece.setPositionAsGrouped();

    groupContainer.appendChild(sourcePiece.element);
    groupContainer.appendChild(targetPiece.element);
    sourcePiece.hide();
    targetPiece.hide();

    this.element = groupContainer;

    this.render();

    this.setLastPosition(groupInitialPosition);
    this.addToStage(this.element);
    this.save();
  }

  restoreFromPersistence() {
    const container = this.GroupOperations.createGroupContainer(this.position, this._id);
    GroupOperations.setIdForGroupElements(container, this._id as string);

    this.element = container;

    this.addPieces(this.piecesInGroup, { save: false });
    this.attachElements();
    this.addToStage(this.element);
    this.render();
  }

  async joinTo(movableInstance: SingleMovable | GroupMovable) {
    // console.log("GroupMovable joining to", movableInstance);

    let instance: SingleMovable | GroupMovable;
    if (movableInstance.instanceType === InstanceTypes.SingleMovable) {
      instance = movableInstance as SingleMovable;
      this.alignWith(instance);
      this.addPieces([instance], { save: true });
      this.render();
      instance.setPositionAsGrouped();
      instance.setGroupIdAcrossInstance(this._id + "");
      // TODO: This should be done by the movable instance
      instance.element.classList.add("grouped");
    } else if (movableInstance.instanceType === InstanceTypes.GroupMovable) {
      instance = movableInstance as GroupMovable;
      await instance.addPieces(this.piecesInGroup, { save: true });
      this.destroy();
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

  async addPieces(pieceInstances: SingleMovable[], options?: { save: boolean; }) {
    // console.log("pieces currently in group", this.piecesInGroup);
    this.piecesInGroup.push(...pieceInstances);
    // console.log("pieces in group after add", this.piecesInGroup);
    this.piecesInGroup.forEach((instance) => {
      instance.setGroupIdAcrossInstance(this._id + "");
      instance.setPositionAsGrouped();
      instance.hide();
    });
    this.attachElements();
    this.render();

    if (options?.save) {
      await this.save(true);
    }
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

    const puzzleWidth = this.Puzzly.boardWidth;
    const puzzleHeight = this.Puzzly.boardHeight;

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
    if (event.which === 1) {
      const element = Utils.getPuzzlePieceElementFromEvent(
        event
      ) as MovableElement;
      // console.log("group onmousedown", element)
      if (
        element &&
        BaseMovable.isGroupedPiece(element) &&
        this.isPuzzlePieceInThisGroup(element) &&
        !Utils.isSolved(element) &&
        !this.isSolved
      ) {
        this.element = element.parentNode as MovableElement;
        // console.log("group movable: element", this.element);
        this.active = true;
        this.Puzzly.keepOnTop(this.element);

        super.onPickup.call(this, event);
      }
    }
  }

  getConnection() {
    const collisionCandidates =
      this.GroupOperations.getCollisionCandidatesInGroup(
        this.element.dataset.groupId + ""
      );
    console.log("collision candidates found", collisionCandidates);

    let i = 0;

    while (i < collisionCandidates.length) {
      const connection = checkConnections(
        collisionCandidates[i],
      );
      if (connection) return connection;
      i++;
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.active) {
      if (this.isOutOfBounds()) {
        this.resetPosition();
      } else {
        this.connection = this.getConnection();
        super.onMouseUp(event);
      }

      this.clean();
    }
  }

  onMoveFinished() {
    // console.log("GroupMovable onMoveFinished", this);
    if (this.active && !this.connection) {
      this.setLastPosition();
      this.save();
    }
  }

  isOutOfBounds() {
    const playAreaBox = (
      this.piecesContainer as HTMLDivElement
    ).getBoundingClientRect();
    return this.piecesInGroup.some(
      (instance) =>
        !Utils.isInside(instance.element.getBoundingClientRect(), playAreaBox)
    );
    // return !this.isInsidePlayArea() && !this.isOverPockets(event);
  }

  solve() {
    this.piecesInGroup.forEach((instance) => {
      instance.markAsSolved();
    });

    this.isSolved = true;

    this.SolvingArea.add(this.piecesInGroup);
    this.destroy();
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
    if (force || this.active || !this._id) {
      const response = await this.PersistenceOperations.save(this.getDataForSave());
    }
  }

  onSaveSuccess(event: CustomEvent) {
    const data = event.detail;
    // console.log("group saved", data)
  }

  delete() {
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

  detachElements() {
    this.element.remove();
  }

  destroy() {
    this.detachElements();
    if (!this.isSolved) {
      window.Puzzly.removeGroupInstance(this);
    }
    this.delete();
  }

  clean() {
    if (this.active) {
      super.clean();
    }
  }
}
