import BaseMovable from "./BaseMovable";
import { checkConnections } from "./checkConnections";
import { ELEMENT_IDS, EVENT_TYPES } from "../constants";
import SingleMovable from "./SingleMovable";
import { getSvg } from "../puzzle-creator/svg";
import {
  Connection,
  GroupMovableSaveState,
  InstanceTypes,
  JigsawPieceData,
  MovableElement,
  TopLeftCoordinate,
} from "../types";
import Utils from "../utils";

export default class GroupMovable extends BaseMovable {
  instanceType = InstanceTypes.GroupMovable;
  _id?: string;
  id: string;
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
    pieceInstances,
    pieces,
    id,
    position,
    zIndex,
    isSolved,
    isNew
  }: {
    pieceInstances?: SingleMovable[];
    pieces?: JigsawPieceData[];
    _id?: string;
    id: string;
    position?: {
      top: number;
      left: number;
    };
    zIndex: number;
    isSolved?: boolean;
    isNew?: boolean;
  }) {
    super(window.Puzzly);

    this.id = id;
    this.zIndex = zIndex;

    if (position) {
      this.position = position;
    }

    this.piecesInGroup = [];
    this.totalNumberOfPieces = window.Puzzly.selectedNumPieces;

    this.puzzleId = window.Puzzly.puzzleId;
    this.puzzleImage = window.Puzzly.puzzleImage;
    this.puzzleWidth = window.Puzzly.boardWidth;
    this.puzzleHeight = window.Puzzly.boardHeight;

    this.width = window.Puzzly.boardWidth;
    this.height = window.Puzzly.boardHeight;
    this.shadowOffset = window.Puzzly.shadowOffset;

    this.zoomLevel = window.Puzzly.zoomLevel;

    if (isSolved) {
      this.isSolved = isSolved;
    }

    if (Array.isArray(pieceInstances)) {
      this.initiateGroup(pieceInstances)
      this.addPieces(pieceInstances);
      this.addToStage();
    } else if (Array.isArray(pieces)) {
      const pieceInstances = pieces.map((piece: JigsawPieceData) => {
        const instance = window.Puzzly.getSingleInstanceByIndex(piece.index);
        instance.setPositionAsGrouped();
        instance.hide();
        return instance;
      });

      this.initiateGroup(pieceInstances);

      if (position) {
        this.element.style.top = position.top + "px";
        this.element.style.left = position.left + "px";

        this.setLastPosition(position);
      }

      this.addPieces(pieceInstances);
      this.addToStage();
    }

    if (isNew) {
      // If isNew flag is true, make a group creation request 
      fetch('api/puzzle/createGroup', {
        method: 'POST',
        headers: {
          "Content-Type": "Application/json",
        },
        body: JSON.stringify({
          group: this.getDataForSave(),
        }),
      });
    }

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);

    this.element.addEventListener("mousedown", this.onMouseDown.bind(this));
  }

  isElementOwned(element: MovableElement) {
    return this.piecesInGroup.some(
      (piece) => piece.groupId === element.dataset.groupId
    );
  }

  initiateGroup(pieces: SingleMovable[]) {
    // console.log("initiating group", pieces)
    const sourcePiece = pieces[0];
    const targetPiece = pieces[1];

    const targetPiecePuzzleX = targetPiece.pieceData.puzzleX;
    const targetPiecePuzzleY = targetPiece.pieceData.puzzleY;

    const targetPieceCurrentPosition = Utils.getStyleBoundingBox(targetPiece.element);

    const groupInitialPosition = {
      top: targetPieceCurrentPosition.top - targetPiecePuzzleY,
      left: targetPieceCurrentPosition.left - targetPiecePuzzleX,
    };

    const groupContainer = window.window.Puzzly.GroupOperations.createGroupContainer(groupInitialPosition);
    groupContainer.id = `group-container-${this.id}`;
    groupContainer.setAttribute("data-id", this.id);

    sourcePiece.setPositionAsGrouped();
    targetPiece.setPositionAsGrouped();

    groupContainer.appendChild(sourcePiece.element);
    groupContainer.appendChild(targetPiece.element);
    sourcePiece.hide();
    targetPiece.hide();

    sourcePiece.setGroupIdAcrossInstance(this.id);
    targetPiece.setGroupIdAcrossInstance(this.id);

    this.element = groupContainer;
    window.Puzzly.keepOnTop(this.element);

    this.setLastPosition(groupInitialPosition);
  }

  connectWithPiece(piece: SingleMovable, connection: Connection) {
    // console.log('GroupMovable connectWithPiece', piece)
    const { atDegrees, adjacentDegrees, sourcePiece, targetPiece } = connection;

    if (atDegrees && adjacentDegrees && sourcePiece && targetPiece) {
      this.alignWith(piece);
      this.addPiece(piece);
      piece.groupInstance = this;
      piece.hide();
      piece.setPositionAsGrouped();
      piece.stopListening();
      this.save();
    }
  }

  connectWithGroup(group: GroupMovable) {
    group.addPieces(this.piecesInGroup);

    fetch('/api/puzzle/mergeGroups', {
      method: 'PUT',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        sourceGroup: this.getDataForSave(),
        targetGroup: group.getDataForSave(),
        puzzleId: this.puzzleId,
      }),
    })

    this.destroy();
  }

  alignWith(movableInstance: SingleMovable) {
    // console.log("group alignwith", movableInstance)
    const position = { top: 0, left: 0 };

    const { top, left } = Utils.getStyleBoundingBox(movableInstance.element);
    const { puzzleX, puzzleY } = movableInstance.pieceData;

    position.top = top - puzzleY;
    position.left = left - puzzleX;

    this.element.style.top = position.top + "px";
    this.element.style.left = position.left + "px";
  }

  addPieces(pieceInstances: SingleMovable[]) {
    // console.log("GroupMovable addPieces")
    pieceInstances.forEach((piece) => {
      piece.groupInstance = this;
      this.piecesInGroup.push(piece);
      piece.setGroupIdAcrossInstance(this.id)
      this.element.appendChild(piece.element)
    });
    this.render();
  }

  addPiece(piece: SingleMovable) {
    // console.log("GroupMovable addPiece")
    this.piecesInGroup.push(piece);
    this.attachElements();
    this.render();
    piece.setGroupIdAcrossInstance(this.id)
  }

  attachElements() {
    this.piecesInGroup.forEach((piece) => {
      this.element.appendChild(piece.element);
    });
  }

  render() {
    const pieces = this.piecesInGroup.map(piece => piece.pieceData);

    const shadowOffset = window.Puzzly.shadowOffset;

    const puzzleWidth = window.Puzzly.boardWidth;
    const puzzleHeight = window.Puzzly.boardHeight;

    const svgWidth = puzzleWidth + shadowOffset;
    const svgHeight = puzzleHeight + shadowOffset;

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
      this.id,
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

  addToStage() {
    (window.Puzzly.piecesContainer as HTMLDivElement).prepend(this.element);
  }

  isPuzzlePieceInThisGroup(element: MovableElement) {
    return element.dataset.groupId === this._id + "";
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      Utils.removeAllBoundingBoxIndicators();
      if (
        !this.isSolved &&
        !window.Puzzly.DragAndSelect?.dragAndSelectActive
      ) {
        // console.log("group movable: element", this.element);
        this.active = true;
        window.window.Puzzly.keepOnTop(this.element);

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
  }

  onMouseOut(event: MouseEvent) {
    const relatedTarget = (event.relatedTarget as HTMLElement);
    if (
      this.active &&
      (
        relatedTarget.id === ELEMENT_IDS.PLAY_BOUNDARY
        || relatedTarget.id === ELEMENT_IDS.POCKETS
        || relatedTarget.id === ELEMENT_IDS.SOLVED_PUZZLE_AREA
      )
    ) {
      this.dropGroup();
      this.active = false;
    }
  }

  dropGroup() {
    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);
    this.element.removeEventListener('mouseout', this.onMouseOut);

    if (this.isOutOfBounds()) {
      this.resetPosition();
    } else {
      this.setLastPosition();
      this.save();
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
      return checkConnections(window.window.Puzzly.getSingleInstanceByIndex(0));
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
    // console.log('GroupMovable mouseup', this)
    if (this.isOutOfBounds()) {
      this.resetPosition();
    } else {
      const connection = this.getConnection();

      if (connection) {
        console.log("connection", connection);

        const { targetPiece, isSolving } = connection;

        if (isSolving) {
          this.solve();
        } else {
          if (targetPiece.groupInstance) {
            this.connectWithGroup(targetPiece.groupInstance);
          } else {
            this.connectWithPiece(targetPiece, connection)
          }
        }

        window.dispatchEvent(
          new CustomEvent(EVENT_TYPES.CONNECTION_MADE, {
            detail: this.connection,
          })
        );
      } else {
        this.setLastPosition();
        this.save();
      }
    }

    this.active = false;

    this.element.removeEventListener('mousemove', this.onMouseMove);
    this.element.removeEventListener('mouseup', this.onMouseUp);
  }

  getCollisionCandidatesInGroup(): SingleMovable[] {
    const candidates: SingleMovable[] = [];

    this.piecesInGroup.forEach((piece: SingleMovable) => {
      const connections = piece.connections;
      const pieceType = piece.jigsawType;
      const isSolved = piece.isSolved;
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
      window.window.Puzzly.piecesContainer as HTMLDivElement
    ).getBoundingClientRect();
    return this.piecesInGroup.some(
      (instance) =>
        !Utils.isInside(instance.element.getBoundingClientRect(), playAreaBox)
    );
    // return !this.isInsidePlayArea() && !this.isOverPockets(event);
  }

  solve() {
    // console.log('solving group', this)
    window.window.Puzzly.SolvingArea.addGroup(this);

    console.log('solved pieces', window.Puzzly.SolvingArea.pieces.length)

    // Question: Do we need this?
    this.isSolved = true;

    this.piecesInGroup.forEach((piece) => {
      piece.markAsSolved();
    });

    fetch('/api/puzzle/solveGroup', {
      method: 'PUT',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        group: this.getDataForSave(),
        puzzleId: this.puzzleId,
        isComplete: window.Puzzly.SolvingArea.pieces.length === window.Puzzly.selectedNumPieces,
      }),
    })

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

  onSaveResponse(result: any) {
    if (this.isServerResponseForThisGroup(result.data)) {
      window.dispatchEvent(
        new CustomEvent(EVENT_TYPES.GROUP_CREATED, {
          detail: {
            groupId: this._id,
          },
        })
      );

      this.setLastPosition();
    }
  }

  getDataForSave(): Partial<GroupMovableSaveState> {
    const elementPosition = {
      top: parseInt(this.element.style.top),
      left: parseInt(this.element.style.left),
    };
    const data: Partial<GroupMovableSaveState> = {
      id: this.id,
      pieces: this.piecesInGroup.map((piece) => piece.getDataForSave()),
      puzzleId: this.puzzleId,
      puzzleWidth: this.puzzleWidth,
      puzzleHeight: this.puzzleHeight,
      position: elementPosition,
      zIndex: parseInt(this.element.style.zIndex),
      instanceType: this.instanceType,
    };

    if (this.isSolved) {
      data.isSolved = this.isSolved;
    }

    return data;
  }

  setLastPosition(position?: TopLeftCoordinate) {
    this.lastPosition = {
      top: position?.top || parseInt(this.element.style.top),
      left: position?.left || parseInt(this.element.style.left),
    };
  }

  async save() {
    const { solvedCount, totalNumberOfPieces } = window.Puzzly;
    let isComplete;
    if (solvedCount === totalNumberOfPieces) {
      isComplete = true;
    }

    const saveResult = await window.window.Puzzly.PersistenceOperations.saveGroup(this.getDataForSave());
    // this.onSaveResponse(saveResult);
  }

  hide() {
    this.element.style.visibility = "hidden";
  }

  delete() {
    console.log('delete', this)
    window.window.Puzzly.PersistenceOperations.deleteGroup(this.id, this.puzzleId);
  }

  destroy() {
    if (typeof this.onMouseDown === "function") {
      this.element.removeEventListener("mousedown", this.onMouseDown);
    }
    if (typeof this.onMouseMove === "function") {
      this.element.removeEventListener("mousemove", this.onMouseMove);
    }
    if (typeof this.onMouseUp === "function") {
      this.element.removeEventListener("mouseup", this.onMouseUp);
    }

    this.hide();
    this.element.remove();
    window.window.Puzzly.removeGroupInstance(this);
  }
}
