import BaseMovable from "./BaseMovable";
import { EVENT_TYPES } from "../constants";
import Puzzly from "./Puzzly";
import SingleMovable from "./SingleMovable";
import { InstanceTypes, MovableElement } from "../types";
import Utils from "../utils";

export class PocketMovable extends BaseMovable {
  instanceType = InstanceTypes.PocketMovable;
  piecesInPocket: SingleMovable[];
  activePocket?: HTMLDivElement;
  activePocketInnerElement = null;
  diffX: number;
  diffY: number;

  constructor(puzzleData: Puzzly) {
    super(puzzleData);

    this.puzzleId = puzzleData.puzzleId;

    window.Puzzly.Pockets.container.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this)
    );

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      const element = Utils.getPuzzlePieceElementFromEvent(event);
      if (element) {
        this.active = true;
        this.activePocket = this.getPocketByCollision(Utils.getEventBox(event));

        if (this.activePocket) {
          this.piecesInPocket =
            this.getPiecesInActivePocket();
          if (this.piecesInPocket.length > 0) {
            this.element = this.getMovingElementForActivePocket(event);

            this.piecesInPocket.forEach((piece) => piece.element.style.scale = "1")

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

            window.Puzzly.keepOnTop(this.element);

            (
              this.activePocket.querySelector(".pocket-inner") as HTMLDivElement
            ).prepend(this.element);
          }
        }

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

  onMouseUp(event: MouseEvent) {
    if (this.active) {
      if (this.isInsidePlayArea() && !this.isOverPockets(event)) {
        this.addToStage();
      } else if (this.isOverPockets(event)) {
        const pocket = this.getPocketByCollision(Utils.getEventBox(event));
        window.Puzzly.Pockets.addManyToPocket(pocket as HTMLDivElement, this);

        fetch('/api/puzzle/updatePieces', {
          method: 'PUT',
          headers: {
            "Content-Type": "Application/json",
          },
          body: JSON.stringify({
            pieces: this.piecesInPocket.map((piece) => piece.getDataForSave()),
            puzzleId: this.puzzleId,
          }),
        }).then(res => res.json())
          .then((response) => {
            // console.log('/api/puzzle/createPieces response', response);
          });
      } else if (!this.isInsidePlayArea() && !this.isOverPockets(event)) {
        window.Puzzly.Pockets.addManyToPocket(this.activePocket as HTMLDivElement, this);
      }

      this.element.removeEventListener('mousemove', this.onMouseMove);
      this.element.removeEventListener('mouseup', this.onMouseUp);

      this.save();
    }
  }

  // Create a container for all the pieces in a given pocket with the pieces arranged in a grid.
  // This container will be set as the movingElement.
  getMovingElementForActivePocket(event: MouseEvent) {
    const container = document.createElement("div");
    container.id = "active-pieces-container";
    // container.style.border = "1px solid white";
    container.style.position = "absolute";

    const rowLength =
      this.piecesInPocket.length > 2
        ? Math.ceil(Math.sqrt(this.piecesInPocket.length))
        : 2;

    let currX = 0,
      currY = 0;
    let colNumber = 1;
    let numRows = 0;
    let maxX = 0,
      maxY = 0,
      nextRowY = 0;

    let firstPieceOnRow = this.piecesInPocket[0].element;

    for (let i = 0, l = this.piecesInPocket.length; i < l; i++) {
      const el = this.piecesInPocket[i].element;

      el.style.top = currY + "px";
      el.style.left = currX + "px";

      // const box = el.getBoundingClientRect();
      // const box = Utils.getStyleBoundingBox(el);
      const box = {
        top: el.offsetTop,
        right: el.offsetLeft + el.offsetWidth,
        bottom: el.offsetTop + el.offsetHeight,
        left: el.offsetLeft,
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

    container.style.width = maxX + "px";
    container.style.height = maxY + "px";

    const pocketBox = (
      this.activePocket as HTMLDivElement
    ).getBoundingClientRect();

    const x = event.clientX - pocketBox.left - maxX / 2;
    const y = event.clientY - pocketBox.top - maxY / 2;

    container.style.top = y + "px";
    container.style.left = x + "px";

    return container;
  }

  getPiecesInActivePocket() {
    const pieceElements = (this.activePocket as HTMLDivElement).querySelectorAll(
      ".pocket-inner .puzzle-piece"
    );

    const instances = Array
      .from(pieceElements)
      .map(el => this.getMovableInstanceFromElement(el as MovableElement)) as SingleMovable[];

    return instances;
  }

  addToStage() {
    this.piecesInPocket.forEach((instance: SingleMovable) => {
      const element = instance.element;
      const playboundaryRect = (
        window.Puzzly.piecesContainer as HTMLDivElement
      ).getBoundingClientRect();
      const elRect = element.getBoundingClientRect();

      const pos = {
        x: elRect.left - playboundaryRect.left,
        y: elRect.top - playboundaryRect.top,
      };

      element.style.top = pos.y + "px";
      element.style.left = pos.x + "px";

      element.classList.remove("in-pocket");
      element.style.pointerEvents = "auto";

      instance.pocketId = null;
      instance.addToStage();
      instance.setLastPosition();
      instance.startListening();
    });

    fetch('/api/puzzle/updatePieces', {
      method: 'PUT',
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify({
        pieces: this.piecesInPocket.map((piece) => piece.getDataForSave()),
        puzzleId: this.puzzleId,
      }),
    }).then(res => res.json())
      .then((response) => {
        // console.log('/api/puzzle/createPieces response', response);
      });
  }

  getDataForSave() {
    return this.piecesInPocket.map((instance: SingleMovable) => instance.getDataForSave());
  }

  save() {
    if (this.active) {
      window.dispatchEvent(
        new CustomEvent(EVENT_TYPES.SAVE, { detail: this.getDataForSave() })
      );
      this.destroy();
    }
  }

  destroy() {
    this.element.remove();
    this.active = false;
    this.piecesInPocket = [];
  }
}
