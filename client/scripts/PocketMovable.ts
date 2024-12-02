import BaseMovable from "./BaseMovable";
import { EVENT_TYPES } from "./constants";
import Puzzly from "./Puzzly";
import SingleMovable from "./SingleMovable";
import { InstanceTypes, MovableElement } from "./types";
import Utils from "./utils";

export class PocketMovable extends BaseMovable {
  instanceType = InstanceTypes.PocketMovable;
  piecesInPocket: SingleMovable[];
  activePocket?: HTMLDivElement;
  activePocketInnerElement = null;

  constructor(puzzleData: Puzzly) {
    super(puzzleData);

    window.Puzzly.Pockets.container.addEventListener(
      "mousedown",
      this.onMouseDown.bind(this)
    );
  }

  onMouseDown(event: MouseEvent) {
    if (event.which === 1) {
      const element = Utils.getPuzzlePieceElementFromEvent(event);
      if (element) {
        this.active = true;
        this.activePocket = this.getPocketByCollision(Utils.getEventBox(event));
        if (this.activePocket) {
          this.piecesInPocket =
            this.getPiecesInActivePocket();
          if (this.piecesInPocket.length > 0) {
            this.element = this.getMovingElementForActivePocket(event);
            (
              this.activePocket.querySelector(".pocket-inner") as HTMLDivElement
            ).prepend(this.element);
          }
        }

        super.onPickup(event);
      }
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.active) {
      if (this.isInsidePlayArea() && !this.isOverPockets(event)) {
        this.addToStage();
      } else if (this.isOverPockets(event)) {
        const pocket = this.getPocketByCollision(Utils.getEventBox(event));
        window.Puzzly.Pockets.addManyToPocket(pocket as HTMLDivElement, this);
      } else if (!this.isInsidePlayArea() && !this.isOverPockets(event)) {
        window.Puzzly.Pockets.addManyToPocket(this.activePocket as HTMLDivElement, this);
      }

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

    console.log("pieces in active pocket", this.piecesInPocket)
    for (let i = 0, l = this.piecesInPocket.length; i < l; i++) {
      const el = this.piecesInPocket[i].element;

      //   // move(el).x(currX * this.zoomLevel).y(currY * this.zoomLevel).duration(this.animationDuration).end();
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

      (window.Puzzly.piecesContainer as HTMLDivElement).appendChild(element);
      element.classList.remove("in-pocket");
      element.setAttribute("data-pocket-id", "");
      element.style.pointerEvents = "auto";

      instance.pocketId = -1;

      // Events.notify(EVENT_TYPES.RETURN_TO_CANVAS, element);
    });

    this.save();
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
