import { MovementAxis } from "./types";

export interface RestrictedDraggableArguments {
  containerElement: HTMLElement;
  layout: {
    top: number;
    left: number;
    width: number;
    height: number;
    allowedMovementAxis?: MovementAxis | null;
  };
  id: string;
  restrictionBoundingBox:
  | {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }
  | undefined;
}

export default class RestrictedDraggable {
  element: HTMLElement;
  containerElement: HTMLElement;
  topBoundary: number;
  rightBoundary: number;
  bottomBoundary: number;
  leftBoundary: number;
  isMoving: boolean = false;
  diffX: number;
  diffY: number;
  allowedMovementAxis: MovementAxis | null | undefined;

  constructor({
    containerElement,
    layout,
    id,
    restrictionBoundingBox,
  }: RestrictedDraggableArguments) {
    this.containerElement = containerElement;
    this.element = this.createElement(id, layout);
    this.containerElement.append(this.element);
    this.allowedMovementAxis = layout.allowedMovementAxis;

    if (this.allowedMovementAxis) {
      this.setDragBounds(restrictionBoundingBox);
      this.attachListeners();
    }

    // this.element.style.position = "absolute";
    // this.element.style.top = "0";
    // this.element.style.left = "0";
    this.element.style.cursor = "move";
    this.element.style.backgroundColor = "#fff";
    this.element.style.opacity = ".3";
  }

  createElement(
    id: string,
    layout: { top: number; left: number; width: number; height: number; }
  ) {
    const element = document.createElement("div");
    element.id = id;
    element.classList.add("restricted-draggable");
    element.style.position = "absolute";
    element.style.top = layout.top + "px";
    element.style.left = layout.left + "px";
    element.style.width = layout.width + "px";
    element.style.height = layout.height + "px";
    return element;
  }

  setDragBounds(
    restrictionBoundingBox:
      | { top: number; right: number; bottom: number; left: number }
      | undefined
  ) {
    if (restrictionBoundingBox) {
      this.topBoundary = restrictionBoundingBox.top;
      this.rightBoundary = restrictionBoundingBox.right;
      this.bottomBoundary = restrictionBoundingBox.bottom;
      this.leftBoundary = restrictionBoundingBox.left;
    } else {
      this.topBoundary = 0;
      this.rightBoundary = this.containerElement.offsetWidth;
      this.bottomBoundary = this.containerElement.offsetHeight;
      this.leftBoundary = 0;
    }
  }

  update(layout: Pick<DOMRect, "top" | "left" | "width" | "height">) {
    const { top, left, width, height } = layout;
    this.element.style.top = top + "px";
    this.element.style.left = left + "px";
    this.element.style.width = width + "px";
    this.element.style.height = height + "px";
  }

  attachListeners() {
    this.element.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.element.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.element.addEventListener("mouseup", this.onMouseUp.bind(this));
  }

  onMouseDown(e: MouseEvent) {
    this.diffX = e.clientX - parseInt(this.element.style.left);
    this.diffY = e.clientY - parseInt(this.element.style.top);

    this.isMoving = true;
  }

  onMouseMove(e: MouseEvent) {
    if (this.isMoving) {
      const newXValue = e.clientX - this.diffX;
      const newYValue = e.clientY - this.diffY;

      const isWithinHorizontalBounds =
        newXValue >= this.leftBoundary &&
        newXValue + this.element.offsetWidth <= this.rightBoundary;

      const isWithinVerticalBounds =
        newYValue >= this.topBoundary &&
        newYValue + this.element.offsetHeight <= this.bottomBoundary;

      if (this.allowedMovementAxis === MovementAxis.X) {
        if (isWithinHorizontalBounds) {
          this.element.style.left = newXValue + "px";
        }
      } else if (this.allowedMovementAxis === MovementAxis.Y) {
        if (isWithinVerticalBounds) {
          this.element.style.top = e.clientY - this.diffY + "px";
        }
      } else {
        if (isWithinHorizontalBounds && isWithinVerticalBounds) {
          this.element.style.left = e.clientX - this.diffX + "px";
          this.element.style.top = e.clientY - this.diffY + "px";
        }
      }
    }
  }

  onMouseUp(e: MouseEvent) {
    if (this.isMoving) {
      window.dispatchEvent(
        new CustomEvent("PuzzlyPuzzleImpressionMoved", {
          detail: {
            left: parseInt(this.element.style.left) - this.leftBoundary,
            top: parseInt(this.element.style.top) - this.topBoundary,
          },
        })
      );

      this.isMoving = false;
    }
  }

  destroy() {
    if (this.element) {
      this.element.remove();
    }
  }
}
