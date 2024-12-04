import { ELEMENT_IDS, EVENT_TYPES, PUZZLE_PIECE_CLASSES } from "./constants";
import Utils from "./utils";
import {
  BoundingBox,
  Connection,
  InstanceTypes,
  MovableElement,
} from "./types";
import SingleMovable from "./SingleMovable";
import GroupMovable from "./GroupMovable";
import Puzzly from "./Puzzly";

export default class BaseMovable {
  instanceType: InstanceTypes;
  element: MovableElement;
  lastPosition: {
    top: number;
    left: number;
  };
  active: boolean = false;
  puzzleId: string;
  connection: Connection | undefined;
  puzzleImage: HTMLImageElement;
  // Used by PocketMovable to know which pocket the movable originated from, and which the movable's child nodes will be returned to if out-of-bounds.
  activePocket?: HTMLDivElement;
  boardWidth: number;
  boardHeight: number;
  diffX: number;
  diffY: number;
  zoomLevel = 1;
  connectorTolerance: number;
  shadowOffset: number;
  isDragAndSelectActive = false;
  connectorDistanceFromCorner: number;
  connectorSize: number;
  solvedGroupId: number;
  dragAndSelectActive: boolean;

  constructor(puzzly: Puzzly) {
    // console.log("puzzly", puzzly);
    this.puzzleImage = puzzly.puzzleImage;

    // Needed for collision detection
    this.connectorTolerance = puzzly.connectorTolerance;
    this.connectorDistanceFromCorner = puzzly.connectorDistanceFromCorner;
    this.connectorSize = puzzly.connectorSize;
    this.shadowOffset = puzzly.shadowOffset;

    this.boardWidth = puzzly.boardWidth;
    this.boardHeight = puzzly.boardHeight;

    window.addEventListener(
      EVENT_TYPES.CHANGE_SCALE,
      this.onChangeScale.bind(this)
    );

    window.addEventListener(
      EVENT_TYPES.DRAGANDSELECT_ACTIVE,
      (event: CustomEvent) => {
        this.isDragAndSelectActive = event.detail;
      }
    );
  }

  keepOnTop(element: MovableElement) {
    element.style.zIndex = window.Puzzly.currentZIndex =
      window.Puzzly.currentZIndex + 1;
  }

  getMovableInstanceFromElement(element: MovableElement): SingleMovable | GroupMovable | undefined {
    if (element.dataset.groupId) {
      return this.getGroupInstanceFromElement(element);
    } else {
      return this.getSingleInstanceFromElement(element);
    }
  }

  getSingleInstanceFromElement(
    element: MovableElement
  ): SingleMovable {
    return window.Puzzly.pieceInstances.find(
      (instance: SingleMovable) =>
        instance._id === element.dataset.pieceIdInPersistence
    ) as SingleMovable;
  }

  getSingleInstanceByIndex(
    index: number
  ): SingleMovable {
    return window.Puzzly.pieceInstances.find(
      (instance: SingleMovable) => instance.index === index
    ) as SingleMovable;
  }

  getGroupInstanceFromElement(
    element: MovableElement
  ): GroupMovable | undefined {
    if (element.dataset.groupId) {
      return window.Puzzly.groupInstances.find((instance: GroupMovable) =>
        // TODO: Need more efficient way to match IDs
        instance.piecesInGroup.some(
          (piece) => piece.groupId === element.dataset.groupId
        )
      ) as GroupMovable;
    }
  }

  onChangeScale(event: MouseEvent) {
    this.zoomLevel = event.detail;
  }

  isPuzzlePiece(target: HTMLDivElement) {
    const classes = target?.classList;
    if (!classes) return;
    return PUZZLE_PIECE_CLASSES.some((c) => classes.contains(c));
  }

  isSinglePiece(element: HTMLDivElement) {
    const classes = element.classList;
    return (
      PUZZLE_PIECE_CLASSES.some((c: string) => classes.contains(c)) &&
      !classes.contains("in-pocket") &&
      !classes.contains("grouped")
    );
  }

  isPlayBoundary(element: HTMLElement) {
    return (
      element.id === ELEMENT_IDS.PLAY_BOUNDARY ||
      element.id === ELEMENT_IDS.SOLVED_PUZZLE_AREA
    );
  }

  static isGroupedPiece(element: HTMLDivElement) {
    if (element.dataset.groupId) {
      return element.dataset.groupId.length > 0;
    }
    return false;
  }

  isPocketPiece(element: HTMLDivElement) {
    const parentElement = element.parentNode as HTMLDivElement;
    if (parentElement.id) {
      return parentElement.id === ELEMENT_IDS.POCKET_DRAG_CONTAINER;
    }
    return false;
  }

  isDragAndSelectPiece(element: HTMLDivElement) {
    const parentElement = element.parentNode as HTMLDivElement;
    if (parentElement.id) {
      return parentElement.id === ELEMENT_IDS.DRAGANDSELECT_CONTAINER;
    }
    return false;
  }

  getPocketByCollision(box: BoundingBox) {
    let i = 0;
    while (i <= window.Puzzly.pockets.length) {
      const pocket = window.Puzzly.pockets[i];
      if (this.hasCollision(pocket, box)) {
        return pocket;
      }
      i++;
    }
  }

  hasCollision(
    targetElement: HTMLDivElement,
    source?: BoundingBox
  ) {
    const targetBoundingBox = Utils.getStyleBoundingBox(targetElement);
    const thisBoundingBox = source || Utils.getStyleBoundingBox(this.element);
    return Utils.hasCollision(thisBoundingBox, targetBoundingBox);
  }

  isInsidePlayArea() {
    return Utils.isInside(
      this.element.getBoundingClientRect(),
      (window.Puzzly.piecesContainer as HTMLDivElement).getBoundingClientRect()
    );
  }

  isOverPockets(event: MouseEvent) {
    return this.hasCollision(window.Puzzly.Pockets.container, Utils.getEventBox(event));
  }

  addToStage(element?: MovableElement) {
    const elementToAdd = element || this.element;
    // console.log("element to add", this);
    (window.Puzzly.piecesContainer as HTMLDivElement).prepend(elementToAdd);
  }

  // Lifecycle method called when a movable is picked up i.e. the user has begun interacting with it
  onPickup(event: MouseEvent) {
    const mousePosition = {
      top: event.clientY,
      left: event.clientX,
    };

    // Apply the zoomLevel to everything except for the play boundary (all other movables are children of this)
    if (this.instanceType === InstanceTypes.PlayBoundaryMovable) {
      this.diffX = mousePosition.left - parseInt(this.element.style.left);
      this.diffY = mousePosition.top - parseInt(this.element.style.top);
    } else {
      // TODO: Shouldn't be accessing the zoomLevel on a global like this.
      this.diffX =
        mousePosition.left -
        parseInt(this.element.style.left) * window.Zoom.zoomLevel;
      this.diffY =
        mousePosition.top -
        parseInt(this.element.style.top) * window.Zoom.zoomLevel;
    }

    // Store a reference to our event handlers so we can remove them later
    // (They don't get removed if we don't use these)
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  // Lifecycle method called when a movable is put down up i.e. the user has finished interacting with it
  // Actually not sure about this one...
  onDrop() {
    this.clean();
  }

  onMouseMove(event: MouseEvent) {
    if (this.active && !this.dragAndSelectActive) {
      let newPosTop, newPosLeft;

      if (this.instanceType === "PlayBoundaryMovable") {
        // this.shouldConstrainViewport()
        // Viewport constraint not yet implemented so just ignore for now and move the play boundary around freely
        newPosTop = event.clientY - this.diffY;
        newPosLeft = event.clientX - this.diffX;
      } else {
        newPosTop =
          event.clientY / window.Zoom.zoomLevel -
          this.diffY / window.Zoom.zoomLevel;
        newPosLeft =
          event.clientX / window.Zoom.zoomLevel -
          this.diffX / window.Zoom.zoomLevel;
      }

      this.element.style.top = newPosTop + "px";
      this.element.style.left = newPosLeft + "px";
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.connection) {
      console.log("connection", this.connection);
      this.handleConnection(this.connection);
    }

    window.dispatchEvent(
      new CustomEvent(EVENT_TYPES.MOVE_FINISHED, { detail: event })
    );
    this.clean();
  }

  handleConnection(connection: Connection) {
    const { sourceElement, targetElement, isSolving } = connection;

    const sourceInstance = this.getMovableInstanceFromElement(sourceElement) as SingleMovable;

    if (isSolving) {
      if (sourceInstance.groupId) {
        const groupInstance = this.getGroupInstanceFromElement(sourceElement);
        groupInstance?.solve();
      } else {
        sourceInstance.solve();
      }
    } else if (targetElement) {
      const targetInstance = this.getMovableInstanceFromElement(
        targetElement
      ) as SingleMovable | GroupMovable;

      sourceInstance.joinTo(targetInstance, connection);
    }

    window.dispatchEvent(
      new CustomEvent(EVENT_TYPES.CONNECTION_MADE, {
        detail: this.connection,
      })
    );
  }

  isConnectionBetweenSingleAndGroup(
    sourceInstanceType: InstanceTypes,
    targetInstanceType: InstanceTypes
  ) {
    return (
      (sourceInstanceType === InstanceTypes.SingleMovable &&
        targetInstanceType === InstanceTypes.GroupMovable) ||
      (targetInstanceType === InstanceTypes.SingleMovable &&
        sourceInstanceType === InstanceTypes.GroupMovable)
    );
  }

  isConnectionBetweenTwoGroups(
    sourceInstanceType: InstanceTypes,
    targetInstanceType: InstanceTypes
  ) {
    return (
      (sourceInstanceType === "GroupMovable" &&
        targetInstanceType === "GroupMovable") ||
      (sourceInstanceType === "GroupMovable" &&
        targetInstanceType === "GroupMovable")
    );
  }

  getSolvingAreaBoundingBox() {
    return {
      top: parseInt(window.Puzzly.SolvingArea.element.style.top),
      left: parseInt(window.Puzzly.SolvingArea.element.style.left),
      right:
        parseInt(window.Puzzly.SolvingArea.element.style.left) +
        window.Puzzly.SolvingArea.element.offsetWidth,
      bottom:
        parseInt(window.Puzzly.SolvingArea.element.style.left) +
        window.Puzzly.SolvingArea.element.offsetHeight,
      width: window.Puzzly.SolvingArea.element.offsetWidth,
      height: window.Puzzly.SolvingArea.element.offsetHeight,
    };
  }

  getPosition() {
    return {
      top: this.element.offsetTop,
      left: this.element.offsetLeft,
    };
  }

  resetPosition() {
    if (this.active) {
      this.element.style.top = this.lastPosition.top + "px";
      this.element.style.left = this.lastPosition.left + "px";
    }
  }

  clean() {
    this.active = false;

    if (typeof this.onMouseMove === "function") {
      window.removeEventListener("mousemove", this.onMouseMove);
    }
    if (typeof this.onMouseUp === "function") {
      window.removeEventListener("mouseup", this.onMouseUp);
    }
  }
}
