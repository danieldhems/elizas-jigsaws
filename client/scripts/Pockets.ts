import BaseMovable from "./BaseMovable";
import { ELEMENT_IDS, EVENT_TYPES, PIECE_SCALE_INSIDE_POCKETS } from "./constants";
import { PocketMovable } from "./PocketMovable";
import Puzzly from "./Puzzly";
import SingleMovable from "./SingleMovable";
import { BoundingBox, DomBox, MovableElement, Orientation } from "./types";
import Utils from "./utils";

const POCKET_DEPTH = 110;

export default class Pockets {
  Puzzly: Puzzly;
  playBoundary: Puzzly["playBoundary"];
  container: HTMLDivElement | null;
  lastPosition: {
    top: number;
    left: number;
  };
  activePocket: Element | null;
  movingElement: HTMLDivElement | null;
  isMouseDown: boolean;
  isMovingSinglePiece: boolean;
  activePocketHasMultiplePieces: boolean;
  activePiecesContainer: HTMLDivElement;
  pocketsHandle: HTMLDivElement | null;
  shadowOffset: number;
  largestPieceSpan: number;
  connectorSize: number;
  borderColor: string;
  animationDuration: number;
  isMainCanvasMoving: boolean;
  isDragActive: boolean;
  zoomLevel: number;
  pockets: Element[];
  diffX: number;
  diffY: number;
  isCollapsed: boolean;
  currentOrientation: Orientation | null;
  BaseMovable: BaseMovable;

  constructor(config: Puzzly) {
    this.Puzzly = config;
    this.BaseMovable = new BaseMovable(config);
    this.playBoundary = config.playBoundary;
    this.shadowOffset = config.shadowOffset;
    this.largestPieceSpan = config.largestPieceSpan;
    this.connectorSize = config.connectorSize;
    this.borderColor = "#cecece";
    this.animationDuration = 300;
    this.isMainCanvasMoving = false;
    this.isDragActive = false;
    this.zoomLevel = 1; // If this hasn't been set externally yet, assume it's the default value
    this.diffX;
    this.diffY;
    this.isCollapsed = false;
    this.currentOrientation = this.getOrientation();

    this.container = document.querySelector("#pockets");
    this.pocketsHandle = document.querySelector("#pockets-handle");

    this.setSizeAndPosition();

    const pocket0 = document.querySelector("#pocket-0");
    const pocket1 = document.querySelector("#pocket-1");
    const pocket2 = document.querySelector("#pocket-2");
    const pocket3 = document.querySelector("#pocket-3");

    if (pocket0 && pocket1 && pocket2 && pocket3) {
      this.pockets = [pocket0, pocket1, pocket2, pocket3];
    }

    if (this.container) {
      this.container.classList.add("initialised");
    }

    this.zoomLevel = config.zoomLevel;

    if (this.pocketsHandle) {
      this.pocketsHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const orientation = this.getOrientation();
        let axisToAnimate, windowPropForDepth, depth;
        if (orientation === Orientation.Landscape) {
          axisToAnimate = "x";
          windowPropForDepth = "innerWidth";
          depth = (this.container as HTMLDivElement).offsetWidth;
        } else {
          axisToAnimate = "y";
          windowPropForDepth = "innerHeight";
          depth = (this.container as HTMLDivElement).offsetHeight;
        }

        if (this.isCollapsed) {
          window
            .move(this.container)
          [axisToAnimate]((window as any)[windowPropForDepth] - depth)
            .duration(this.animationDuration)
            .end();
          this.isCollapsed = false;
        } else {
          window
            .move(this.container)
          [axisToAnimate](
            (window as any)[windowPropForDepth] -
            (this.pocketsHandle as HTMLDivElement).offsetWidth
          )
            .duration(this.animationDuration)
            .end();
          this.isCollapsed = true;
        }
      });
    }

    // window.addEventListener("mousedown", this.onMouseDown.bind(this));
    // window.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("resize", this.onResize.bind(this));
    window.addEventListener(EVENT_TYPES.RESIZE, this.onResize.bind(this));
    window.addEventListener(EVENT_TYPES.CHANGE_SCALE, this.setScale.bind(this));
  }

  setSizeAndPosition() {
    if (this.currentOrientation === Orientation.Landscape) {
      (this.container as HTMLDivElement).style.width = POCKET_DEPTH + "px";
      (this.container as HTMLDivElement).style.left =
        window.innerWidth - POCKET_DEPTH + "px";
    } else {
      (this.container as HTMLDivElement).style.height = POCKET_DEPTH + "px";
      (this.container as HTMLDivElement).style.top =
        window.innerHeight - POCKET_DEPTH + "px";
    }
  }

  getOrientation() {
    return window.innerWidth > window.innerHeight
      ? Orientation.Landscape
      : window.innerHeight > window.innerWidth
        ? Orientation.Portrait
        : null;
  }

  hasOrientationChanged() {
    return (
      (window.innerWidth > window.innerHeight &&
        this.currentOrientation === Orientation.Portrait) ||
      (window.innerHeight > window.innerWidth &&
        this.currentOrientation === Orientation.Landscape)
    );
  }

  onResize() {
    this.setSizeAndPosition();
    this.currentOrientation = this.getOrientation();
  }

  setScale(event: CustomEvent) {
    const zoomLevel = event.detail;
    this.zoomLevel = zoomLevel;
  }

  getPocketIdFromPiece(element: HTMLElement) {
    if (element.classList.contains("puzzle-piece")) {
      return parseInt(element.dataset.pocketId as string);
    }
  }

  getIdForPocket(pocket: HTMLDivElement) {
    return pocket.id.split("-")[1];
  }

  // TODO: Deprecated?
  resetPieceScale(element: MovableElement) {
    element.style.transform = "scale(1)";
  }

  getPocketByCollision(box: BoundingBox) {
    if (Utils.isOverPockets(box)) {
      let i = 0;
      while (i <= this.pockets.length) {
        const pocket = this.pockets[i];
        if (Utils.hasCollision(box, pocket.getBoundingClientRect())) {
          return pocket;
        }
        i++;
      }
    }
  }

  isFromPocket(element: HTMLElement) {
    return (
      element?.parentNode?.parentNode as HTMLDivElement
    )?.classList?.contains("pocket");
  }

  isFromCanvas(element: MovableElement) {
    console.log("el.parentNode", element?.parentNode?.parentNode);
    return (
      (element?.parentNode as HTMLDivElement).id ===
      ELEMENT_IDS.PIECES_CONTAINER ||
      (element?.parentNode?.parentNode as HTMLDivElement).id ===
      ELEMENT_IDS.PIECES_CONTAINER
    );
  }

  getPocketIdFromElement(element: MovableElement) {
    return element.classList?.contains("pocket") && element.id.split("-")[2];
  }

  getEventBoundingBox(e: MouseEvent) {
    return {
      top: e.clientY,
      right: e.clientX,
      bottom: e.clientY,
      left: e.clientX,
    };
  }

  getPocketDropEventMessage() {
    return new CustomEvent("puzzly_pockets_pieces_added");
  }

  onMouseDown(e: MouseEvent) {
    const targetElement = e.target as HTMLElement;

    // If the empty space inside a pocket is clicked, do nothing
    if (targetElement.classList?.contains("in-pocket")) {
      return;
    }

    if (Utils.isPuzzlePiece(targetElement)) {
      this.isDragActive = !!targetElement?.classList?.contains("selected");

      const isMainCanvas =
        targetElement.id === ELEMENT_IDS.PLAY_BOUNDARY ||
        targetElement.id === ELEMENT_IDS.SOLVED_PUZZLE_AREA ||
        targetElement.dataset?.isSolved === "true";

      if (this.isFromPocket(targetElement)) {
        window.dispatchEvent(new CustomEvent(EVENT_TYPES.POCKET_PICKUP));
        // Piece is being picked up from a pocket
        this.lastPosition = {
          top: targetElement.offsetTop,
          left: targetElement.offsetLeft,
        };
        this.activePocket =
          this.pockets[this.getPocketIdFromPiece(targetElement) as number];

        this.movingElement = this.getMovingElementForActivePocket(e);

        const pos = this.getPositionForMovingElement();
        this.movingElement.style.top = pos.top + "px";
        this.movingElement.style.left = pos.left + "px";
        this.diffX = e.clientX - this.movingElement.offsetLeft;
        this.diffY = e.clientY - this.movingElement.offsetTop;

        this.activePocket.appendChild(this.movingElement);
      }

      if (isMainCanvas) {
        this.isMainCanvasMoving = true;
      }

      if (!Utils.isPuzzlePiece || !isMainCanvas) {
        this.isMouseDown = false;
        this.isMovingSinglePiece = false;
      }
    }
  }

  onMouseMove(e: MouseEvent) {
    const newPosTop = e.clientY - this.diffY;
    const newPosLeft = e.clientX - this.diffX;
    if (this.movingElement) {
      this.movingElement.style.top = newPosTop + "px";
      this.movingElement.style.left = newPosLeft + "px";
    }
  }

  getPiecesInActivePocket() {
    return Array.from((this.activePocket as HTMLDivElement).childNodes).filter(
      (el) => (el as Element).classList.contains("puzzle-piece")
    );
  }

  // TODO Duplicate method also exists on PocketMovable
  // Create a container for all the pieces in a given pocket with the pieces arranged in a grid.
  // This container will be set as the movingElement.
  getMovingElementForActivePocket(e: MouseEvent) {
    const activePieces = Array.from(this.getPiecesInActivePocket());

    this.activePocketHasMultiplePieces = true;

    const container = document.createElement("div");
    container.classList.add("active-pieces-container");
    container.style.border = "1px solid white";
    container.style.position = "absolute";

    this.activePiecesContainer = container;

    const rowLength =
      activePieces.length > 2 ? Math.ceil(Math.sqrt(activePieces.length)) : 2;

    let currX = 0,
      currY = 0;
    let colNumber = 1;
    let numRows = 0;
    let maxX = 0,
      maxY = 0,
      nextRowY = 0;

    let firstPieceOnRow = activePieces[0];

    for (let i = 0, l = activePieces.length; i < l; i++) {
      const el = activePieces[i] as HTMLDivElement;

      // move(el).x(currX * this.zoomLevel).y(currY * this.zoomLevel).duration(this.animationDuration).end();
      (el as HTMLDivElement).style.top = currY * this.zoomLevel + "px";
      (el as HTMLDivElement).style.left = currX * this.zoomLevel + "px";

      const box = {
        top: (this.container as HTMLDivElement).offsetTop + el.offsetTop,
        right: el.offsetLeft + el.offsetWidth,
        bottom: el.offsetTop + el.offsetHeight,
        left: (this.activePocket as HTMLDivElement).offsetLeft + el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
      };

      if (currX + box.width > maxX) {
        maxX = currX + box.width;
      }

      if (maxY === 0) {
        maxY = box.height;
      }

      if (currY + box.height > maxY) {
        maxY = currY + box.height;
      }

      currX += box.width + (box.width / 100) * 2;

      if (currY + box.height > nextRowY) {
        nextRowY = currY + box.height + (box.height / 100) * 2;
      }

      if (colNumber === rowLength) {
        currY = nextRowY;
        currX = 0;
        colNumber = 1;
        numRows++;

        firstPieceOnRow = el;
      } else {
        colNumber++;
      }

      container.appendChild(el);
    }

    container.style.width = maxX * this.zoomLevel + "px";
    container.style.height = maxY * this.zoomLevel + "px";

    const pocketBox = (
      this.activePocket as HTMLDivElement
    ).getBoundingClientRect();

    const x = e.clientX - pocketBox.left - (maxX / 2) * this.zoomLevel;
    const y = e.clientY - pocketBox.top - (maxY / 2) * this.zoomLevel;

    container.style.top = y + "px";
    container.style.left = x + "px";

    return container;
  }

  getPositionForMovingElement() {
    // const activePocketBB = this.activePocket.getBoundingClientRect();
    const element = this.movingElement as HTMLDivElement;
    return {
      top: 0 - element.offsetHeight / 2,
      left: 0 - element.offsetWidth / 2,
    };
  }

  enablePointerEvents() {
    const ui = this.container as HTMLDivElement;
    ui.style.pointerEvents = "auto";
    const pieces = ui.querySelectorAll(".puzzle-piece");
    pieces.forEach((el) => ((el as HTMLElement).style.pointerEvents = "auto"));
  }

  disablePointerEvents() {
    const ui = this.container as HTMLDivElement;
    ui.style.pointerEvents = "none";
    const pieces = ui.querySelectorAll(".puzzle-piece");
    pieces.forEach((el) => ((el as HTMLElement).style.pointerEvents = "none"));
  }

  onMouseUp() {
    window.dispatchEvent(new CustomEvent(EVENT_TYPES.POCKET_PUTDOWN));
    this.enablePointerEvents();

    if (this.isMovingSinglePiece) {
      this.isMovingSinglePiece = false;
    }

    this.isMainCanvasMoving = false;

    window.removeEventListener("mousemove", this.onMouseMove);
  }

  eventTargetIsPocket(e: MouseEvent) {
    return (e.target as HTMLElement).classList.contains("pocket");
  }

  eventTargetIsCanvas(e: MouseEvent) {
    return (e.target as HTMLElement).id === ELEMENT_IDS.PLAY_BOUNDARY;
  }

  resetActivePocket() {
    this.activePocket = null;
  }

  reset() {
    this.movingElement?.remove();
    this.movingElement = null;
    const activePiecesContainer = document.querySelector(
      "#active-pieces-container"
    );
    activePiecesContainer?.remove();
    this.resetActivePocket();
  }

  setElementPositionInPocket(element: MovableElement, pocket: HTMLDivElement) {
    const innerElement = pocket.querySelector(
      ".pocket-inner"
    ) as HTMLDivElement;
    const rangeX = (innerElement.offsetWidth / 100) * 10;
    const rangeY = (innerElement.offsetHeight / 100) * 10;

    const top = Utils.getRandomInt(0, rangeY);
    const left = Utils.getRandomInt(0, rangeX);

    element.style.top = top + "px";
    element.style.left = left + "px";
  }

  resetElementPositionsInPockets() {
    for (let i = 0, l = this.pockets.length; i < l; i++) {
      const pocket = this.pockets[i];
      const els = pocket.childNodes;
      if (els.length) {
        els.forEach((el) => {
          this.setElementPositionInPocket(
            el as HTMLDivElement,
            pocket as HTMLDivElement
          );
        });
      }
    }
  }

  addSingleToPocket(
    pocket: HTMLDivElement | number,
    pieceInstance: SingleMovable
  ) {
    if (!pieceInstance) return;

    let pocketId, pocketEl;

    if (Number.isInteger(pocket)) {
      pocketEl = this.pockets[pocket as number];
      pocketId = pocket;
    } else {
      pocketEl = pocket;
      pocketId = this.getIdForPocket(pocket as HTMLDivElement);
    }

    if (pocketEl) {
      const pocketElement = pocketEl as HTMLDivElement;

      pocketElement.querySelector(".pocket-inner")?.appendChild(pieceInstance.element);
      this.setElementPositionInPocket(pieceInstance.element, pocketElement);
      // pieceInstance.element.style.scale = window.Puzzly.basePieceSize / 100 * (PIECE_SCALE_INSIDE_POCKETS * 10) + "";
      pieceInstance.element.style.scale = PIECE_SCALE_INSIDE_POCKETS + '';

      pieceInstance.element.setAttribute("data-pocket-id", pocketId as string);
      pieceInstance.element.classList.add("in-pocket");
      pieceInstance.pocketId = parseInt(pocketId as string);
    }
  }

  addManyToPocket(
    pocket: HTMLDivElement | number,
    movableOrArrayOfElements: PocketMovable | NodeListOf<HTMLDivElement>
  ) {
    if (!movableOrArrayOfElements) return;

    let pocketId, pocketEl;

    if (Number.isInteger(pocket)) {
      pocketEl = this.pockets[pocket as number];
      pocketId = pocket;
    } else {
      pocketEl = pocket;
      pocketId = this.getIdForPocket(pocket as HTMLDivElement);
    }

    // Allow for either a movable instance or an array of elements to be added
    let pieces: SingleMovable[];
    if (movableOrArrayOfElements instanceof NodeList) {
      pieces = Array.from(movableOrArrayOfElements).map(
        element => this.BaseMovable.getMovableInstanceFromElement(element)
      ) as SingleMovable[];
    } else {
      pieces = Array.from(movableOrArrayOfElements.piecesInPocket);
    }

    pieces.forEach((instance) => {
      this.addSingleToPocket(pocket, instance);
    });
  }
}
